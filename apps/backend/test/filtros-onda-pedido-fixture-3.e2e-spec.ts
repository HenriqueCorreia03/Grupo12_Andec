import { fixture3 } from './fixtures/fixture-3';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

const PICKING = '/api/ondas-e-pedidos/picking';

describe('Filtros de onda e de pedido (fixture 3: pedido 100147 nas ondas 35678 e 35679)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture3);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('onda 35679: 1 pedido e 23 un. na encomenda; o 100147 continua dividido (propriedade do pedido completo)', async () => {
    const visao = (await ctx.get('/api/visao-geral?onda=35679')).body;
    expect(visao.tamanhoMedioEncomenda.pedidosConsiderados).toBe(1);
    expectClose(visao.tamanhoMedioEncomenda.valor, 23);

    const divididos = (await ctx.get('/api/ondas-e-pedidos?onda=35679')).body.pedidosDivididos;
    expect(divididos.pedidosValidos).toBe(1);
    expect(divididos.pedidosDivididos).toBe(1);
    expectClose(divididos.valor, 100);
    expect(divididos.divididosMaisDe24).toBe(1);
  });

  it('onda 35679 no picking: 23 un., ocupação 95,8333 %', async () => {
    const picking = (await ctx.get(`${PICKING}?onda=35679`)).body;
    expect(picking.ondas).toHaveLength(1);
    expect(picking.ondas[0]).toMatchObject({ onda: '35679', unidades: 23 });
    expectClose(picking.ocupacao.valor, (23 / 24) * 100);
    expectClose(picking.ondas[0].ocupacao, 95.83333333333333);
  });

  it('pedido 100146: 1 pedido e 4 un. na encomenda; no picking o filtro é "não aplicável" e nada muda', async () => {
    const visao = (await ctx.get('/api/visao-geral?pedido=100146')).body;
    expect(visao.tamanhoMedioEncomenda.pedidosConsiderados).toBe(1);
    expectClose(visao.tamanhoMedioEncomenda.valor, 4);
    expect(visao.tamanhoMedioEncomenda.filtrosNaoAplicaveis).toEqual([]);

    const semFiltro = (await ctx.get(PICKING)).body;
    const comPedido = (await ctx.get(`${PICKING}?pedido=100146`)).body;
    expect(comPedido.ocupacao.filtrosNaoAplicaveis).toEqual(['pedido']);
    expect(comPedido.ondas).toEqual(semFiltro.ondas);
    expectClose(comPedido.ocupacao.valor, 97.91666666666667);
  });

  it('uma onda ou um pedido que não existem dão "sem dados" (nulos), não 0 nem erro', async () => {
    const visao = (await ctx.get('/api/visao-geral?onda=99999')).body;
    expect(visao.tamanhoMedioEncomenda.valor).toBeNull();
    const divididos = (await ctx.get('/api/ondas-e-pedidos?pedido=nao-existe')).body.pedidosDivididos;
    expect(divididos.valor).toBeNull();
  });
});
