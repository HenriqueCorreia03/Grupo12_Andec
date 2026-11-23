import { fixture3 } from './fixtures/fixture-3';
import { fixture4 } from './fixtures/fixture-4';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

type Artigo = { posicao: number; referencia: string; paragens: number; localizacoesDistintas: number; classe: string };
const resumo = (artigos: Artigo[]) => artigos.map((a) => [a.posicao, a.referencia, a.paragens, a.localizacoesDistintas]);

/**
 * Prioridade dos artigos da alavanca (a) (ticket 10; spec, "Critérios de prioridade" 2):
 * nº de paragens (pares distintos onda × localização) decrescente; desempate pelo nº de localizações
 * distintas (decrescente) e depois pelo código da referência (crescente).
 */
describe('Prioridade dos artigos, fixture 3 (6 paragens)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture3);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('D05ZS7 tem 4 paragens em 3 localizações; QXS5D1 e 05W6TK empatam e 05W6TK ganha pelo código', async () => {
    const body = (await ctx.get('/api/artigos/prioridade')).body;
    expect(resumo(body.artigos)).toEqual([
      [1, 'D05ZS7', 4, 3],
      [2, '05W6TK', 1, 1],
      [3, 'QXS5D1', 1, 1],
    ]);
    expect(body.artigos.reduce((total: number, a: Artigo) => total + a.paragens, 0)).toBe(6);
    expect(body.artigos[0].classe).toBe('A');
    expect(body.fonte).toBe('Picking_Wave');
  });

  it('resume a dispersão dos artigos A (classe global): 1 artigo A, com picking, em 3 localizações', async () => {
    const { resumoA } = (await ctx.get('/api/artigos/prioridade')).body;
    expect(resumoA.artigosA).toBe(1);
    expect(resumoA.artigosAComPicking).toBe(1);
    expectClose(resumoA.localizacoes.mediana, 3);
  });
});

describe('Prioridade dos artigos, fixture 4 (RC-01 e desempate por localizações)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture4);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('D1 e D4 têm 2 paragens; D1 ganha por sair de 2 localizações (K-01-01 e RC-01, que conta como 1)', async () => {
    const body = (await ctx.get('/api/artigos/prioridade')).body;
    expect(resumo(body.artigos)).toEqual([
      [1, 'D1', 2, 2],
      [2, 'D4', 2, 1],
    ]);
    expect(body.artigos[0].passaPeloRc01).toBe(true);
    expect(body.artigos[1].passaPeloRc01).toBe(false);
    expect(body.limitacao).toEqual(expect.stringContaining('RC-01'));
  });

  it('artigos A (classe global D1, D2, D4): 3, dos quais 2 com picking (D2 nunca é recolhido)', async () => {
    const { resumoA } = (await ctx.get('/api/artigos/prioridade')).body;
    expect(resumoA.artigosA).toBe(3);
    expect(resumoA.artigosAComPicking).toBe(2);
  });

  it('os filtros aplicam-se: com o operador Operator_2 só fica a paragem de D1 no RC-01', async () => {
    const { artigos } = (await ctx.get('/api/artigos/prioridade?operador=Operator_2')).body;
    expect(resumo(artigos)).toEqual([[1, 'D1', 1, 1]]);
  });
});
