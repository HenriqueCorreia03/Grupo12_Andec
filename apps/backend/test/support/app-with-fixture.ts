import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { FixtureFiles, removeFixture, writeFixture } from './fixture-files';
import { runEtlCommand } from './run-etl-command';
import { testDatabaseUrl } from './test-database';

export interface AppWithFixture {
  app: INestApplication<App>;
  databaseUrl: string;
  dataDir: string;
  /** GET a um endpoint da API; falha se a resposta não for 200. */
  get: (path: string) => Promise<request.Response>;
  close: () => Promise<void>;
}

/**
 * Escreve a fixture numa pasta temporária, corre `npm run etl` contra a base de teste
 * e arranca a aplicação ligada a essa base.
 */
export async function startAppWithFixture(files: FixtureFiles): Promise<AppWithFixture> {
  const databaseUrl = testDatabaseUrl();
  const dataDir = await writeFixture(files);
  await runEtlCommand({ DATABASE_URL: databaseUrl, DATA_DIR: dataDir });

  // A aplicação lê DATABASE_URL; repõe-se no close(), para outro bloco do mesmo ficheiro poder arrancar.
  const databaseUrlAnterior = process.env.DATABASE_URL;
  process.env.DATABASE_URL = databaseUrl;
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  await app.init();

  return {
    app,
    databaseUrl,
    dataDir,
    get: (path) => request(app.getHttpServer()).get(path).expect(200),
    close: async () => {
      await app.close();
      await removeFixture(dataDir);
      process.env.DATABASE_URL = databaseUrlAnterior;
    },
  };
}
