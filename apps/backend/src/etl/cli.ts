import { requireEnv, resolveFromRepoRoot } from '../config/env';
import { runEtl } from './run-etl';

/** Ponto de entrada de `npm run etl`: lê DATABASE_URL e DATA_DIR do ambiente (ou do .env da raiz). */
async function main(): Promise<void> {
  const started = Date.now();
  const summary = await runEtl({
    databaseUrl: requireEnv('DATABASE_URL'),
    dataDir: resolveFromRepoRoot(requireEnv('DATA_DIR')),
  });
  const { lines, duplicateLines, zeroLines } = summary.customerOrder;
  console.log(
    `ETL concluído em ${((Date.now() - started) / 1000).toFixed(1)} s. ` +
      `Customer_Order: ${lines} linhas (${duplicateLines} duplicadas, ${zeroLines} a zero). ` +
      `Product: ${summary.product.references} referências.`,
  );
}

main().catch((error: unknown) => {
  console.error(`ETL falhou: ${(error as Error).message}`);
  process.exitCode = 1;
});
