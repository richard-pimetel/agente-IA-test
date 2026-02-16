import Groq from 'groq-sdk';
import { getMCPClient } from '../mcp/client';

export interface AIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * AI Service usando Groq (GRATUITO!)
 * Modelos disponíveis:
 * - llama-3.1-70b-versatile (recomendado para código)
 * - llama-3.1-8b-instant (mais rápido)
 * - mixtral-8x7b-32768
 * - gemma2-9b-it
 */
export class AIServiceGroq {
  private groq: Groq;
  private mcpClient: ReturnType<typeof getMCPClient>;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error('GROQ_API_KEY não configurada no .env');
    }

    this.groq = new Groq({
      apiKey: apiKey,
    });
    
    this.mcpClient = getMCPClient();
  }

  /**
   * Gera código baseado em prompt usando Groq (GRÁTIS!)
   */
  async generateCode(
    prompt: string,
    context?: string,
    stream: boolean = false
  ): Promise<AIResponse> {
    try {
      const systemMessage = this.buildSystemMessage();
      const userMessage = this.buildUserMessage(prompt, context);

      if (stream) {
        return await this.generateWithStream(systemMessage, userMessage);
      } else {
        return await this.generateWithoutStream(systemMessage, userMessage);
      }
    } catch (error: any) {
      throw new Error(`Erro ao gerar código com Groq: ${error.message}`);
    }
  }

  /**
   * Gera resposta sem streaming
   */
  private async generateWithoutStream(
    systemMessage: string,
    userMessage: string
  ): Promise<AIResponse> {
    const completion = await this.groq.chat.completions.create({
      model: 'llama-3.1-70b-versatile', // Modelo GRATUITO e poderoso!
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 4096,
      top_p: 1,
      stream: false,
    });

    const content = completion.choices[0]?.message?.content || '';

    return {
      content,
      usage: {
        inputTokens: completion.usage?.prompt_tokens || 0,
        outputTokens: completion.usage?.completion_tokens || 0,
      },
    };
  }

  /**
   * Gera resposta com streaming (tempo real)
   */
  private async generateWithStream(
    systemMessage: string,
    userMessage: string
  ): Promise<AIResponse> {
    const stream = await this.groq.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 4096,
      top_p: 1,
      stream: true,
    });

    let fullContent = '';
    let totalTokens = { prompt: 0, completion: 0 };

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        process.stdout.write(content);
        fullContent += content;
      }

      // Groq envia usage no último chunk
      if (chunk.usage) {
        totalTokens.prompt = chunk.usage.prompt_tokens || 0;
        totalTokens.completion = chunk.usage.completion_tokens || 0;
      }
    }

    return {
      content: fullContent,
      usage: {
        inputTokens: totalTokens.prompt,
        outputTokens: totalTokens.completion,
      },
    };
  }

  /**
   * Analisa código para review
   */
  async reviewCode(filePath: string, code: string): Promise<AIResponse> {
    const prompt = `
Analise o seguinte código e forneça:
1. Problemas de qualidade ou bugs
2. Sugestões de melhoria
3. Boas práticas não seguidas

Arquivo: ${filePath}

\`\`\`
${code}
\`\`\`

Responda em português e seja objetivo.
`;

    return await this.generateCode(prompt);
  }

  /**
   * Gera documentação
   */
  async generateDocumentation(
    projectAnalysis: any,
    format: 'markdown' | 'html' | 'json' = 'markdown'
  ): Promise<AIResponse> {
    const prompt = `
Gere documentação completa para o projeto com base na seguinte análise:

${JSON.stringify(projectAnalysis, null, 2)}

Formato desejado: ${format}

Inclua:
- Visão geral do projeto
- Estrutura de arquivos
- Tecnologias utilizadas
- Como executar
- Arquitetura

Responda em português.
`;

    return await this.generateCode(prompt);
  }

  /**
   * Constrói mensagem de sistema para Groq
   */
  private buildSystemMessage(): string {
    return `Você é um assistente de programação especializado que ajuda desenvolvedores a:
- Gerar código de alta qualidade
- Revisar e melhorar código existente
- Criar documentação clara
- Resolver problemas técnicos

Sempre:
1. Siga as melhores práticas da linguagem
2. Escreva código limpo e bem documentado
3. Considere segurança e performance
4. Explique suas decisões quando relevante
5. Responda em português

Você tem acesso a ferramentas MCP para ler/escrever arquivos, executar comandos, e analisar projetos.`;
  }

  /**
   * Constrói mensagem do usuário
   */
  private buildUserMessage(prompt: string, context?: string): string {
    let message = prompt;

    if (context) {
      message = `## Contexto do Projeto

${context}

## Solicitação

${prompt}`;
    }

    return message;
  }

  /**
   * Usa MCP tools via cliente
   */
  async useMCPTool(toolName: string, args: any): Promise<any> {
    try {
      const result = await this.mcpClient.callTool(toolName, args);
      const firstContent = result.content[0];
      if (firstContent.type === 'text') {
        return JSON.parse(firstContent.text);
      }
      throw new Error('Resposta MCP inválida');
    } catch (error: any) {
      throw new Error(`Erro ao usar ferramenta MCP: ${error.message}`);
    }
  }
}
