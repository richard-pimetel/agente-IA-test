import axios from 'axios';
import { config } from '../config';
import { promises as fs } from 'fs';
import path from 'path';

export interface WorkflowResult {
  success: boolean;
  summary: string;
  data?: any;
  issues?: string[];
  errors?: string[];
  content?: string;
}

/**
 * N8N Integration - Integração com N8N (mockada se N8N_ENABLED=false)
 */
export class N8NIntegration {
  private apiUrl: string;
  private apiKey: string;
  private webhookUrl: string;
  private enabled: boolean;

  constructor() {
    this.apiUrl = config.n8nApiUrl;
    this.apiKey = config.n8nApiKey;
    this.webhookUrl = config.n8nWebhookUrl;
    this.enabled = config.n8nEnabled;
  }

  /**
   * Dispara um workflow N8N
   */
  async triggerWorkflow(workflowName: string, data: any): Promise<WorkflowResult> {
    if (!this.enabled) {
      // Usa workflows mockados
      return await this.mockWorkflow(workflowName, data);
    }

    try {
      const response = await axios.post(
        `${this.webhookUrl}/${workflowName}`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-N8N-API-KEY': this.apiKey,
          },
          timeout: 60000,
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`Erro ao disparar workflow N8N: ${error.message}`);
    }
  }

  /**
   * Verifica status de execução
   */
  async checkExecution(executionId: string): Promise<any> {
    if (!this.enabled) {
      return { status: 'success', finished: true };
    }

    try {
      const response = await axios.get(
        `${this.apiUrl}/executions/${executionId}`,
        {
          headers: {
            'X-N8N-API-KEY': this.apiKey,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`Erro ao verificar execução: ${error.message}`);
    }
  }

  /**
   * Workflows mockados (simulados localmente)
   */
  private async mockWorkflow(workflowName: string, data: any): Promise<WorkflowResult> {
    switch (workflowName) {
      case 'code-review':
        return this.mockCodeReview(data);

      case 'documentation':
        return this.mockDocumentation(data);

      case 'deploy':
        return this.mockDeploy(data);

      default:
        throw new Error(`Workflow desconhecido: ${workflowName}`);
    }
  }

  /**
   * Mock: Code Review Workflow
   */
  private async mockCodeReview(data: any): Promise<WorkflowResult> {
    const { files } = data;

    // Simula análise
    await this.sleep(1500);

    const issues: string[] = [];

    // Verifica padrões comuns de problemas
    for (const file of files.slice(0, 5)) {
      try {
        const content = await fs.readFile(file, 'utf-8');

        // Verifica console.log em produção
        if (content.includes('console.log') && !file.includes('test')) {
          issues.push(`${file}: Contém console.log (remover em produção)`);
        }

        // Verifica comentários TODO
        if (content.includes('TODO') || content.includes('FIXME')) {
          issues.push(`${file}: Contém comentários TODO/FIXME`);
        }

        // Verifica imports não usados (simples)
        if (file.endsWith('.ts') || file.endsWith('.js')) {
          const importMatches = content.match(/import.*from/g) || [];
          if (importMatches.length > 20) {
            issues.push(`${file}: Muitos imports (${importMatches.length}) - considere refatorar`);
          }
        }
      } catch {
        // Ignora arquivos que não podem ser lidos
      }
    }

    return {
      success: true,
      summary: `Code review concluído em ${files.length} arquivo(s)`,
      issues,
      data: {
        filesReviewed: files.length,
        issuesFound: issues.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Mock: Documentation Workflow
   */
  private async mockDocumentation(data: any): Promise<WorkflowResult> {
    const { project, format } = data;

    // Simula geração
    await this.sleep(2000);

    let content = '';

    if (format === 'markdown') {
      content = this.generateMarkdownDoc(project);
    } else if (format === 'html') {
      content = this.generateHtmlDoc(project);
    } else if (format === 'json') {
      content = JSON.stringify(project, null, 2);
    }

    return {
      success: true,
      summary: `Documentação gerada em formato ${format}`,
      content,
    };
  }

  /**
   * Mock: Deploy Workflow
   */
  private async mockDeploy(data: any): Promise<WorkflowResult> {
    const { skipTests } = data;

    // Simula deploy
    await this.sleep(3000);

    const steps = [
      'Build do projeto',
      skipTests ? 'Testes pulados' : 'Testes executados',
      'Deploy para staging',
      'Verificação de saúde',
      'Deploy para produção',
    ];

    return {
      success: true,
      summary: `Deploy concluído com sucesso\n${steps.map((s) => `  ✓ ${s}`).join('\n')}`,
      data: {
        steps,
        timestamp: new Date().toISOString(),
        environment: 'production',
      },
    };
  }

  /**
   * Gera documentação em Markdown
   */
  private generateMarkdownDoc(project: any): string {
    return `# ${path.basename(process.cwd())}

## Visão Geral

${project.summary}

## Tecnologias

**Linguagens:** ${project.languages.join(', ')}

**Frameworks:** ${project.frameworks.join(', ') || 'Nenhum detectado'}

## Estrutura do Projeto

Total de arquivos: ${project.fileCount}

${Object.entries(project.structure)
  .slice(0, 10)
  .map(([dir, files]: [string, any]) => `- **${dir}/** (${files.length} arquivos)`)
  .join('\n')}

## Dependências

${project.dependencies ? '\`\`\`json\n' + JSON.stringify(project.dependencies, null, 2) + '\n\`\`\`' : 'Nenhuma dependência detectada'}

## Como Executar

\`\`\`bash
# Instalar dependências
npm install  # ou yarn install

# Executar projeto
npm start
\`\`\`

## Arquivos Recentes

${project.recentFiles.map((f: string) => `- ${f}`).join('\n')}

---

*Documentação gerada automaticamente por Emergent AI*
`;
  }

  /**
   * Gera documentação em HTML
   */
  private generateHtmlDoc(project: any): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>${path.basename(process.cwd())}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    h1 { color: #333; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>${path.basename(process.cwd())}</h1>
  <h2>Visão Geral</h2>
  <p>${project.summary}</p>
  <h2>Tecnologias</h2>
  <p><strong>Linguagens:</strong> ${project.languages.join(', ')}</p>
  <p><strong>Frameworks:</strong> ${project.frameworks.join(', ') || 'Nenhum'}</p>
  <h2>Estrutura</h2>
  <p>Total de arquivos: ${project.fileCount}</p>
  <footer>
    <p><em>Documentação gerada por Emergent AI</em></p>
  </footer>
</body>
</html>
`;
  }

  /**
   * Helper: Sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
