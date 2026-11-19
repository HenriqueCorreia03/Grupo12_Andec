import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { requireEnv } from '../config/env';
import { connect, type Connection, type Database } from './connection';

export const DATABASE = Symbol('DATABASE');
export type { Database };

const CONNECTION = Symbol('CONNECTION');

@Global()
@Module({
  providers: [
    { provide: CONNECTION, useFactory: () => connect(requireEnv('DATABASE_URL')) },
    { provide: DATABASE, inject: [CONNECTION], useFactory: (c: Connection) => c.db },
  ],
  exports: [DATABASE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(CONNECTION) private readonly connection: Connection) {}

  async onApplicationShutdown(): Promise<void> {
    await this.connection.close();
  }
}
