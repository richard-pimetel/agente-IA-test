# 🤖 Emergent AI - Interface Web para Geração de Código

Interface web tipo ChatGPT para gerar código usando **Groq AI (GRÁTIS!)** com histórico MongoDB.

## 🚀 Como Usar (Windows)

### 1️⃣ Iniciar Backend (Terminal 1)

```powershell
# Ir para pasta backend
cd C:\Users\richa\Downloads\agente-IA-test\backend-api

# Instalar dependências (primeira vez)
npm install

# Iniciar API
npm start
```

**Deve aparecer:**
```
✅ MongoDB conectado!  (ou "usando memória" se não tiver MongoDB)
🚀 API rodando em http://localhost:5000
```

### 2️⃣ Iniciar Frontend (Terminal 2 - NOVO)

```powershell
# Abrir NOVO terminal PowerShell

# Ir para pasta frontend
cd C:\Users\richa\Downloads\agente-IA-test\frontend-web

# Instalar dependências (primeira vez)
npm install

# Iniciar React
npm start
```

**Vai abrir automaticamente:** http://localhost:3000

---

## 🎨 Interface

```
┌───────────────────────────────────────────┐
│ 🤖 Emergent AI Code Generator             │
├───────────────────────────────────────────┤
│                                           │
│  💬 Você: criar função validar CPF        │
│                                           │
│  🤖 IA:                                   │
│  ┌─────────────────────────────────────┐ │
│  │ javascript         [📋 Copy] [⬇️ Down]│ │
│  │ function validarCPF(cpf) {          │ │
│  │   // código aqui...                 │ │
│  │ }                                   │ │
│  └─────────────────────────────────────┘ │
│                                           │
├───────────────────────────────────────────┤
│ [Digite aqui...]                     [▶️] │
└───────────────────────────────────────────┘
```

---

## ✨ Funcionalidades

### ✅ Implementadas

- [x] **Chat em tempo real** - Interface tipo ChatGPT
- [x] **Syntax highlighting** - Código colorido
- [x] **Copiar código** - 1 clique para copiar
- [x] **Baixar código** - Download como arquivo .js
- [x] **Histórico** - Últimas 10 gerações
- [x] **Sidebar** - Ver e carregar do histórico
- [x] **Dark mode** - Design moderno escuro
- [x] **Loading animation** - Feedback visual
- [x] **Auto-scroll** - Rola automaticamente
- [x] **Responsive** - Funciona em mobile

### 🔄 MongoDB (Opcional)

- Se **tiver MongoDB** instalado → Histórico salvo permanente
- Se **NÃO tiver** → Funciona normal, histórico só na sessão

---

## 📁 Estrutura

```
/agente-IA-test/
├── /backend-api/         ← API Express
│   ├── server.js         ← Servidor principal
│   ├── package.json
│   └── .env              ← Configurações (Groq key)
│
└── /frontend-web/        ← React App
    ├── /src
    │   ├── App.js        ← Componente principal
    │   └── App.css       ← Estilos
    ├── /public
    └── package.json
```

---

## 🔧 Troubleshooting

### Backend não inicia

```powershell
# Verificar se porta 5000 está livre
netstat -ano | findstr :5000

# Se estiver em uso, mude a porta em backend-api/.env
API_PORT=5001
```

### Frontend não conecta

Verifique se backend está rodando:
```
http://localhost:5000/api/health
```

Deve retornar:
```json
{
  "success": true,
  "message": "API funcionando!",
  "mongodb": "conectado",
  "groq": "configurado"
}
```

### MongoDB não conectado

**Não é problema!** A aplicação funciona sem MongoDB.

Se quiser usar MongoDB:

**Opção 1: Local**
```powershell
# Instalar MongoDB
choco install mongodb

# Iniciar
mongod
```

**Opção 2: MongoDB Atlas (Cloud Grátis)**
1. Acesse: https://www.mongodb.com/cloud/atlas/register
2. Crie cluster grátis
3. Copie connection string
4. Cole em `backend-api/.env`:
```
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/emergent-ai
```

---

## 🎯 Endpoints da API

### POST /api/generate
Gera código

**Request:**
```json
{
  "prompt": "criar função para validar CPF",
  "language": "javascript"
}
```

**Response:**
```json
{
  "success": true,
  "code": "function validarCPF(cpf) {...}",
  "language": "javascript",
  "tokens": {
    "input": 50,
    "output": 200
  }
}
```

### GET /api/history
Lista histórico

**Response:**
```json
{
  "success": true,
  "count": 10,
  "history": [...]
}
```

### DELETE /api/history/:id
Deleta item do histórico

### DELETE /api/history
Limpa todo histórico

---

## 🧪 Testar API Manualmente

```powershell
# Health check
Invoke-RestMethod -Uri http://localhost:5000/api/health

# Gerar código
$body = @{
    prompt = "criar função hello world"
    language = "javascript"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5000/api/generate -Method Post -Body $body -ContentType "application/json"

# Ver histórico
Invoke-RestMethod -Uri http://localhost:5000/api/history
```

---

## 💡 Dicas de Uso

### Prompts Bons

✅ **Específico:**
```
criar função para validar email em JavaScript com regex
```

✅ **Com contexto:**
```
criar API REST em Express com rota de login usando JWT
```

❌ **Muito vago:**
```
criar código
```

### Exemplos Prontos

Clique nos botões de exemplo na tela inicial:
- Validar CPF
- API REST
- Componente React

---

## 🎨 Personalizar

### Mudar Cores

Edite `frontend-web/src/App.css`:

```css
/* Cor principal */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Mudar para verde */
background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%);
```

### Adicionar Linguagens

Edite `backend-api/server.js`:

```javascript
const { prompt, language = 'javascript' } = req.body;

// Aceita: javascript, python, typescript, go, etc.
```

---

## 📊 Monitoramento

### Ver Logs Backend

```powershell
# Backend mostra logs em tempo real
cd backend-api
npm start

# Saída:
# 📝 Gerando código: "criar função..."
# ✅ Código salvo no histórico
```

### Ver Uso de Tokens

Aparece em cada resposta:
```
Tokens: 50 in / 200 out
```

---

## 🚀 Deploy (Opcional)

### Backend (Railway/Render)

1. Fazer push para GitHub
2. Conectar no Railway.app ou Render.com
3. Adicionar variáveis:
   - `GROQ_API_KEY`
   - `MONGODB_URI`

### Frontend (Vercel/Netlify)

1. Build: `npm run build`
2. Deploy pasta `build/`
3. Configurar variável:
   - `REACT_APP_API_URL=https://sua-api.railway.app`

---

## 🆘 Suporte

### Erro Comum 1: CORS

Se frontend não conectar no backend, verifique CORS em `server.js`:

```javascript
app.use(cors()); // Já configurado!
```

### Erro Comum 2: Porta em uso

```powershell
# Mudar porta do backend
# Em backend-api/.env:
API_PORT=5001

# Atualizar no frontend
# Em frontend-web/src/App.js:
const API_URL = 'http://localhost:5001/api';
```

---

## ✅ Checklist de Instalação

- [ ] Node.js instalado
- [ ] Backend rodando (porta 5000)
- [ ] Frontend rodando (porta 3000)
- [ ] Browser aberto em http://localhost:3000
- [ ] Groq API key configurada
- [ ] MongoDB (opcional)

---

## 🎉 Pronto!

Acesse: **http://localhost:3000**

Digite: "criar função hello world"

E veja a mágica acontecer! ✨

---

**Desenvolvido com Emergent AI** 🤖
