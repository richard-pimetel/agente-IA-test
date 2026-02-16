import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import { AIService } from './ai-service';
import { FileManager } from './file-manager';
import { ContextBuilder } from './context-builder';
import { N8NIntegration } from '../n8n/integration';
import { config } from '../config';
import { promises as fs } from 'fs';

const aiService = new AIService();
const fileManager = new FileManager();
const contextBuilder = new ContextBuilder();
const n8nIntegration = new N8NIntegration();

/**
 * Comando: emergent init
 */
export async function initCommand(options: any): Promise<void> {
  console.log(chalk.cyan.bold('\n🚀 Inicializando Emergent AI...\n'));

  const spinner = ora('Inicializando...').start();

  try {
    // Inicializa FileManager
    await fileManager.initialize();
    spinner.succeed('FileManager inicializado');

    // Verifica se já existe configuração
    const configPath = '.emergent-config.json';
    try {
      await fs.access(configPath);
      if (!options.force) {
        spinner.warn('Projeto já inicializado. Use --force para reinicializar.');
        return;
      }
    } catch {
      // Config não existe
    }

    // Cria configuração
    const projectConfig = {
      initialized: new Date().toISOString(),
      version: '1.0.0',
      mcpEnabled: true,
      n8nEnabled: config.n8nEnabled,
    };

    await fs.writeFile(configPath, JSON.stringify(projectConfig, null, 2));
    spinner.succeed('Configuração criada');

    console.log(
      boxen(
        chalk.green.bold('✅ Emergent AI inicializado com sucesso!\n\n') +
          'Próximos passos:\n' +
          chalk.cyan('  emergent generate "criar função de fibonacci"\n') +
          chalk.cyan('  emergent review\n') +
          chalk.cyan('  emergent doc\n'),
        { padding: 1, borderColor: 'green' }
      )
    );
  } catch (error: any) {
    spinner.fail(`Erro: ${error.message}`);
  }
}

/**
 * Comando: emergent generate <prompt>
 */
export async function generateCommand(prompt: string, options: any): Promise<void> {
  console.log(chalk.cyan.bold('\n🤖 Gerando código...\n'));

  const spinner = ora('Construindo contexto do projeto...').start();

  try {
    // Constrói contexto
    const context = await contextBuilder.buildOptimizedContext();
    spinner.succeed('Contexto construído');

    spinner.start('Consultando Claude AI via MCP...');

    // Gera código com AI
    console.log('\n' + chalk.gray('─'.repeat(50)) + '\n');
    const response = await aiService.generateCode(prompt, context, options.stream);
    console.log('\n' + chalk.gray('─'.repeat(50)) + '\n');

    spinner.succeed('Código gerado');

    // Pergunta se quer salvar
    const { shouldSave } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldSave',
        message: 'Deseja salvar o código gerado?',
        default: true,
      },
    ]);

    if (shouldSave) {
      let outputPath = options.output;

      if (!outputPath) {
        const { path } = await inquirer.prompt([
          {
            type: 'input',
            name: 'path',
            message: 'Caminho do arquivo:',
            default: 'output.txt',
          },
        ]);
        outputPath = path;
      }

      await fileManager.writeFile(outputPath, response.content);
      console.log(chalk.green(`\n✅ Código salvo em: ${outputPath}\n`));
    }

    // Exibe uso de tokens
    if (response.usage) {
      console.log(
        chalk.gray(
          `\nTokens: ${response.usage.inputTokens} in, ${response.usage.outputTokens} out\n`
        )
      );
    }
  } catch (error: any) {
    spinner.fail(`Erro: ${error.message}`);
  }
}

/**
 * Comando: emergent review
 */
export async function reviewCommand(_options: any): Promise<void> {
  console.log(chalk.cyan.bold('\n🔍 Executando code review...\n'));

  const spinner = ora('Analisando código...').start();

  try {
    // Encontra arquivos de código
    const files = await contextBuilder.findFiles('**/*.{js,ts,py,go,rs}');

    if (files.length === 0) {
      spinner.warn('Nenhum arquivo de código encontrado');
      return;
    }

    spinner.text = `Revisando ${files.length} arquivo(s)...`;

    // Executa review via N8N (mockado)
    const reviewResult = await n8nIntegration.triggerWorkflow('code-review', {
      files,
      project: await contextBuilder.buildContext(),
    });

    spinner.succeed('Review concluído');

    console.log('\n' + chalk.bold('📋 Resultado do Review:\n'));
    console.log(reviewResult.summary);

    if (reviewResult.issues && reviewResult.issues.length > 0) {
      console.log('\n' + chalk.yellow.bold('⚠️  Problemas encontrados:\n'));
      reviewResult.issues.forEach((issue: any, i: number) => {
        console.log(chalk.yellow(`${i + 1}. ${issue}`));
      });
    } else {
      console.log(chalk.green('\n✅ Nenhum problema encontrado!\n'));
    }
  } catch (error: any) {
    spinner.fail(`Erro: ${error.message}`);
  }
}

