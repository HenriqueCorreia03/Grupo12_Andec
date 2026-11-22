import { resolve } from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { connect } from '../db/connection';
import { CustomerOrderSummary, loadCustomerOrder } from './customer-order';
import { loadPickingWave, PickingWaveSummary } from './picking-wave';
import { loadProduct, ProductSummary } from './product';
import { loadStorageLocation, StorageLocationSummary } from './storage-location';

export interface EtlOptions {
  databaseUrl: string;
  dataDir: string;
}

export interface EtlSummary {
  customerOrder: CustomerOrderSummary;
  product: ProductSummary;
  pickingWave: PickingWaveSummary;
  storageLocation: StorageLocationSummary;
}

/** Pasta das migrações SQL geradas pelo drizzle-kit (igual a partir de src/ e de dist/). */
const MIGRATIONS = resolve(__dirname, '../../drizzle');

/**
 * Carrega os CSV de `dataDir` para a base de dados.
 * Idempotente: aplica as migrações em falta e depois apaga e recarrega tudo
 * dentro de uma única transação (se algo falhar, a base fica como estava).
 */
export async function runEtl({ databaseUrl, dataDir }: EtlOptions): Promise<EtlSummary> {
  const { db, close } = connect(databaseUrl);
  try {
    await migrate(db, { migrationsFolder: MIGRATIONS });
    return await db.transaction(async (tx) => ({
      customerOrder: await loadCustomerOrder(tx, dataDir),
      product: await loadProduct(tx, dataDir),
      pickingWave: await loadPickingWave(tx, dataDir),
      storageLocation: await loadStorageLocation(tx, dataDir),
    }));
  } finally {
    await close();
  }
}
