import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const BACKEND_DIR = resolve(__dirname, '../..');

/**
 * Corre o ETL de produção, `npm run etl`, com DATA_DIR e DATABASE_URL a apontar
 * para a fixture e para a base de dados de teste. Estas variáveis têm prioridade
 * sobre o .env da raiz. Devolve o que o comando escreveu; rejeita se falhar.
 */
export function runEtlCommand(env: { DATABASE_URL: string; DATA_DIR: string }): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    // shell: true para o Windows encontrar o npm.cmd; os argumentos são fixos.
    const child = spawn('npm', ['run', 'etl'], {
      cwd: BACKEND_DIR,
      env: { ...process.env, ...env },
      shell: true,
    });
    let output = '';
    child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (output += chunk.toString()));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolvePromise(output);
      else reject(new Error(`npm run etl terminou com o código ${code}:\n${output}`));
    });
  });
}
