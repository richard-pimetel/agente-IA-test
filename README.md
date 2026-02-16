# 🤖 Emergent AI - Agente de Programação via Terminal

Sistema CLI de geração de código interativo com integração **MCP (Model Context Protocol)** e **N8N** para automações.

## 🚀 Recursos Principais

- ✅ **CLI Interativo** - Interface de linha de comando completa
- ✅ **MCP Integration** - Comunicação com Claude AI via Model Context Protocol
- ✅ **6 Ferramentas MCP** - read_files, write_code, execute_command, analyze_project, git_operations, test_code
- ✅ **N8N Workflows** - Code review, documentação automática, pipeline de deploy
- ✅ **Streaming em Tempo Real** - Respostas da IA em tempo real
- ✅ **Backup Automático** - Todas alterações são salvas com backup
- ✅ **Rollback** - Desfaz mudanças facilmente
- ✅ **Context Caching** - Otimização de tokens

## 📋 Stack Técnica

- **Node.js 18+** + **TypeScript**
- **@modelcontextprotocol/sdk** - MCP oficial
- **@anthropic-ai/sdk** - Claude AI (Sonnet 4.5)
- **Commander** - CLI framework
- **Inquirer** - Interação com usuário
- **Chalk** - Cores no terminal
- **N8N** - Automações (mockado por padrão)
- **Simple Git** - Operações git
- **Fast-glob** - Busca de arquivos

## 📁 Estrutura do Projeto

```
/app
├── /src
│   ├── /mcp
│   │   ├── server.ts         # MCP Server
│   │   ├── client.ts         # MCP Client
│   │   └── tools.ts          # 6 ferramentas MCP
│   ├── /n8n
│   │   ├── integration.ts    # Integração N8N (mock + real)
│   │   └── mock-workflows.ts
│   ├── /core
│   │   ├── cli.ts            # Comandos CLI
│   │   ├── ai-service.ts     # Serviço Claude AI
│   │   ├── file-manager.ts   # Gerenciamento de arquivos
│   │   └── context-builder.ts # Análise de contexto
│   ├── index.ts              # Entry point
│   └── config.ts             # Configurações
├── /workflows                # N8N workflows JSON
│   ├── code-review.json
│   ├── auto-deploy.json
│   └── documentation.json
├── /dist                     # Build TypeScript
├── mcp.json                  # Config MCP
├── package.json
├── tsconfig.json
├── .env                      # Variáveis de ambiente
└── README.md
```

## ⚙️ Instalação

### 1. Clone ou acesse o projeto

```bash
cd /app
```

### 2. Instalar dependências

```bash
yarn install
```

### 3. Configurar variáveis de ambiente

O arquivo `.env` já está configurado com a **Emergent LLM Key**:

```bash
# Já configurado automaticamente
EMERGENT_LLM_KEY=sk-emergent-0EaF19e29A944EcBbF
ANTHROPIC_API_KEY=sk-emergent-0EaF19e29A944EcBbF

# N8N (mockado por padrão - não precisa configurar)
N8N_ENABLED=false
```

### 4. Compilar TypeScript

```bash
yarn build
```

### 5. Inicializar projeto

```bash
node dist/index.js init
```

## 🎯 Comandos Disponíveis

### `emergent init`

Inicializa o projeto com configurações MCP.

```bash
node dist/index.js init

# Forçar reinicialização
node dist/index.js init --force
```

### `emergent generate <prompt>`

Gera código usando Claude AI via MCP.

```bash
# Geração básica
node dist/index.js generate "criar função de fibonacci em JavaScript"

# Com caminho de saída específico
node dist/index.js generate "criar API REST em Express" --output server.js

# Com streaming (padrão)
node dist/index.js generate "criar componente React" --stream
```

**Exemplo de uso:**

