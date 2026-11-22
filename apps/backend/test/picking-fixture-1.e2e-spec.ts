import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fixture1 } from './fixtures/fixture-1';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';
import { runEtlCommand } from './support/run-etl-command';

describe('Picking, fixture 1 (onda 33444)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture1);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('ocupação = 7 ÷ 24 = 29,1667 % (cada linha do PW é 1 un.), sem arredondamento', async () => {
    const { ocupacao } = (await ctx.get('/api/ondas-e-pedidos/picking')).body;
    expectClose(ocupacao.valor, (7 / 24) * 100);
    expect(ocupacao.ondas).toBe(1);
    expect(ocupacao.fonte).toBe('Picking_Wave');
  });

  it('lista a onda 33444 com a data (10/01/2023) e a hora (11:05) vindas do CO, 7 un., 4 paragens e 4 localizações', async () => {
    const { ondas } = (await ctx.get('/api/ondas-e-pedidos/picking')).body;
    expect(ondas).toHaveLength(1);
    expect(ondas[0]).toMatchObject({
      onda: '33444',
      data: '2023-01-10',
      hora: '11:05',
      unidades: 7,
      paragens: 4,
      localizacoes: 4,
    });
    expectClose(ondas[0].ocupacao, (7 / 24) * 100);
  });

  it('o ETL é idempotente: corrido outra vez dá o mesmo JSON (a ocupação seria 58,33 % se o PW fosse carregado a dobrar) e não altera os CSV', async () => {
    const antes = await ctx.get('/api/ondas-e-pedidos/picking');
    const datasAntes = await modificationTimes(ctx.dataDir);

    await runEtlCommand({ DATABASE_URL: ctx.databaseUrl, DATA_DIR: ctx.dataDir });

    const depois = await ctx.get('/api/ondas-e-pedidos/picking');
    expect(depois.body).toEqual(antes.body);
    expectClose(depois.body.ocupacao.valor, (7 / 24) * 100);
    expect(await modificationTimes(ctx.dataDir)).toEqual(datasAntes);
  });
});

async function modificationTimes(dir: string): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  for (const name of Object.keys(fixture1)) {
    result[name] = (await stat(join(dir, name))).mtimeMs;
  }
  return result;
}
