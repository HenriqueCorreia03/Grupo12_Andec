import { fixture2 } from './fixtures/fixture-2';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Ondas e pedidos, pedidos divididos, fixture 2 (nenhum pedido dividido)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture2);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('0 de 3 = 0 %: o valor é 0 e não nulo, porque há pedidos válidos', async () => {
    const divididos = (await ctx.get('/api/ondas-e-pedidos')).body.pedidosDivididos;
    expect(divididos.valor).toBe(0);
    expect(divididos.pedidosDivididos).toBe(0);
    expect(divididos.pedidosValidos).toBe(3);
    expect(divididos.divididosMaisDe24).toBe(0);
    expect(divididos.divididosAte24).toBe(0);
  });
});
