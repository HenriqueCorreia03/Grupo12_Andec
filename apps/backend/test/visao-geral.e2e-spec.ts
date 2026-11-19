import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { runEtl } from '../src/etl/run-etl';
import { fixture1 } from './fixtures/fixture-1';
import { expectClose } from './support/expect-close';
import { removeFixture, writeFixture } from './support/fixture-files';
import { testDatabaseUrl } from './support/test-database';

describe('Visão geral, fixture 1 (onda 33444)', () => {
  let app: INestApplication<App>;
  let dataDir: string;
  let databaseUrl: string;

  beforeAll(async () => {
    databaseUrl = testDatabaseUrl();
    dataDir = await writeFixture(fixture1);
    await runEtl({ databaseUrl, dataDir });

    process.env.DATABASE_URL = databaseUrl;
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await removeFixture(dataDir);
  });

  it('devolve o tamanho médio da encomenda (7 ÷ 3), a mediana 2 e o p90 2,8, sem arredondamento', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/visao-geral')
      .expect(200);

    const tamanho = res.body.tamanhoMedioEncomenda;
    expectClose(tamanho.valor, 7 / 3);
    expectClose(tamanho.mediana, 2);
    expectClose(tamanho.p90, 2.8);
    expect(tamanho.pedidosExcluidos).toBe(0);
    expect(tamanho.fonte).toBe('Customer_Order');
    expect(tamanho.definicao).toEqual(expect.stringContaining('pedidos válidos'));
  });

  it('o ETL é idempotente: corrido outra vez dá o mesmo JSON e não altera os CSV', async () => {
    const antes = await request(app.getHttpServer()).get('/api/visao-geral').expect(200);
    const datasAntes = await modificationTimes(dataDir);

    await runEtl({ databaseUrl, dataDir });

    const depois = await request(app.getHttpServer()).get('/api/visao-geral').expect(200);
    expect(depois.body).toEqual(antes.body);
    expect(await modificationTimes(dataDir)).toEqual(datasAntes);
  });
});

async function modificationTimes(dir: string): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  for (const name of Object.keys(fixture1)) {
    result[name] = (await stat(join(dir, name))).mtimeMs;
  }
  return result;
}
