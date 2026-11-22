import { fixture3 } from './fixtures/fixture-3';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Ondas e pedidos, pedidos divididos, fixture 3 (pedido 100147 nas ondas 35678 e 35679)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture3);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('1 de 2 = 50 %; o 100147 tem 43 un. no pedido completo (20 + 23): > 24 un.: 1; ≤ 24 un.: 0', async () => {
    const divididos = (await ctx.get('/api/ondas-e-pedidos')).body.pedidosDivididos;
    expectClose(divididos.valor, 50);
    expect(divididos.pedidosDivididos).toBe(1);
    expect(divididos.pedidosValidos).toBe(2);
    expect(divididos.divididosMaisDe24).toBe(1);
    expect(divididos.divididosAte24).toBe(0);
    expectClose(divididos.percentagemAte24, 0);
  });
});
