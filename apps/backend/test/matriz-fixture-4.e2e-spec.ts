import { fixture4 } from './fixtures/fixture-4';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Matriz das alavancas, fixture 4 (casos difíceis)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture4);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('impacto (a): artigos A com picking D1 e D4 (o D2 é A mas nunca foi recolhido); 4 paragens, nenhuma fora das 3 mais usadas → 0 %', async () => {
    const { impacto } = (await ctx.get('/api/visao-geral')).body.matriz.a;
    // D1: (W10, K-01-01) e (W10, RC-01); D4: (W10, K-01-01) e (W12, K-01-01).
    expect(impacto.artigosA).toBe(2);
    expect(impacto.denominador).toBe(4);
    expect(impacto.numerador).toBe(0);
    expectClose(impacto.valor, 0);
    expect(impacto.nota).toBe(1);
    // O RC-01 (não mapeado) entra no ranking como as outras: está entre as 3 mais usadas do D1.
    expect(impacto.artigosComRc01NasMaisUsadas).toBe(1);
  });

  it('impacto (a), sensibilidade: com 1 localização, o RC-01 do D1 fica de fora (empata em paragens com K-01-01, perde nas unidades 1 vs 3) → 1 de 4 = 25 %', async () => {
    const { sensibilidade } = (await ctx.get('/api/visao-geral')).body.matriz.a.impacto;
    expectClose(sensibilidade[0].valor, 25);
    expectClose(sensibilidade[1].valor, 0);
  });

  it('impacto (b): P5 (2 un., ondas W10 e W12) é o único dividido com ≤ 24 un. → 1 de 4 = 25 % → nota 2; em unidades 2 de 12 = 16,67 % → 2', async () => {
    const { impacto } = (await ctx.get('/api/visao-geral')).body.matriz.b;
    expect(impacto.numerador).toBe(1);
    expect(impacto.denominador).toBe(4);
    expectClose(impacto.valor, 25);
    expect(impacto.nota).toBe(2);
    expect(impacto.unidades).toBe(2);
    expect(impacto.unidadesTotais).toBe(12);
    expectClose(impacto.percentagemUnidades, (2 / 12) * 100);
    expect(impacto.notaUnidades).toBe(2);
    expect(impacto.avisoLimiar).toBeNull();
  });

  it('robustez (a): 5 de 6 un. recolhidas em localizações mapeadas (1 no RC-01) → 83,33 % → nota 1, sem aviso (a 1,67 pontos dos 85 %)', async () => {
    const { robustez } = (await ctx.get('/api/visao-geral')).body.matriz.a;
    expect(robustez.numerador).toBe(5);
    expect(robustez.denominador).toBe(6);
    expectClose(robustez.valor, (5 / 6) * 100);
    expect(robustez.nota).toBe(1);
    expect(robustez.avisoLimiar).toBeNull();
  });

  it('robustez (b): 5 de 9 linhas do CO com correspondência (L1, L2, L5, L8, L9); as linhas a zero, o tamanho vazio e a onda sem picking ficam sem → 55,56 % → nota 1', async () => {
    const { robustez } = (await ctx.get('/api/visao-geral')).body.matriz.b;
    expect(robustez.numerador).toBe(5);
    expect(robustez.denominador).toBe(9);
    expectClose(robustez.valor, (5 / 9) * 100);
    expect(robustez.nota).toBe(1);
  });
});
