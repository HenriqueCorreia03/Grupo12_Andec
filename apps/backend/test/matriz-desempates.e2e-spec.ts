import { fixtureMatriz } from './fixtures/fixture-matriz';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Matriz das alavancas, fixture da matriz (desempates do ranking e limiar exato)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixtureMatriz);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('impacto (a): 3 de 10 paragens de artigos A fora das 3 mais usadas = 30 % exatos → nota 3, com aviso de limiar', async () => {
    const { impacto } = (await ctx.get('/api/visao-geral')).body.matriz.a;
    expect(impacto.artigosA).toBe(2);
    expect(impacto.denominador).toBe(10);
    expect(impacto.numerador).toBe(3);
    expectClose(impacto.valor, 30);
    expect(impacto.nota).toBe(3);
    expect(impacto.avisoLimiar).toBe('Colada ao limiar dos 30 %: a nota é frágil.');
  });

  it('desempates: no R1 o RC-01 entra nas 3 mais usadas pelas unidades; no R2 fica de fora pelo código → 1 artigo', async () => {
    const { impacto } = (await ctx.get('/api/visao-geral')).body.matriz.a;
    expect(impacto.artigosComRc01NasMaisUsadas).toBe(1);
  });

  it('sensibilidade: fora da mais usada 7 de 10 = 70 %; fora das 5 mais usadas 0 %', async () => {
    const { sensibilidade } = (await ctx.get('/api/visao-geral')).body.matriz.a.impacto;
    expectClose(sensibilidade[0].valor, 70);
    expectClose(sensibilidade[1].valor, 0);
  });

  it('robustez: (a) 9 de 12 un. em mapeadas = 75 % → 1; (b) 4 de 5 linhas com correspondência = 80 % → 1', async () => {
    const { a, b } = (await ctx.get('/api/visao-geral')).body.matriz;
    expectClose(a.robustez.valor, 75);
    expect(a.robustez.nota).toBe(1);
    expectClose(b.robustez.valor, 80);
    expect(b.robustez.nota).toBe(1);
  });

  it('a matriz é sempre do dataset completo: com filtros, os valores não mudam e os filtros aparecem como não aplicáveis', async () => {
    const semFiltros = (await ctx.get('/api/visao-geral')).body.matriz;
    const comFiltros = (await ctx.get('/api/visao-geral?mes=2023-05&referencia=R1&operador=Operator_1')).body.matriz;
    expect(semFiltros.filtrosNaoAplicaveis).toEqual([]);
    expect(comFiltros.filtrosNaoAplicaveis).toEqual(['período', 'referência', 'operador']);
    expect({ ...comFiltros, filtrosNaoAplicaveis: [] }).toEqual(semFiltros);
  });

  it('a matriz diz o que mostra: potencial observado, nunca ganho esperado', async () => {
    const { matriz } = (await ctx.get('/api/visao-geral')).body;
    expect(matriz.nota).toMatch(/potencial observado/i);
    expect(matriz.nota).toMatch(/nunca .*ganho/i);
  });
});
