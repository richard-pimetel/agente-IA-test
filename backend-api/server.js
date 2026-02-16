const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.API_PORT || 5000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/emergent-ai';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado!'))
  .catch(err => {
    console.log('⚠️  MongoDB não conectado (usando memória):', err.message);
    console.log('💡 Para usar MongoDB: instale localmente ou use MongoDB Atlas');
  });

// Schema do MongoDB
const CodeSchema = new mongoose.Schema({
  prompt: { type: String, required: true },
  code: { type: String, required: true },
  language: { type: String, default: 'javascript' },
  timestamp: { type: Date, default: Date.now },
  tags: [String],
  userId: { type: String, default: 'default' }
});

const Code = mongoose.model('Code', CodeSchema);

// Groq Service
const Groq = require('groq-sdk');
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// ROTA: Gerar código
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, language = 'javascript', stream = false } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt é obrigatório' });
    }

    console.log(`📝 Gerando código: "${prompt}"`);

    // Gerar código com Groq
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente especializado em gerar código ${language}. 
Sempre responda apenas com o código solicitado, bem formatado e com comentários explicativos.
Não adicione explicações antes ou depois do código, apenas o código puro.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2048,
      stream: false
    });

    const code = completion.choices[0]?.message?.content || '';

    // Salvar no histórico (MongoDB ou memória)
    try {
      await Code.create({
        prompt,
        code,
        language,
        timestamp: new Date()
      });
      console.log('✅ Código salvo no histórico');
    } catch (dbError) {
      console.log('⚠️  Não foi possível salvar no MongoDB (continuando...)');
    }

    res.json({
      success: true,
      code,
      language,
      tokens: {
        input: completion.usage?.prompt_tokens || 0,
        output: completion.usage?.completion_tokens || 0
      }
    });

  } catch (error) {
    console.error('❌ Erro ao gerar código:', error.message);
    res.status(500).json({ 
      error: 'Erro ao gerar código',
      message: error.message 
    });
  }
});

// ROTA: Buscar histórico
app.get('/api/history', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const history = await Code.find()
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error.message);
    res.json({
      success: false,
      count: 0,
      history: [],
      message: 'Histórico indisponível (MongoDB não conectado)'
    });
  }
});

// ROTA: Deletar item do histórico
app.delete('/api/history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Code.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Item deletado'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao deletar',
      message: error.message 
    });
  }
});

// ROTA: Limpar histórico
app.delete('/api/history', async (req, res) => {
  try {
    await Code.deleteMany({});
    
    res.json({
      success: true,
      message: 'Histórico limpo'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao limpar histórico',
      message: error.message 
    });
  }
});

// ROTA: Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando!',
    mongodb: mongoose.connection.readyState === 1 ? 'conectado' : 'desconectado',
    groq: !!process.env.GROQ_API_KEY ? 'configurado' : 'não configurado'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🚀 API rodando em http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`\n💡 Endpoints disponíveis:`);
  console.log(`   POST   /api/generate    - Gera código`);
  console.log(`   GET    /api/history     - Lista histórico`);
  console.log(`   DELETE /api/history/:id - Deleta item`);
  console.log(`   DELETE /api/history     - Limpa histórico\n`);
});

module.exports = app;
