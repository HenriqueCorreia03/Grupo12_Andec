import { requireEnv } from '../../src/config/env';

/**
 * URL da base de dados de teste, lido do .env da raiz.
 * Recusa correr contra a base da aplicação, porque o ETL apaga e recarrega tudo.
 */
export function testDatabaseUrl(): string {
  const url = requireEnv('TEST_DATABASE_URL');
  if (url === process.env.DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL não pode ser igual a DATABASE_URL.');
  }
  return url;
}
