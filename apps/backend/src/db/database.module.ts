import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { loadEnv } from '../config/env';

export const DATABASE = Symbol('DATABASE');
export type Database = NodePgDatabase;

const POOL = Symbol('POOL');

@Global()
@Module({
  providers: [
    {
      provide: POOL,
      useFactory: () => {
        loadEnv();
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
          throw new Error('Falta DATABASE_URL no .env da raiz (ver .env.example).');
        }
        return new Pool({ connectionString });
      },
    },
    {
      provide: DATABASE,
      inject: [POOL],
      useFactory: (pool: Pool): Database => drizzle({ client: pool }),
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
