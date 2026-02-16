#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { validateConfig } from './config';
import {
  initCommand,
  generateCommand,
  reviewCommand,
  docCommand,
  deployCommand,
  rollbackCommand,
  configCommand,
} from './core/cli';

const program = new Command();

// Valida configuração
const validation = validateConfig();
if (!validation.valid) {
  console.error(chalk.red('\n❌ Erro de Configuração:'));
  validation.errors.forEach(err => console.error(chalk.red(`  - ${err}`)));
  console.error(chalk.yellow('\nConfigure as variáveis em .env antes de continuar.\n'));
  process.exit(1);
}

// Configuração do CLI
program
  .name('emergent')
  .description('Agente de IA para programação via terminal com integração MCP')
  .version('1.0.0');

// Comando: init
program
  .command('init')
  .description('Inicializa projeto com MCP e configurações')
  .option('-f, --force', 'Força reinicialização mesmo se já existir')
  .action(initCommand);

// Comando: generate
program
  .command('generate <prompt>')
  .description('Gera código via MCP e Claude AI')
  .option('-o, --output <path>', 'Caminho de saída para o código gerado')
  .option('-s, --stream', 'Exibe resposta em tempo real', true)
  .action(generateCommand);

// Comando: review
program
  .command('review')
  .description('Executa code review automático (via N8N mock)')
  .option('-p, --path <path>', 'Caminho específico para revisar')
  .action(reviewCommand);

// Comando: doc
program
  .command('doc')
  .description('Gera documentação automática do projeto')
  .option('-f, --format <format>', 'Formato: markdown, html, json', 'markdown')
  .action(docCommand);

// Comando: deploy
program
  .command('deploy')
  .description('Pipeline de deploy com build e testes')
  .option('--skip-tests', 'Pula execução de testes')
  .action(deployCommand);

// Comando: rollback
program
  .command('rollback')
  .description('Desfaz última mudança aplicada')
  .option('-n, --steps <number>', 'Número de passos para voltar', '1')
  .action(rollbackCommand);

// Comando: config
program
  .command('config')
  .description('Configura MCP e N8N')
  .option('--show', 'Exibe configuração atual')
  .option('--reset', 'Reseta para padrões')
  .action(configCommand);

// Parse dos argumentos
program.parse(process.argv);

// Se nenhum comando foi especificado, exibe help
if (!process.argv.slice(2).length) {
  console.log(chalk.cyan.bold('\n🤖 Emergent AI - Agente de Programação\n'));
  program.outputHelp();
}
