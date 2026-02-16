import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';

export interface FileOperation {
  type: 'create' | 'update' | 'delete';
  path: string;
  content?: string;
  previousContent?: string;
  timestamp: Date;
}

/**
 * File Manager - Gerencia manipulação segura de arquivos
 */
export class FileManager {
  private operationHistory: FileOperation[] = [];
  private backupDir: string;

  constructor(backupDir: string = '.emergent-backups') {
    this.backupDir = backupDir;
  }

  /**
   * Inicializa diretório de backup
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      
      // Cria arquivo de histórico
      const historyFile = path.join(this.backupDir, 'history.json');
      try {
        const data = await fs.readFile(historyFile, 'utf-8');
        this.operationHistory = JSON.parse(data);
      } catch {
        // Histórico não existe ainda
      }
    } catch (error: any) {
      throw new Error(`Erro ao inicializar FileManager: ${error.message}`);
    }
  }

  /**
   * Lê arquivo com validação
   */
  async readFile(filePath: string): Promise<string> {
    try {
      this.validatePath(filePath);
      return await fs.readFile(filePath, 'utf-8');
    } catch (error: any) {
      throw new Error(`Erro ao ler arquivo ${filePath}: ${error.message}`);
    }
  }

  /**
   * Escreve arquivo com backup automático
   */
  async writeFile(
    filePath: string,
    content: string,
    createBackup: boolean = true
  ): Promise<void> {
    try {
      this.validatePath(filePath);

      let previousContent: string | undefined;
      let operationType: 'create' | 'update' = 'create';

      // Verifica se arquivo existe
      try {
        previousContent = await fs.readFile(filePath, 'utf-8');
        operationType = 'update';

        // Cria backup
        if (createBackup) {
          await this.createBackup(filePath, previousContent);
        }
      } catch {
        // Arquivo não existe
      }

      // Cria diretório se necessário
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Escreve arquivo
      await fs.writeFile(filePath, content, 'utf-8');

      // Registra operação
      this.recordOperation({
        type: operationType,
        path: filePath,
        content,
        previousContent,
        timestamp: new Date(),
      });
    } catch (error: any) {
      throw new Error(`Erro ao escrever arquivo ${filePath}: ${error.message}`);
    }
  }

  /**
   * Deleta arquivo com backup
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      this.validatePath(filePath);

      const content = await fs.readFile(filePath, 'utf-8');
      await this.createBackup(filePath, content);
      await fs.unlink(filePath);

      this.recordOperation({
        type: 'delete',
        path: filePath,
        previousContent: content,
        timestamp: new Date(),
      });
    } catch (error: any) {
      throw new Error(`Erro ao deletar arquivo ${filePath}: ${error.message}`);
    }
  }

  /**
   * Cria backup de arquivo
   */
  private async createBackup(filePath: string, content: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const hash = createHash('md5').update(content).digest('hex').slice(0, 8);
    const basename = path.basename(filePath);
    const backupName = `${basename}.${timestamp}.${hash}.backup`;
    const backupPath = path.join(this.backupDir, backupName);

    await fs.writeFile(backupPath, content, 'utf-8');
    return backupPath;
  }

  /**
   * Registra operação no histórico
   */
  private recordOperation(operation: FileOperation): void {
    this.operationHistory.push(operation);

    // Salva histórico (assync, sem await para não bloquear)
    const historyFile = path.join(this.backupDir, 'history.json');
    fs.writeFile(
      historyFile,
      JSON.stringify(this.operationHistory, null, 2),
      'utf-8'
    ).catch((err) => {
      console.error('Erro ao salvar histórico:', err);
    });
  }

  /**
   * Desfaz última operação
   */
  async rollback(steps: number = 1): Promise<FileOperation[]> {
    const operations: FileOperation[] = [];

    for (let i = 0; i < steps; i++) {
      const operation = this.operationHistory.pop();
      if (!operation) break;

      try {
        switch (operation.type) {
          case 'create':
            // Desfaz criação deletando arquivo
            await fs.unlink(operation.path);
            break;

          case 'update':
            // Restaura conteúdo anterior
            if (operation.previousContent) {
              await fs.writeFile(operation.path, operation.previousContent, 'utf-8');
            }
            break;

          case 'delete':
            // Restaura arquivo deletado
            if (operation.previousContent) {
              await fs.mkdir(path.dirname(operation.path), { recursive: true });
              await fs.writeFile(operation.path, operation.previousContent, 'utf-8');
            }
            break;
        }

        operations.push(operation);
      } catch (error: any) {
        console.error(`Erro ao desfazer ${operation.type} em ${operation.path}:`, error.message);
      }
    }

    return operations;
  }

  /**
   * Obtém histórico de operações
   */
  getHistory(limit?: number): FileOperation[] {
    if (limit) {
      return this.operationHistory.slice(-limit);
    }
    return [...this.operationHistory];
  }

  /**
   * Valida segurança do caminho
   */
  private validatePath(filePath: string): void {
    const resolved = path.resolve(filePath);

    // Previne path traversal
    if (resolved.includes('..')) {
      throw new Error('Caminho inválido: path traversal não permitido');
    }

    // Previne acesso a arquivos sensíveis
    const dangerous = ['/etc', '/sys', '/proc', '/root'];
    if (dangerous.some((dir) => resolved.startsWith(dir))) {
      throw new Error('Caminho inválido: acesso negado');
    }
  }
}