/**
 * Comando: emergent doc
 */
export async function docCommand(options: any): Promise<void> {
  console.log(chalk.cyan.bold('\n📚 Gerando documentação...\n'));

  const spinner = ora('Analisando projeto...').start();

  try {
    const projectContext = await contextBuilder.buildContext();
    spinner.succeed('Projeto analisado');

    spinner.start('Gerando documentação via N8N...');

    // Gera documentação via N8N (mockado)
    const docResult = await n8nIntegration.triggerWorkflow('documentation', {
      project: projectContext,
      format: options.format,
    });

    spinner.succeed('Documentação gerada');

    const outputFile = `README-generated.${(options.format as string) || 'markdown'}`;
    await fileManager.writeFile(outputFile, docResult.content);

    console.log(chalk.green(`\n✅ Documentação salva em: ${outputFile}\n`));
  } catch (error: any) {
    spinner.fail(`Erro: ${error.message}`);
  }
}

/**
 * Comando: emergent deploy
 */
export async function deployCommand(options: any): Promise<void> {
  console.log(chalk.cyan.bold('\n🚀 Iniciando deploy...\n'));

  const spinner = ora('Preparando deploy...').start();

  try {
    // Pipeline de deploy via N8N (mockado)
    const deployResult = await n8nIntegration.triggerWorkflow('deploy', {
      skipTests: options.skipTests,
    });

    spinner.succeed('Deploy pipeline executado');

    console.log('\n' + chalk.bold('📦 Resultado do Deploy:\n'));
    console.log(deployResult.summary);

    if (deployResult.success) {
      console.log(chalk.green('\n✅ Deploy concluído com sucesso!\n'));
    } else {
      console.log(chalk.red('\n❌ Deploy falhou\n'));
      if (deployResult.errors) {
        deployResult.errors.forEach((err: string) => {
          console.log(chalk.red(`  - ${err}`));
        });
      }
    }
  } catch (error: any) {
    spinner.fail(`Erro: ${error.message}`);
  }
}

/**
 * Comando: emergent rollback
 */
export async function rollbackCommand(options: any): Promise<void> {
  console.log(chalk.cyan.bold('\n⏪ Executando rollback...\n'));

  const steps = parseInt(options.steps);

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Deseja desfazer as últimas ${steps} operação(ões)?`,
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.yellow('\nOperação cancelada\n'));
    return;
  }

  const spinner = ora('Desfazendo mudanças...').start();

  try {
    const operations = await fileManager.rollback(steps);
    spinner.succeed(`${operations.length} operação(ões) desfeita(s)`);

    console.log('\n' + chalk.bold('📋 Mudanças desfeitas:\n'));
    operations.forEach((op) => {
      console.log(chalk.gray(`  ${op.type}: ${op.path}`));
    });
    console.log();
  } catch (error: any) {
    spinner.fail(`Erro: ${error.message}`);
  }
}

/**
 * Comando: emergent config
 */
export async function configCommand(options: any): Promise<void> {
  if (options.show) {
    console.log(chalk.cyan.bold('\n⚙️  Configuração Atual:\n'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.bold('API Keys:'));
    console.log(`  Emergent LLM Key: ${config.emergentLlmKey ? chalk.green('✓ Configurada') : chalk.red('✗ Não configurada')}`);
    console.log(`  Anthropic API Key: ${config.anthropicApiKey ? chalk.green('✓ Configurada') : chalk.red('✗ Não configurada')}`);
    console.log();
    console.log(chalk.bold('N8N:'));
    console.log(`  Enabled: ${config.n8nEnabled ? chalk.green('Sim') : chalk.yellow('Não (usando mock)')}`);
    console.log(`  API URL: ${config.n8nApiUrl}`);
    console.log();
    console.log(chalk.bold('Projeto:'));
    console.log(`  Root: ${config.projectRoot}`);
    console.log(`  Backup Dir: ${config.backupDir}`);
    console.log(chalk.gray('─'.repeat(50)) + '\n');
    return;
  }

  if (options.reset) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Resetar configuração para padrões?',
        default: false,
      },
    ]);

    if (confirm) {
      console.log(chalk.yellow('\n⚠️  Para resetar, delete o arquivo .env e reconfigure\n'));
    }
    return;
  }

  console.log(chalk.cyan('\nUse --show para ver configuração ou --reset para resetar\n'));
}