```bash
$ node dist/index.js generate "criar função para validar CPF"

🤖 Gerando código...
✓ Contexto construído
✓ Consultando Claude AI via MCP...

──────────────────────────────────────────────────

function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  // Validação do primeiro dígito
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let digito1 = 11 - (soma % 11);
  if (digito1 > 9) digito1 = 0;
  
  if (parseInt(cpf.charAt(9)) !== digito1) return false;
  
  // Validação do segundo dígito
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  let digito2 = 11 - (soma % 11);
  if (digito2 > 9) digito2 = 0;
  
  return parseInt(cpf.charAt(10)) === digito2;
}

──────────────────────────────────────────────────

? Deseja salvar o código gerado? Yes
? Caminho do arquivo: validar-cpf.js

✓ Código salvo em: validar-cpf.js

Tokens: 145 in, 423 out
```

### `emergent review`

Executa code review automático.

```bash
# Review de todo o projeto
node dist/index.js review

# Review de caminho específico
node dist/index.js review --path src/
```

### `emergent doc`

Gera documentação automática.

```bash
# Markdown (padrão)
node dist/index.js doc

# HTML
node dist/index.js doc --format html

# JSON
node dist/index.js doc --format json
```

### `emergent deploy`

Executa pipeline de deploy.

```bash
# Deploy completo com testes
node dist/index.js deploy

# Deploy sem testes
node dist/index.js deploy --skip-tests
```

### `emergent rollback`

Desfaz mudanças.

```bash
# Desfaz última operação
node dist/index.js rollback

# Desfaz últimas 3 operações
node dist/index.js rollback --steps 3
```

### `emergent config`

Gerencia configurações.

```bash
# Ver configuração atual
node dist/index.js config --show

# Resetar configurações
node dist/index.js config --reset
```

## 🔧 Ferramentas MCP

### 1. **read_files**

Lê arquivos do projeto usando glob patterns.

```javascript
await mcpClient.callTool('read_files', {
  patterns: ['src/**/*.ts'],
  baseDir: '.'
});
```

### 2. **write_code**

Escreve código gerado com backup automático.

```javascript
await mcpClient.callTool('write_code', {
  filePath: 'output.js',
  content: 'console.log("Hello");',
  createBackup: true
});
```

### 3. **execute_command**

Executa comandos shell com segurança.

```javascript
await mcpClient.callTool('execute_command', {
  command: 'npm test',
  cwd: '.'
});
```

### 4. **analyze_project**

Analisa estrutura completa do projeto.

```javascript
await mcpClient.callTool('analyze_project', {
  rootDir: '.'
});
```

### 5. **git_operations**

Operações git (status, commit, diff, log).

```javascript
await mcpClient.callTool('git_operations', {
  operation: 'commit',
  options: { message: 'feat: add new feature' }
});
```

### 6. **test_code**

Executa testes do projeto.

```javascript
await mcpClient.callTool('test_code', {
  testCommand: 'npm test',
  cwd: '.'
});
```

## 🔄 Workflows N8N

### Code Review Workflow (`code-review.json`)

**Trigger:** Código gerado ou mudanças em arquivos

**Passos:**
1. Recebe arquivos via webhook
2. Analisa código (console.log, TODOs, imports)
3. Claude AI faz análise detalhada
4. Retorna lista de issues e sugestões

### Documentation Workflow (`documentation.json`)

**Trigger:** Comando `emergent doc`

**Passos:**
1. Recebe análise do projeto
2. Claude gera documentação em formato especificado
3. Atualiza README.md
4. Retorna conteúdo gerado

### Deploy Pipeline (`deploy.json`)

**Trigger:** Comando `emergent deploy`

**Passos:**
1. Build do projeto (`npm run build`)
2. Executa testes (se não skipado)
3. Deploy para staging
4. Verificação de saúde
5. Deploy para produção
6. Notificação de sucesso

## 🎨 Exemplo Completo de Uso

```bash
# 1. Inicializar projeto
node dist/index.js init

# 2. Gerar código
node dist/index.js generate "criar servidor Express com rotas CRUD"

# 3. Revisar código gerado
node dist/index.js review

# 4. Gerar documentação
node dist/index.js doc --format markdown

# 5. Deploy
node dist/index.js deploy

# Se algo der errado, rollback
node dist/index.js rollback
```

## 🔐 Segurança

- **Path Validation:** Previne path traversal attacks
- **Command Sanitization:** Bloqueia comandos perigosos
- **Backup Automático:** Todas mudanças têm backup
- **Confirmações:** Operações críticas requerem confirmação
- **Rate Limiting:** Protege contra uso excessivo da API

