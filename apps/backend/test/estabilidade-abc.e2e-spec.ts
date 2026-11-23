import { fixtureEstabilidade } from './fixtures/fixture-estabilidade';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

/** Estabilidade do ABC mensal (ticket 10; spec, "Estabilidade do ABC"), com o limiar de 10 un. */
describe('Estabilidade do ABC, fixture sintética de 3 meses', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixtureEstabilidade);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('classifica cada referência mês a mês, com o ABC de cada mês calculado à parte', async () => {
    const { referencias, meses } = (await ctx.get('/api/artigos/estabilidade')).body;
    expect(meses).toEqual(['2023-01', '2023-02', '2023-03']);
    const classes = Object.fromEntries(
      referencias.map((r: { referencia: string; meses: { classe: string | null }[] }) => [r.referencia, r.meses.map((m) => m.classe)]),
    );
    expect(classes).toEqual({ R1: ['A', 'A', 'A'], R2: ['B', 'A', 'A'], R3: ['C', 'B', 'B'] });
    const r3Janeiro = referencias.find((r: { referencia: string }) => r.referencia === 'R3').meses[0];
    expect(r3Janeiro).toEqual({ mes: '2023-01', classe: 'C', unidades: 5, excluida: true });
  });

  it('% de referências que mudam de classe entre meses consecutivos: 50 %, 0 % e 20 % no total', async () => {
    const body = (await ctx.get('/api/artigos/estabilidade')).body;
    expect(body.limiarUnidades).toBe(10);
    expect(body.transicoes.map((t: { de: string; para: string; comparadas: number; mudaram: number }) => [t.de, t.para, t.comparadas, t.mudaram])).toEqual([
      ['2023-01', '2023-02', 2, 1],
      ['2023-02', '2023-03', 3, 0],
    ]);
    expectClose(body.transicoes[0].percentagem, 50);
    expectClose(body.transicoes[1].percentagem, 0);
    expectClose(body.valor, 20);
    expect(body.comparadas).toBe(5);
    expect(body.mudaram).toBe(1);
  });

  it('mostra o nº e a % de combinações referência-mês excluídas (< 10 un.): 1 de 9', async () => {
    const { combinacoes, exclusoes } = (await ctx.get('/api/artigos/estabilidade')).body;
    expect(combinacoes.comUnidades).toBe(9);
    expect(combinacoes.excluidas).toBe(1);
    expectClose(combinacoes.percentagemExcluidas, (1 / 9) * 100);
    expect(exclusoes).toEqual([{ motivo: 'combinações referência-mês com < 10 un.', quantidade: 1 }]);
  });

  it('o período limita os meses: com fevereiro a março só há uma transição (0 %)', async () => {
    const body = (await ctx.get('/api/artigos/estabilidade?inicio=2023-02-01&fim=2023-03-31')).body;
    expect(body.meses).toEqual(['2023-02', '2023-03']);
    expect(body.transicoes).toHaveLength(1);
    expectClose(body.valor, 0);
  });

  it('compara com o período anterior como rácio (direto): sem período não há anterior', async () => {
    expect((await ctx.get('/api/artigos/estabilidade')).body.comparacao).toMatchObject({ disponivel: false });
    const marco = (await ctx.get('/api/artigos/estabilidade?inicio=2023-03-01&fim=2023-03-31')).body;
    expect(marco.comparacao).toMatchObject({ disponivel: true, modo: 'direto' });
  });
});
