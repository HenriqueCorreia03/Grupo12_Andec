import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export type Database = NodePgDatabase;

export interface Connection {
  db: Database;
  close: () => Promise<void>;
}

/** Abre uma ligação (pool) ao PostgreSQL. Usada pela API e pelo ETL. */
export function connect(databaseUrl: string): Connection {
  const pool = new Pool({ connectionString: databaseUrl });
  return { db: drizzle({ client: pool }), close: () => pool.end() };
}
