import { promises as fs } from 'fs';
import path from 'path';
import glob from 'fast-glob';

export interface ProjectContext {
  summary: string;
  fileCount: number;
  languages: string[];
  frameworks: string[];
  structure: Record<string, string[]>;
  recentFiles: string[];
  dependencies?: any;
}

/**
 * Context Builder - Analisa e constrói contexto do projeto para IA
 */
export class ContextBuilder {
  private rootDir: string;
  private maxContextSize: number;

  constructor(rootDir: string = '.', maxContextSize: number = 50000) {
    this.rootDir = rootDir;
    this.maxContextSize = maxContextSize;
  }

  /**
   * Constrói contexto completo do projeto
   */
  async buildContext(): Promise<ProjectContext> {
    const files = await this.scanProject();
    const analysis = await this.analyzeFiles(files);
    const dependencies = await this.getDependencies();

    return {
      summary: this.generateSummary(analysis),
      fileCount: files.length,
      languages: analysis.languages,
      frameworks: analysis.frameworks,
      structure: analysis.structure,
      recentFiles: await this.getRecentFiles(5),
      dependencies,
    };
  }

  /**
   * Escaneia arquivos do projeto
   */
  private async scanProject(): Promise<string[]> {
    return await glob('**/*', {
      cwd: this.rootDir,
      ignore: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '.git/**',
        '*.log',
        '.emergent-backups/**',
      ],
      onlyFiles: true,
    });
  }

  /**
   * Analisa arquivos encontrados
   */
  private async analyzeFiles(files: string[]): Promise<any> {
    const analysis = {
      languages: new Set<string>(),
      frameworks: [] as string[],
      structure: {} as Record<string, string[]>,
      fileTypes: {} as Record<string, number>,
    };

    // Mapeia extensões para linguagens
    const languageMap: Record<string, string> = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.py': 'Python',
      '.go': 'Go',
      '.rs': 'Rust',
      '.java': 'Java',
      '.rb': 'Ruby',
      '.php': 'PHP',
      '.c': 'C',
      '.cpp': 'C++',
      '.cs': 'C#',
    };

    for (const file of files) {
      const ext = path.extname(file);
      const dir = path.dirname(file);

      // Conta tipos de arquivo
      analysis.fileTypes[ext] = (analysis.fileTypes[ext] || 0) + 1;

      // Detecta linguagem
      if (languageMap[ext]) {
        analysis.languages.add(languageMap[ext]);
      }

      // Organiza estrutura
      if (!analysis.structure[dir]) {
        analysis.structure[dir] = [];
      }
      analysis.structure[dir].push(path.basename(file));
    }

    // Detecta frameworks
    analysis.frameworks = await this.detectFrameworks();

    return {
      ...analysis,
      languages: Array.from(analysis.languages),
    };
  }

  /**
   * Detecta frameworks usados
   */
  private async detectFrameworks(): Promise<string[]> {
    const frameworks: string[] = [];

    try {
      // Node.js projects
      const packageJsonPath = path.join(this.rootDir, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      if (deps.react) frameworks.push('React');
      if (deps.vue) frameworks.push('Vue');
      if (deps.angular) frameworks.push('Angular');
      if (deps.next) frameworks.push('Next.js');
      if (deps.express) frameworks.push('Express');
      if (deps['@nestjs/core']) frameworks.push('NestJS');
      if (deps.fastify) frameworks.push('Fastify');
    } catch {
      // Não é projeto Node.js
    }

    try {
      // Python projects
      const requirementsPath = path.join(this.rootDir, 'requirements.txt');
      const requirements = await fs.readFile(requirementsPath, 'utf-8');

      if (requirements.includes('django')) frameworks.push('Django');
      if (requirements.includes('flask')) frameworks.push('Flask');
      if (requirements.includes('fastapi')) frameworks.push('FastAPI');
    } catch {
      // Não tem requirements.txt
    }

    return frameworks;
  }

  /**
   * Obtém dependências do projeto
   */
  private async getDependencies(): Promise<any> {
    try {
      const packageJsonPath = path.join(this.rootDir, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      return {
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
      };
    } catch {
      return null;
    }
  }

  /**
   * Obtém arquivos modificados recentemente
   */
  private async getRecentFiles(limit: number = 5): Promise<string[]> {
    const files = await this.scanProject();
    const filesWithStats = await Promise.all(
      files.slice(0, 50).map(async (file) => {
        const fullPath = path.join(this.rootDir, file);
        const stats = await fs.stat(fullPath);
        return { file, mtime: stats.mtime };
      })
    );

    return filesWithStats
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
      .slice(0, limit)
      .map((item) => item.file);
  }

  /**
   * Gera resumo textual do projeto
   */
  private generateSummary(analysis: any): string {
    const { languages, frameworks, fileTypes } = analysis;

    let summary = 'Projeto ';

    if (languages.length > 0) {
      summary += `${languages.join(', ')}`;
    }

    if (frameworks.length > 0) {
      summary += ` usando ${frameworks.join(', ')}`;
    }

    const totalFiles = Object.values(fileTypes).reduce((a: any, b: any) => a + b, 0);
    summary += `. ${totalFiles} arquivos.`;

    return summary;
  }

  /**
   * Constrói contexto otimizado para IA (limitado em tamanho)
   */
  async buildOptimizedContext(focusFiles?: string[]): Promise<string> {
    const context = await this.buildContext();
    let contextText = `# Contexto do Projeto\n\n`;
    contextText += `${context.summary}\n\n`;
    contextText += `## Estrutura\n`;
    contextText += `- Linguagens: ${context.languages.join(', ')}\n`;
    contextText += `- Frameworks: ${context.frameworks.join(', ')}\n`;
    contextText += `- Total de arquivos: ${context.fileCount}\n\n`;

    if (focusFiles && focusFiles.length > 0) {
      contextText += `## Arquivos Relevantes\n\n`;
      
      for (const file of focusFiles.slice(0, 5)) {
        try {
          const fullPath = path.join(this.rootDir, file);
          let content = await fs.readFile(fullPath, 'utf-8');
          
          // Limita tamanho do arquivo
          if (content.length > 2000) {
            content = content.slice(0, 2000) + '\n... (truncado)';
          }

          contextText += `### ${file}\n\`\`\`\n${content}\n\`\`\`\n\n`;
        } catch {
          // Ignora arquivos que não podem ser lidos
        }
      }
    }

    // Limita tamanho total do contexto
    if (contextText.length > this.maxContextSize) {
      contextText = contextText.slice(0, this.maxContextSize) + '\n... (contexto truncado)';
    }

    return contextText;
  }

  /**
   * Busca arquivos por padrão
   */
  async findFiles(pattern: string): Promise<string[]> {
    return await glob(pattern, {
      cwd: this.rootDir,
      ignore: ['node_modules/**', 'dist/**', '.git/**'],
    });
  }
}
