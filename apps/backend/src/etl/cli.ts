import { loadEnv, resolveFromRepoRoot } from '../config/env';
import { runEtl } from './run-etl';

async function main(): Promise<void> {
  loadEnv();
  const databaseUrl = process.env.DATABASE_URL;
  const dataDir = process.env.DATA_DIR;
  if (!databaseUrl || !dataDir) {
    throw new Error('Faltam DATABASE_URL e/ou DATA_DIR no .env da raiz (ver .env.example).');
  }
  const started = Date.now();
  const summary = await runEtl({ databaseUrl, dataDir: resolveFromRepoRoot(dataDir) });
  const co = summary.customerOrder;
  console.log(
    `ETL concluído em ${((Date.now() - started) / 1000).toFixed(1)} s. ` +
      `Customer_Order: ${co.lines} linhas (${co.duplicateLines} duplicadas, ${co.zeroLines} a zero).`,
  );
}

main().catch((error: unknown) => {
  console.error(`ETL falhou: ${(error as Error).message}`);
  process.exitCode = 1;
});
