import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * MCP Client - Interface do CLI com o MCP Server
 */
export class MCPClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;
  private connected: boolean = false;

  constructor() {
    this.client = new Client(
      {
        name: 'emergent-cli',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );
  }

  /**
   * Conecta ao MCP Server
   */
  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      this.transport = new StdioClientTransport({
        command: 'node',
        args: ['dist/mcp/server.js'],
        env: process.env as Record<string, string>,
      });

      await this.client.connect(this.transport);
      this.connected = true;
    } catch (error: any) {
      throw new Error(`Erro ao conectar MCP Server: ${error.message}`);
    }
  }

  /**
   * Lista ferramentas disponíveis
   */
  async listTools(): Promise<any> {
    await this.connect();
    return await this.client.listTools();
  }

  /**
   * Chama uma ferramenta MCP
   */
  async callTool(name: string, args: any): Promise<any> {
    await this.connect();
    const result = await this.client.callTool({ name, arguments: args });
    return result;
  }

  /**
   * Desconecta do servidor
   */
  async disconnect(): Promise<void> {
    if (!this.connected) return;

    try {
      await this.client.close();
      this.connected = false;
    } catch (error: any) {
      console.error('Erro ao desconectar:', error.message);
    }
  }
}

// Instância singleton
let clientInstance: MCPClient | null = null;

export function getMCPClient(): MCPClient {
  if (!clientInstance) {
    clientInstance = new MCPClient();
  }
  return clientInstance;
}
