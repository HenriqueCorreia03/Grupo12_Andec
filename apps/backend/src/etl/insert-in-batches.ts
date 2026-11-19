import type { PgTable } from 'drizzle-orm/pg-core';
import type { Database } from '../db/connection';

const BATCH_SIZE = 1000;

/** Insere as linhas em lotes, para não ultrapassar o limite de parâmetros do PostgreSQL. */
export async function insertInBatches<T extends PgTable>(
  tx: Database,
  table: T,
  rows: T['$inferInsert'][],
): Promise<void> {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await tx.insert(table).values(rows.slice(i, i + BATCH_SIZE));
  }
}
