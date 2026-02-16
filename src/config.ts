import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export interface Config {
  emergentLlmKey: string;
  anthropicApiKey: string;
  n8nEnabled: boolean;
  n8nApiKey: string;
  n8nWebhookUrl: string;
  n8nApiUrl: string;
  projectRoot: string;
  backupDir: string;
  maxFileSize: number;
  maxContextSize: number;
}

export const config: Config = {
  emergentLlmKey: process.env.EMERGENT_LLM_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || process.env.EMERGENT_LLM_KEY || '',
  n8nEnabled: process.env.N8N_ENABLED === 'true',
  n8nApiKey: process.env.N8N_API_KEY || '',
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook',
  n8nApiUrl: process.env.N8N_API_URL || 'http://localhost:5678/api/v1',
  projectRoot: process.env.PROJECT_ROOT || '.',
  backupDir: process.env.BACKUP_DIR || '.emergent-backups',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '1048576'),
  maxContextSize: parseInt(process.env.MAX_CONTEXT_SIZE || '50000'),
};

export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.anthropicApiKey) {
    errors.push('ANTHROPIC_API_KEY ou EMERGENT_LLM_KEY não configurada');
  }

  if (config.n8nEnabled && !config.n8nApiKey) {
    errors.push('N8N_ENABLED=true mas N8N_API_KEY não configurada');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getProjectPath(relativePath: string): string {
  return path.resolve(config.projectRoot, relativePath);
}

export function getBackupPath(filename: string): string {
  return path.resolve(config.backupDir, filename);
}
