import { fixture2 } from './fixtures/fixture-2';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

/**
 * Comparação ABC ↔ ABCCOD (ticket 16; spec, "Classificação ABC": o ABCCOD do Product é só contraste).
 * Fixture 2: ABC calculado SYN01 A, SYN02 A, SYN03 A, SYN04 B, SYN05 C, SYN06 C (spec, "Fixture 2");
 * ABCCOD do Product: A, A, B, B, C, C. Coincidem 5 de 6 (só SYN03 difere: A calculado, B no ABCCOD).
 */
describe('ABC calculado vs ABCCOD do Product, fixture 2', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture2);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('mostra a matriz de coincidência: linhas = ABC calculado, colunas = ABCCOD', async () => {
    const { matriz } = (await ctx.get('/api/artigos/abc-vs-abccod')).body;
    expect(matriz).toEqual([
      { classe: 'A', abccod: { A: 2, B: 1, C: 0 } },
      { classe: 'B', abccod: { A: 0, B: 1, C: 0 } },
      { classe: 'C', abccod: { A: 0, B: 0, C: 2 } },
    ]);
  });

  it('% de coincidência: 5 de 6 referências', async () => {
    const body = (await ctx.get('/api/artigos/abc-vs-abccod')).body;
    expect(body.coincidem).toBe(5);
    expect(body.comparadas).toBe(6);
    expectClose(body.valor, (5 / 6) * 100);
    expect(body.fonte).toBe('Customer_Order + Product');
    expect(body.filtrosNaoAplicaveis).toEqual([]);
  });

  it('explica que o ABCCOD usa outro critério ou período e remete para a pergunta ao docente', async () => {
    const { nota } = (await ctx.get('/api/artigos/abc-vs-abccod')).body;
    expect(nota).toMatch(/ABCCOD/);
    expect(nota).toMatch(/critério/);
    expect(nota).toMatch(/docente/);
  });

  it('usa sempre o dataset completo: com um mês escolhido os valores não mudam e o período é "não aplicável"', async () => {
    const body = (await ctx.get('/api/artigos/abc-vs-abccod?mes=2023-01')).body;
    expect(body.filtrosNaoAplicaveis).toEqual(['período']);
    expect(body.coincidem).toBe(5);
    expect(body.comparadas).toBe(6);
  });
});
