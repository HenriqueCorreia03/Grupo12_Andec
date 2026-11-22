import { fixtureLimitesDivididos } from './fixtures/fixture-pedidos-divididos';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Ondas e pedidos, pedidos divididos, casos-limite (fixture sintética)', () => {
  let ctx: AppWithFixture;
  let divididos: Record<string, any>;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixtureLimitesDivididos);
    divididos = (await ctx.get('/api/ondas-e-pedidos')).body.pedidosDivididos;
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('3 de 5 pedidos válidos = 60 %: PA (24 un.), PB (25 un.) e PC (3 ondas)', () => {
    expectClose(divididos.valor, 60);
    expect(divididos.pedidosDivididos).toBe(3);
    expect(divididos.pedidosValidos).toBe(5);
  });

  it('exatamente 24 un. é evitável (≤ 24) e 25 un. é inevitável (> 24); o pedido em 3 ondas conta uma vez', () => {
    expect(divididos.divididosAte24).toBe(2); // PA (24) e PC (3 ondas, 3 un.)
    expect(divididos.divididosMaisDe24).toBe(1); // PB (25)
    expectClose(divididos.percentagemAte24, 40);
  });

  it('o pedido com uma linha a 0 na 2.ª onda (PD) e o pedido com duas linhas na mesma onda (PE) não são divididos', () => {
    // Se PD ou PE contassem como divididos, teríamos 5 e não 3.
    expect(divididos.pedidosDivididos).toBe(3);
  });

  it('exclui 1 pedido com 0 un. (PF) e conta 3 linhas a 0 (PD 1 + PF 2), cada uma por si', () => {
    expect(divididos.exclusoes).toEqual(
      expect.arrayContaining([
        { motivo: 'pedidos com 0 un.', quantidade: 1 },
        { motivo: 'linhas com 0 un.', quantidade: 3 },
      ]),
    );
    expect(divididos.exclusoes).toHaveLength(2);
  });

  it('as linhas consideradas são as 10 linhas com unidades > 0', () => {
    expect(divididos.linhasConsideradas).toBe(10);
  });
});
