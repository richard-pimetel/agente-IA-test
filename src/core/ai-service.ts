import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { getMCPClient } from '../mcp/client';

export interface AIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * AI Service - Lógica de comunicação com Claude via MCP
 */
export class AIService {
  private anthropic: Anthropic;
  private mcpClient: ReturnType<typeof getMCPClient>;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: config.anthropicApiKey,
    });
    this.mcpClient = getMCPClient();
  }

  /**
   * Gera código baseado em prompt usando Claude + MCP Tools
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
      throw new Error(`Erro ao gerar código: ${error.message}`);
    }
  }

  /**
   * Gera resposta sem streaming
   */
  private async generateWithoutStream(
    systemMessage: string,
    userMessage: string
  ): Promise<AIResponse> {
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: systemMessage,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const content = response.content
      .filter((block) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');

    return {
      content,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
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
    const stream = await this.anthropic.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: systemMessage,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    let fullContent = '';

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        process.stdout.write(event.delta.text);
        fullContent += event.delta.text;
      }
    }

    const finalMessage = await stream.finalMessage();

    return {
      content: fullContent,
      usage: {
        inputTokens: finalMessage.usage.input_tokens,
        outputTokens: finalMessage.usage.output_tokens,
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
`;

    return await this.generateCode(prompt);
  }

  /**
   * Constrói mensagem de sistema para Claude
   */
  private buildSystemMessage(): string {
    return `
Você é um assistente de programação especializado que ajuda desenvolvedores a:
- Gerar código de alta qualidade
- Revisar e melhorar código existente
- Criar documentação clara
- Resolver problemas técnicos

Sempre:
1. Siga as melhores práticas da linguagem
2. Escreva código limpo e bem documentado
3. Considere segurança e performance
4. Explique suas decisões quando relevante

Você tem acesso a ferramentas MCP para ler/escrever arquivos, executar comandos, e analisar projetos.
`;
  }

  /**
   * Constrói mensagem do usuário
   */
  private buildUserMessage(prompt: string, context?: string): string {
    let message = prompt;

    if (context) {
      message = `
## Contexto do Projeto

${context}

## Solicitação

${prompt}
`;
    }

    return message;
  }

  /**
   * Usa MCP tools via cliente
   */
  async useMCPTool(toolName: string, args: any): Promise<any> {
    try {
      const result = await this.mcpClient.callTool(toolName, args);
      return JSON.parse(result.content[0].text);
    } catch (error: any) {
      throw new Error(`Erro ao usar ferramenta MCP: ${error.message}`);
    }
  }
}
