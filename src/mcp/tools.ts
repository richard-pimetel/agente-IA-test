import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import simpleGit, { SimpleGit } from 'simple-git';
import glob from 'fast-glob';

const execAsync = promisify(exec);

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * MCP Tool: read_files
 * Lê arquivos do projeto com suporte a glob patterns
 */
export async function readFiles(patterns: string[], baseDir: string = '.'): Promise<ToolResult> {
  try {
    const files = await glob(patterns, { 
      cwd: baseDir,
      ignore: ['node_modules/**', 'dist/**', '.git/**'],
      absolute: false 
    });

    const contents: Record<string, string> = {};
    
    for (const file of files) {
      const fullPath = path.join(baseDir, file);
      const stats = await fs.stat(fullPath);
      
      // Limita tamanho do arquivo (1MB)
      if (stats.size > 1048576) {
        contents[file] = `[Arquivo muito grande: ${stats.size} bytes]`;
        continue;
      }
      
      contents[file] = await fs.readFile(fullPath, 'utf-8');
    }

    return {
      success: true,
      data: {
        files: Object.keys(contents),
        contents,
        totalFiles: files.length,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Erro ao ler arquivos: ${error.message}`,
    };
  }
}

/**
 * MCP Tool: write_code
 * Escreve código gerado em arquivos
 */
export async function writeCode(
  filePath: string,
  content: string,
  createBackup: boolean = true
): Promise<ToolResult> {
  try {
    const fullPath = path.resolve(filePath);
    
    // Validação de segurança: não permite caminhos absolutos perigosos
    if (fullPath.includes('..') || fullPath.startsWith('/etc') || fullPath.startsWith('/sys')) {
      return {
        success: false,
        error: 'Caminho de arquivo inválido ou inseguro',
      };
    }

    // Cria backup se arquivo já existe
    if (createBackup) {
      try {
        await fs.access(fullPath);
        const backupDir = '.emergent-backups';
        await fs.mkdir(backupDir, { recursive: true });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `${path.basename(filePath)}.${timestamp}.backup`;
        const backupPath = path.join(backupDir, backupName);
        
        await fs.copyFile(fullPath, backupPath);
      } catch {
        // Arquivo não existe, sem backup necessário
      }
    }

    // Cria diretório se não existir
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    
    // Escreve arquivo
    await fs.writeFile(fullPath, content, 'utf-8');

    return {
      success: true,
      data: {
        path: fullPath,
        size: Buffer.byteLength(content, 'utf-8'),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Erro ao escrever arquivo: ${error.message}`,
    };
  }
}

/**
 * MCP Tool: execute_command
 * Executa comandos shell com segurança
 */
export async function executeCommand(
  command: string,
  cwd: string = '.'
): Promise<ToolResult> {
  try {
    // Lista de comandos bloqueados por segurança
    const blockedCommands = ['rm -rf /', 'dd', 'mkfs', ':(){:|:&};:', 'fork'];
    
    if (blockedCommands.some(blocked => command.includes(blocked))) {
      return {
        success: false,
        error: 'Comando bloqueado por segurança',
      };
    }

    const { stdout, stderr } = await execAsync(command, { 
      cwd,
      timeout: 30000, // 30s timeout
      maxBuffer: 1024 * 1024, // 1MB
    });

    return {
      success: true,
      data: {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        command,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Erro ao executar comando: ${error.message}`,
      data: {
        stdout: error.stdout || '',
        stderr: error.stderr || '',
      },
    };
  }
}

/**
 * MCP Tool: analyze_project
 * Analisa estrutura do projeto
 */
export async function analyzeProject(rootDir: string = '.'): Promise<ToolResult> {
  try {
    const files = await glob('**/*', {
      cwd: rootDir,
      ignore: ['node_modules/**', 'dist/**', '.git/**', '*.log'],
      onlyFiles: true,
    });

    const analysis: any = {
      totalFiles: files.length,
      fileTypes: {} as Record<string, number>,
      structure: {} as Record<string, string[]>,
      languages: new Set<string>(),
      frameworks: [] as string[],
    };

    // Analisa tipos de arquivo
    for (const file of files) {
      const ext = path.extname(file) || 'no-extension';
      analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;
      
      const dir = path.dirname(file);
      if (!analysis.structure[dir]) {
        analysis.structure[dir] = [];
      }
      analysis.structure[dir].push(path.basename(file));

      // Detecta linguagens
      const langMap: Record<string, string> = {
        '.js': 'JavaScript',
        '.ts': 'TypeScript',
        '.py': 'Python',
        '.go': 'Go',
        '.rs': 'Rust',
        '.java': 'Java',
      };
      if (langMap[ext]) {
        analysis.languages.add(langMap[ext]);
      }
    }

    // Detecta frameworks
    const packageJsonPath = path.join(rootDir, 'package.json');
    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (deps.react) analysis.frameworks.push('React');
      if (deps.vue) analysis.frameworks.push('Vue');
      if (deps.next) analysis.frameworks.push('Next.js');
      if (deps.express) analysis.frameworks.push('Express');
      if (deps.fastapi) analysis.frameworks.push('FastAPI');
    } catch {
      // package.json não existe ou inválido
    }

    analysis.languages = Array.from(analysis.languages);

    return {
      success: true,
      data: analysis,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Erro ao analisar projeto: ${error.message}`,
    };
  }
}

/**
 * MCP Tool: git_operations
 * Operações git (status, commit, diff)
 */
export async function gitOperations(
  operation: 'status' | 'commit' | 'diff' | 'log',
  options: any = {}
): Promise<ToolResult> {
  try {
    const git: SimpleGit = simpleGit();

    let result: any;

    switch (operation) {
      case 'status':
        result = await git.status();
        break;

      case 'commit':
        if (!options.message) {
          return { success: false, error: 'Mensagem de commit necessária' };
        }
        await git.add('.');
        result = await git.commit(options.message);
        break;

      case 'diff':
        result = await git.diff(options.files || []);
        break;

      case 'log':
        result = await git.log({ maxCount: options.maxCount || 10 });
        break;

      default:
        return { success: false, error: 'Operação git inválida' };
    }

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Erro em operação git: ${error.message}`,
    };
  }
}

/**
 * MCP Tool: test_code
 * Executa testes no código
 */
export async function testCode(
  testCommand?: string,
  cwd: string = '.'
): Promise<ToolResult> {
  try {
    // Detecta framework de teste
    let command = testCommand || 'npm test';
    
    if (!testCommand) {
      const packageJsonPath = path.join(cwd, 'package.json');
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        command = packageJson.scripts?.test || 'npm test';
      } catch {
        command = 'npm test';
      }
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout: 120000, // 2 minutos para testes
    });

    return {
      success: true,
      data: {
        output: stdout,
        errors: stderr,
        command,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Erro ao executar testes: ${error.message}`,
      data: {
        output: error.stdout || '',
        errors: error.stderr || '',
      },
    };
  }
}

// Exporta todas as ferramentas
export const mcpTools = {
  readFiles,
  writeCode,
  executeCommand,
  analyzeProject,
  gitOperations,
  testCode,
};
