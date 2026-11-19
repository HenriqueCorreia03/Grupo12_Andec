import { resolve } from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { CustomerOrderSummary, loadCustomerOrder } from './customer-order';

export interface EtlOptions {
  databaseUrl: string;
  dataDir: string;
}

export interface EtlSummary {
  customerOrder: CustomerOrderSummary;
}

/** Pasta das migrações SQL geradas pelo drizzle-kit (igual a partir de src/ e de dist/). */
const MIGRATIONS = resolve(__dirname, '../../drizzle');

/**
 * Carrega os CSV de `dataDir` para a base de dados.
 * Idempotente: aplica as migrações em falta e depois apaga e recarrega tudo
 * dentro de uma única transação (se algo falhar, a base fica como estava).
 */
export async function runEtl({ databaseUrl, dataDir }: EtlOptions): Promise<EtlSummary> {
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const db = drizzle({ client: pool });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    return await db.transaction(async (tx) => ({
      customerOrder: await loadCustomerOrder(tx, dataDir),
    }));
  } finally {
    await pool.end();
  }
}
