import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { mcpTools } from './tools';
import dotenv from 'dotenv';

dotenv.config();

/**
 * MCP Server - Gerencia comunicação entre CLI e Claude AI
 */
class EmergentMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'emergent-ai',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  /**
   * Define as ferramentas disponíveis via MCP
   */
  private setupToolHandlers(): void {
    // Lista de ferramentas
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: 'read_files',
          description: 'Lê arquivos do projeto usando glob patterns',
          inputSchema: {
            type: 'object',
            properties: {
              patterns: {
                type: 'array',
                items: { type: 'string' },
                description: 'Padrões glob para buscar arquivos (ex: ["src/**/*.ts"])',
              },
              baseDir: {
                type: 'string',
                description: 'Diretório base (padrão: ".")',
                default: '.',
              },
            },
            required: ['patterns'],
          },
        },
        {
          name: 'write_code',
          description: 'Escreve código gerado em arquivo com backup automático',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: 'Caminho do arquivo',
              },
              content: {
                type: 'string',
                description: 'Conteúdo do arquivo',
              },
              createBackup: {
                type: 'boolean',
                description: 'Criar backup se arquivo existir',
                default: true,
              },
            },
            required: ['filePath', 'content'],
          },
        },
        {
          name: 'execute_command',
          description: 'Executa comandos shell com segurança',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'Comando a executar',
              },
              cwd: {
                type: 'string',
                description: 'Diretório de trabalho',
                default: '.',
              },
            },
            required: ['command'],
          },
        },
        {
          name: 'analyze_project',
          description: 'Analisa estrutura completa do projeto',
          inputSchema: {
            type: 'object',
            properties: {
              rootDir: {
                type: 'string',
                description: 'Diretório raiz do projeto',
                default: '.',
              },
            },
          },
        },
        {
          name: 'git_operations',
          description: 'Operações git (status, commit, diff, log)',
          inputSchema: {
            type: 'object',
            properties: {
              operation: {
                type: 'string',
                enum: ['status', 'commit', 'diff', 'log'],
                description: 'Tipo de operação git',
              },
              options: {
                type: 'object',
                description: 'Opções específicas (ex: message para commit)',
              },
            },
            required: ['operation'],
          },
        },
        {
          name: 'test_code',
          description: 'Executa testes do projeto',
          inputSchema: {
            type: 'object',
            properties: {
              testCommand: {
                type: 'string',
                description: 'Comando de teste customizado',
              },
              cwd: {
                type: 'string',
                description: 'Diretório de trabalho',
                default: '.',
              },
            },
          },
        },
      ];

      return { tools };
    });

    // Execução de ferramentas
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result;

        switch (name) {
          case 'read_files':
            result = await mcpTools.readFiles(
              (args as any)?.patterns || [],
              (args as any)?.baseDir
            );
            break;

          case 'write_code':
            result = await mcpTools.writeCode(
              (args as any)?.filePath || '',
              (args as any)?.content || '',
              (args as any)?.createBackup
            );
            break;

          case 'execute_command':
            result = await mcpTools.executeCommand(
              (args as any)?.command || '',
              (args as any)?.cwd
            );
            break;

          case 'analyze_project':
            result = await mcpTools.analyzeProject((args as any)?.rootDir);
            break;

          case 'git_operations':
            result = await mcpTools.gitOperations(
              (args as any)?.operation || 'status',
              (args as any)?.options
            );
            break;

          case 'test_code':
            result = await mcpTools.testCode(
              (args as any)?.testCommand,
              (args as any)?.cwd
            );
            break;

          default:
            throw new Error(`Ferramenta desconhecida: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: error.message,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Configura tratamento de erros
   */
  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Server Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Inicia o servidor MCP
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Emergent MCP Server iniciado');
  }
}

// Inicia o servidor se executado diretamente
if (require.main === module) {
  const server = new EmergentMCPServer();
  server.start().catch((error) => {
    console.error('Erro ao iniciar MCP Server:', error);
    process.exit(1);
  });
}

export default EmergentMCPServer;
