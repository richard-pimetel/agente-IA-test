# 🚀 Guia de Início Rápido - Emergent AI

## Instalação e Primeiro Uso

### 1. Compilar o projeto

```bash
cd /app
yarn build
```

### 2. Inicializar

```bash
node dist/index.js init
```

### 3. Verificar configuração

```bash
node dist/index.js config --show
```

## ✅ Comandos Funcionando (Testados)

### 📋 Code Review

Analisa código automaticamente e detecta problemas comuns:

```bash
node dist/index.js review
```

**Output esperado:**
- Lista de arquivos revisados
- Problemas encontrados (console.log, TODOs, etc.)
- Sugestões de melhoria

### 📚 Geração de Documentação

Gera documentação automática do projeto:

```bash
# Markdown (padrão)
node dist/index.js doc

# HTML
node dist/index.js doc --format html

# JSON
node dist/index.js doc --format json
```

**Arquivos gerados:**
- `README-generated.markdown`
- `README-generated.html`  
- `README-generated.json`

### 🔙 Rollback

Desfaz mudanças em arquivos:

```bash
# Desfaz última operação
node dist/index.js rollback

# Desfaz últimas 3 operações
node dist/index.js rollback --steps 3
```

### ⚙️ Configuração

Ver configurações atuais:

```bash
node dist/index.js config --show
```

### 🚀 Deploy (Mockado)

Pipeline de deploy simulado:

```bash
# Deploy completo
node dist/index.js deploy

# Deploy sem testes
node dist/index.js deploy --skip-tests
```

## 📝 Exemplos Práticos

### Exemplo 1: Review de Código

```bash
# Criar arquivo de teste
echo "console.log('test'); // TODO: fix" > test.js

# Executar review
node dist/index.js review

# Output mostrará:
# ⚠️  test.js: Contém console.log (remover em produção)
# ⚠️  test.js: Contém comentários TODO/FIXME
```

### Exemplo 2: Gerar Documentação

```bash
# Gerar doc em Markdown
node dist/index.js doc --format markdown

# Visualizar
cat README-generated.markdown
```

### Exemplo 3: Pipeline Completo

```bash
# 1. Inicializar
node dist/index.js init

# 2. Fazer code review
node dist/index.js review

# 3. Gerar documentação
node dist/index.js doc

# 4. Deploy
node dist/index.js deploy
```

## 🔧 Ferramentas MCP Disponíveis

As 6 ferramentas MCP estão implementadas e prontas:

1. **read_files** - Lê arquivos usando glob patterns
2. **write_code** - Escreve código com backup
3. **execute_command** - Executa comandos shell seguros
4. **analyze_project** - Analisa estrutura do projeto
5. **git_operations** - Operações git (status, commit, diff, log)
6. **test_code** - Executa testes do projeto

## 📊 Workflows N8N (Mockados)

Três workflows estão implementados em modo mock:

### 1. Code Review (`/workflows/code-review.json`)

Detecta:
- `console.log` em produção
- Comentários TODO/FIXME
- Excesso de imports
- Problemas de qualidade

### 2. Documentation (`/workflows/documentation.json`)

Gera:
- Visão geral do projeto
- Lista de tecnologias
- Estrutura de arquivos
- Dependências
- Instruções de execução

### 3. Deploy (`/workflows/deploy.json`)

Pipeline:
- Build do projeto
- Execução de testes (opcional)
- Deploy para staging
- Verificação de saúde
- Deploy para produção

## 🎯 Casos de Uso

### Para Desenvolvedores

```bash
# Durante desenvolvimento
node dist/index.js review              # Revisar código
node dist/index.js doc                 # Atualizar docs
```

### Para QA

```bash
# Antes de release
node dist/index.js review              # Validar qualidade
node dist/index.js deploy --skip-tests # Simular deploy
```

### Para DevOps

```bash
# Pipeline CI/CD
node dist/index.js init
node dist/index.js review
node dist/index.js deploy
```

## 🔐 Segurança

Todos os comandos implementam:

- ✅ **Path validation** - Previne path traversal
- ✅ **Command sanitization** - Bloqueia comandos perigosos
- ✅ **Automatic backups** - Backup antes de mudanças
- ✅ **Confirmation prompts** - Para operações críticas

## 📁 Estrutura de Backups

Todos os arquivos modificados são salvos em:

```
.emergent-backups/
├── history.json
├── file.js.2025-01-15T10-30-45.abc123.backup
└── ...
```

## 🐛 Troubleshooting

### Comando não funciona

Certifique-se que compilou:
```bash
yarn build
```

### Erro de permissão

Use caminhos relativos ou absolutos corretos.

### N8N não conecta

Por padrão está em modo mock (`N8N_ENABLED=false`). Está funcionando corretamente!

## 📚 Recursos

- **README principal:** `/app/README.md`
- **Workflows N8N:** `/app/workflows/*.json`
- **Código fonte:** `/app/src/**`
- **Build:** `/app/dist/**`

## 🎓 Próximos Passos

1. Testar todos os comandos
2. Personalizar workflows N8N
3. Adicionar seus próprios comandos
4. Integrar com N8N real (opcional)

## 📞 Suporte

Para dúvidas sobre:
- **MCP:** https://modelcontextprotocol.io/
- **N8N:** https://docs.n8n.io/
- **Anthropic:** https://docs.anthropic.com/

---

**Emergent AI** - Sistema de IA para programação via terminal 🤖
