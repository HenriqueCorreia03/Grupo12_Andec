import { resolve } from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { connect } from '../db/connection';
import { CustomerOrderSummary, loadCustomerOrder } from './customer-order';
import { CustomerOrderZoneSummary, loadCustomerOrderZone } from './customer-order-zone';
import { EsforcoMatrizSummary, loadEsforcoMatriz } from './esforco-matriz';
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
  customerOrderZone: CustomerOrderZoneSummary;
  esforcoMatriz: EsforcoMatrizSummary;
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
    return await db.transaction(async (tx) => {
      const customerOrder = await loadCustomerOrder(tx, dataDir);
      const product = await loadProduct(tx, dataDir);
      const pickingWave = await loadPickingWave(tx, dataDir);
      const storageLocation = await loadStorageLocation(tx, dataDir);
      // A ligação CO ↔ PW precisa das quatro tabelas já carregadas.
      const customerOrderZone = await loadCustomerOrderZone(tx);
      // Esforço da matriz: ficheiro de configuração versionado (não vem de DATA_DIR).
      const esforcoMatriz = await loadEsforcoMatriz(tx);
      return { customerOrder, product, pickingWave, storageLocation, customerOrderZone, esforcoMatriz };
    });
  } finally {
    await close();
  }
}
