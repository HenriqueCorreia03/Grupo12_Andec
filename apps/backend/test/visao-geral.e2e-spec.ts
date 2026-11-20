import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fixture1 } from './fixtures/fixture-1';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';
import { runEtlCommand } from './support/run-etl-command';

describe('Visão geral, fixture 1 (onda 33444)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture1);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('devolve o tamanho médio da encomenda (7 ÷ 3), a mediana 2 e o p90 2,8, sem arredondamento', async () => {
    const tamanho = (await ctx.get('/api/visao-geral')).body.tamanhoMedioEncomenda;
    expectClose(tamanho.valor, 7 / 3);
    expectClose(tamanho.mediana, 2);
    expectClose(tamanho.p90, 2.8);
    expect(tamanho.pedidosExcluidos).toBe(0);
    expect(tamanho.fonte).toBe('Customer_Order');
    expect(tamanho.definicao).toEqual(expect.stringContaining('pedidos válidos'));
  });

  it('devolve 3 pedidos por onda (1 onda, mediana 3, nenhuma onda com 1 pedido)', async () => {
    const porOnda = (await ctx.get('/api/visao-geral')).body.pedidosPorOnda;
    expectClose(porOnda.valor, 3);
    expectClose(porOnda.mediana, 3);
    expect(porOnda.ondas).toBe(1);
    expect(porOnda.ondasComUmPedido).toBe(0);
    expect(porOnda.fonte).toBe('Customer_Order');
    expect(porOnda.nota).toMatch(/universo de ondas = CO/i);
  });

  it('devolve a participação por setor PF = 100 % e 0 % de pedidos multissetor (0 de 3)', async () => {
    const body = (await ctx.get('/api/visao-geral')).body;
    expect(body.participacaoPorSetor.setores).toHaveLength(1);
    expect(body.participacaoPorSetor.setores[0].setor).toBe('PF');
    expectClose(body.participacaoPorSetor.setores[0].percentagem, 100);
    expect(body.participacaoPorSetor.fonte).toBe('Customer_Order + Product');

    const multi = body.pedidosMultissetor;
    expectClose(multi.valor, 0);
    expect(multi.pedidosMultissetor).toBe(0);
    expect(multi.pedidosValidos).toBe(3);
    expect(multi.fonte).toBe('Customer_Order + Product');
    expect(multi.limitacao).toEqual(expect.stringContaining('único setor'));
    expect(body.participacaoPorSetor.limitacao).toEqual(expect.stringContaining('único setor'));
  });

  it('o ETL é idempotente: corrido outra vez dá o mesmo JSON e não altera os CSV', async () => {
    const antes = await ctx.get('/api/visao-geral');
    const datasAntes = await modificationTimes(ctx.dataDir);

    await runEtlCommand({ DATABASE_URL: ctx.databaseUrl, DATA_DIR: ctx.dataDir });

    const depois = await ctx.get('/api/visao-geral');
    expect(depois.body).toEqual(antes.body);
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
