import { fixtureSemPedidosValidos } from './fixtures/fixture-pedidos-divididos';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';

describe('Ondas e pedidos, pedidos divididos, sem pedidos válidos', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixtureSemPedidosValidos);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('"sem dados": responde 200 com valor nulo e 0 pedidos válidos (diferente de "0 divididos", que dá valor 0)', async () => {
    const divididos = (await ctx.get('/api/ondas-e-pedidos')).body.pedidosDivididos;
    expect(divididos.valor).toBeNull();
    expect(divididos.percentagemAte24).toBeNull();
    expect(divididos.pedidosValidos).toBe(0);
    expect(divididos.pedidosDivididos).toBe(0);
    expect(divididos.exclusoes).toEqual(
      expect.arrayContaining([{ motivo: 'pedidos com 0 un.', quantidade: 1 }]),
    );
  });
});
