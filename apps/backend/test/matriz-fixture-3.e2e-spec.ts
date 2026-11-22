import { fixture3 } from './fixtures/fixture-3';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Matriz das alavancas, fixture 3 (pedido dividido, ondas 35678 e 35679)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture3);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('impacto (a): o único artigo A (D05ZS7) tem 4 paragens, todas nas 3 localizações mais usadas → 0 % → nota 1', async () => {
    const { impacto } = (await ctx.get('/api/visao-geral')).body.matriz.a;
    // Ranking do D05ZS7: K-04-13 (2 paragens), K-04-23 (1 paragem, 18 un.), K-06-12 (1 paragem, 1 un.).
    expectClose(impacto.valor, 0);
    expect(impacto.nota).toBe(1);
    expect(impacto.numerador).toBe(0);
    expect(impacto.denominador).toBe(4);
    expect(impacto.artigosA).toBe(1);
    expect(impacto.artigosComRc01NasMaisUsadas).toBe(0);
    expect(impacto.avisoLimiar).toBeNull();
  });

  it('impacto (a), sensibilidade: fora da mais usada 2 de 4 = 50 %; fora das 5 mais usadas 0 %', async () => {
    const { sensibilidade } = (await ctx.get('/api/visao-geral')).body.matriz.a.impacto;
    expect(sensibilidade.map((s: { localizacoes: number }) => s.localizacoes)).toEqual([1, 5]);
    expectClose(sensibilidade[0].valor, 50);
    expectClose(sensibilidade[1].valor, 0);
  });

  it('impacto (b): 0 de 2 pedidos válidos divididos com ≤ 24 un. (o 100147 está dividido mas tem 43 un.) → 0 % → nota 1', async () => {
    const { impacto } = (await ctx.get('/api/visao-geral')).body.matriz.b;
    expectClose(impacto.valor, 0);
    expect(impacto.nota).toBe(1);
    expect(impacto.numerador).toBe(0);
    expect(impacto.denominador).toBe(2);
    expect(impacto.unidades).toBe(0);
    expect(impacto.unidadesTotais).toBe(47);
    expectClose(impacto.percentagemUnidades, 0);
    expect(impacto.notaUnidades).toBe(1);
  });

  it('robustez (a): 47 de 47 un. recolhidas em localizações mapeadas → 100 % → nota 3', async () => {
    const { robustez } = (await ctx.get('/api/visao-geral')).body.matriz.a;
    expectClose(robustez.valor, 100);
    expect(robustez.nota).toBe(3);
    expect(robustez.numerador).toBe(47);
    expect(robustez.denominador).toBe(47);
    expect(robustez.avisoLimiar).toBeNull();
  });

  it('robustez (b): as 8 linhas do CO têm correspondência no PW (onda + referência + tamanho) → 100 % → nota 3', async () => {
    const { robustez } = (await ctx.get('/api/visao-geral')).body.matriz.b;
    expectClose(robustez.valor, 100);
    expect(robustez.nota).toBe(3);
    expect(robustez.numerador).toBe(8);
    expect(robustez.denominador).toBe(8);
    expect(robustez.avisoLimiar).toBeNull();
  });

  it('esforço vem do ficheiro de configuração carregado pelo ETL: (a) 1 alto, (b) 2 médio, rotulado como juízo da equipa', async () => {
    const { matriz } = (await ctx.get('/api/visao-geral')).body;
    expect(matriz.a.esforco).toEqual({
      nota: 1,
      rotulo: 'alto',
      origem: 'juízo da equipa',
      justificacao: expect.stringContaining('mover stock'),
    });
    expect(matriz.b.esforco).toEqual({
      nota: 2,
      rotulo: 'médio',
      origem: 'juízo da equipa',
      justificacao: expect.stringContaining('regra de planeamento'),
    });
  });
});
