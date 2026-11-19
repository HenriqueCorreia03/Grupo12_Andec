import { config } from 'dotenv';
import { isAbsolute, resolve } from 'node:path';

/** Raiz do repositório (igual a partir de src/config e de dist/config). */
export const REPO_ROOT = resolve(__dirname, '../../../..');

let loaded = false;

/** Lê o .env da raiz uma vez. Não substitui variáveis já definidas no processo. */
export function loadEnv(): void {
  if (loaded) return;
  config({ path: resolve(REPO_ROOT, '.env'), quiet: true });
  loaded = true;
}

/** Valor de uma variável de ambiente obrigatória (lida também do .env da raiz). */
export function requireEnv(name: string): string {
  loadEnv();
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta ${name} no .env da raiz (ver .env.example).`);
  }
  return value;
}

/** Caminhos relativos (por exemplo DATA_DIR=./data) contam a partir da raiz do repositório. */
export function resolveFromRepoRoot(path: string): string {
  return isAbsolute(path) ? path : resolve(REPO_ROOT, path);
}