## 🧪 Testando o Sistema

### Teste 1: Geração de Código

```bash
node dist/index.js generate "criar função para calcular fatorial"
```

### Teste 2: Code Review

```bash
# Primeiro, crie um arquivo com problemas
echo "console.log('test'); // TODO: fix this" > test.js

# Execute review
node dist/index.js review
```

### Teste 3: Documentação

```bash
node dist/index.js doc --format markdown
```

### Teste 4: Rollback

```bash
# Gere um arquivo
node dist/index.js generate "teste" --output test.js

# Desfaça
node dist/index.js rollback
```

## 📊 MCP Server

O MCP Server roda automaticamente quando você usa os comandos. Para iniciar manualmente:

```bash
node dist/mcp/server.js
```

Configuração em `mcp.json`:

```json
{
  "mcpServers": {
    "emergent-ai": {
      "command": "node",
      "args": ["dist/mcp/server.js"],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}"
      }
    }
  }
}
```

## 🔄 N8N Real vs Mock

**Por padrão, N8N está em modo MOCK** (não precisa de servidor N8N rodando).

Para usar N8N real:

1. Instale e configure N8N:
```bash
npm install -g n8n
n8n start
```

2. Importe workflows do diretório `/workflows`

3. Configure `.env`:
```bash
N8N_ENABLED=true
N8N_API_KEY=your-api-key
N8N_WEBHOOK_URL=http://localhost:5678/webhook
N8N_API_URL=http://localhost:5678/api/v1
```

4. Reinicie o CLI

## 📝 Desenvolvimento

### Executar em modo dev

```bash
yarn dev
```

### Build

```bash
yarn build
```

### Adicionar nova ferramenta MCP

1. Edite `src/mcp/tools.ts`
2. Adicione função da ferramenta
3. Registre em `src/mcp/server.ts`
4. Rebuild: `yarn build`

### Adicionar novo comando CLI

1. Edite `src/core/cli.ts`
2. Adicione função do comando
3. Registre em `src/index.ts`
4. Rebuild: `yarn build`

## 🐛 Troubleshooting

### Erro: "ANTHROPIC_API_KEY não configurada"

Verifique se `.env` contém:
```bash
EMERGENT_LLM_KEY=sk-emergent-0EaF19e29A944EcBbF
ANTHROPIC_API_KEY=sk-emergent-0EaF19e29A944EcBbF
```

### Erro: "MCP Server não conecta"

1. Certifique-se que o build foi feito: `yarn build`
2. Verifique se `dist/mcp/server.js` existe
3. Teste manualmente: `node dist/mcp/server.js`

### Erro: "N8N workflow falhou"

Se `N8N_ENABLED=true`, verifique:
1. N8N está rodando? (`n8n start`)
2. Workflows foram importados?
3. URLs corretas em `.env`?

Se `N8N_ENABLED=false` (mock), não deveria dar erro.

### "Command not found: emergent"

Use o caminho completo:
```bash
node dist/index.js <comando>
```

Ou instale globalmente:
```bash
npm link
emergent <comando>
```

## 📦 Estrutura de Dados

### ProjectContext

```typescript
interface ProjectContext {
  summary: string;
  fileCount: number;
  languages: string[];
  frameworks: string[];
  structure: Record<string, string[]>;
  recentFiles: string[];
  dependencies?: any;
}
```

### AIResponse

```typescript
interface AIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}
```

### WorkflowResult

```typescript
interface WorkflowResult {
  success: boolean;
  summary: string;
  data?: any;
  issues?: string[];
  errors?: string[];
  content?: string;
}
```

## 🎓 Recursos Adicionais

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [N8N Documentation](https://docs.n8n.io/)
- [Commander.js](https://github.com/tj/commander.js)

## 📄 Licença

MIT License - Emergent AI

## 🤝 Contribuindo

Contribuições são bem-vindas! Este é um projeto MVP desenvolvido com foco em funcionalidade.

---

**Desenvolvido por Emergent AI** 🚀

*Sistema de geração de código via terminal com MCP e N8N*
