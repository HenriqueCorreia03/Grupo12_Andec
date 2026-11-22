import { fixture4 } from './fixtures/fixture-4';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Ondas e pedidos, pedidos divididos, fixture 4 (casos difíceis)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture4);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('1 de 4 = 25 % (P5, nas ondas W10 e W12); com ≤ 24 un.: 1; com > 24 un.: 0', async () => {
    const divididos = (await ctx.get('/api/ondas-e-pedidos')).body.pedidosDivididos;
    expectClose(divididos.valor, 25);
    expect(divididos.pedidosDivididos).toBe(1);
    expect(divididos.pedidosValidos).toBe(4);
    expect(divididos.divididosAte24).toBe(1);
    expect(divididos.divididosMaisDe24).toBe(0);
    expectClose(divididos.percentagemAte24, 25);
  });

  it('contrato: a resposta tem exatamente estas chaves (o frontend copia este formato à mão em lib/api.ts)', async () => {
    const corpo = (await ctx.get('/api/ondas-e-pedidos')).body;
    expect(Object.keys(corpo)).toEqual(['pedidosDivididos']);
    expect(Object.keys(corpo.pedidosDivididos).sort()).toEqual(
      [
        'definicao',
        'divididosAte24',
        'divididosMaisDe24',
        'exclusoes',
        'filtrosNaoAplicaveis',
        'fonte',
        'linhasConsideradas',
        'pedidosDivididos',
        'pedidosValidos',
        'percentagemAte24',
        'valor',
      ].sort(),
    );
    expect(corpo.pedidosDivididos.fonte).toBe('Customer_Order');
  });
});
