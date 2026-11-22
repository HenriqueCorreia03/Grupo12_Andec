import request from 'supertest';
import { fixture4 } from './fixtures/fixture-4';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

const DETALHE = '/api/ondas-e-pedidos/ondas';

describe('Detalhe da onda (drill-through), fixture 4 (casos difíceis)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture4);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('W10: pedidos P1, P2 e P5 (o P3, só com 0 un., fica de fora e conta nas exclusões); P5 está dividido', async () => {
    const onda = (await ctx.get(`${DETALHE}/W10`)).body;
    expect(onda.pedidos.map((p: { pedido: string }) => p.pedido)).toEqual(['P1', 'P2', 'P5']);
    const dividido = Object.fromEntries(onda.pedidos.map((p: { pedido: string; dividido: boolean }) => [p.pedido, p.dividido]));
    expect(dividido).toEqual({ P1: false, P2: false, P5: true });
    expect(onda.exclusoes).toEqual([{ motivo: 'linhas com 0 un. do CO', quantidade: 2 }]);
    expectClose(onda.ocupacao, (5 / 24) * 100);
  });

  it('W10: localizações K-01-01 (zona K, 4 un.) e RC-01 (não mapeada, 1 un.)', async () => {
    const onda = (await ctx.get(`${DETALHE}/W10`)).body;
    expect(onda.localizacoes).toEqual([
      { localizacao: 'K-01-01', zona: 'K', unidades: 4 },
      { localizacao: 'RC-01', zona: null, unidades: 1 },
    ]);
    expect(onda.naoMapeadas).toBe(1);
    expect(onda.zonas).toEqual([{ zona: 'K', unidades: 4 }]);
  });

  it('W10: operadores CO {Operator_1} e PW {Operator_1, Operator_2}', async () => {
    const onda = (await ctx.get(`${DETALHE}/W10`)).body;
    expect(onda.operadores).toEqual({ customerOrder: ['Operator_1'], pickingWave: ['Operator_1', 'Operator_2'] });
  });

  it('W11 (sem picking): 200, pedido P4, ocupação e unidades recolhidas nulas, sem localizações', async () => {
    const onda = (await ctx.get(`${DETALHE}/W11`)).body;
    expect(onda.pedidos.map((p: { pedido: string }) => p.pedido)).toEqual(['P4']);
    expect(onda.ocupacao).toBeNull();
    expect(onda.unidadesRecolhidas).toBeNull();
    expect(onda.localizacoes).toEqual([]);
    expect(onda.operadores).toEqual({ customerOrder: ['Operator_12'], pickingWave: [] });
  });

  it('uma onda que não existe dá 404', async () => {
    const res = await request(ctx.app.getHttpServer()).get(`${DETALHE}/nao-existe`).expect(404);
    expect(res.body.message).toMatch(/nao-existe/);
  });
});
