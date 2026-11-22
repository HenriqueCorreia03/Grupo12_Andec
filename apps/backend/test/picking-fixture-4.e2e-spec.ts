import { fixture4 } from './fixtures/fixture-4';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Picking, fixture 4 (casos difíceis, parte do PW)', () => {
  let ctx: AppWithFixture;
  let corpo: Record<string, any>;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture4);
    corpo = (await ctx.get('/api/ondas-e-pedidos/picking')).body;
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('W10 = 5 un. (as 3 linhas iguais de D1 em K-01-01 contam 3: o PW não tem regra de duplicados) e W12 = 1 un.', () => {
    const porOnda = Object.fromEntries(corpo.ondas.map((o: { onda: string; unidades: number }) => [o.onda, o.unidades]));
    expect(porOnda).toEqual({ W10: 5, W12: 1 });
  });

  it('ocupação: W10 = 5 ÷ 24 = 20,8333 %, W12 = 1 ÷ 24 = 4,1667 %, média 12,5 %; a W11 (sem picking) fica de fora', () => {
    expectClose(corpo.ocupacao.valor, 12.5);
    expect(corpo.ocupacao.ondas).toBe(2);
    const porOnda = Object.fromEntries(corpo.ondas.map((o: { onda: string; ocupacao: number }) => [o.onda, o.ocupacao]));
    expectClose(porOnda.W10, (5 / 24) * 100);
    expectClose(porOnda.W12, (1 / 24) * 100);
    expect(corpo.ondas.map((o: { onda: string }) => o.onda)).not.toContain('W11');
  });

  it('3 paragens (W10: K-01-01 e RC-01; W12: K-01-01); localizações por onda 2 e 1 (média 1,5)', () => {
    expect(corpo.paragens.valor).toBe(3);
    expectClose(corpo.localizacoesPorOnda.media, 1.5);
    expectClose(corpo.localizacoesPorOnda.mediana, 1.5);
  });

  it('W10 e W12 são de 02/02/2023 às 10:00', () => {
    for (const onda of corpo.ondas) {
      expect(onda.data).toBe('2023-02-02');
      expect(onda.hora).toBe('10:00');
    }
  });
});
