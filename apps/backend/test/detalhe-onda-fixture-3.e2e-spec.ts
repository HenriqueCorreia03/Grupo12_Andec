import { fixture3 } from './fixtures/fixture-3';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

const DETALHE = '/api/ondas-e-pedidos/ondas';

describe('Detalhe da onda (drill-through), fixture 3: pedido 100147 nas ondas 35678 e 35679', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture3);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('onda 35679: 1 pedido (100147, dividido), 23 un., ocupação 95,8333 %, localizações K-06-12 e K-04-13', async () => {
    const onda = (await ctx.get(`${DETALHE}/35679`)).body;
    expect(onda).toMatchObject({ onda: '35679', data: '2023-03-16', hora: '06:34', unidadesRecolhidas: 23 });
    expectClose(onda.ocupacao, (23 / 24) * 100);

    expect(onda.pedidos).toEqual([
      { pedido: '100147', unidades: 23, unidadesDoPedido: 43, linhas: 2, dividido: true, outrasOndas: ['35678'] },
    ]);

    const localizacoes = Object.fromEntries(
      onda.localizacoes.map((l: { localizacao: string; zona: string; unidades: number }) => [l.localizacao, [l.zona, l.unidades]]),
    );
    expect(localizacoes).toEqual({ 'K-06-12': ['K', 1], 'K-04-13': ['K', 22] });
  });

  it('onda 35678: 2 pedidos; só o 100147 está dividido (o 100146 está só nesta onda); zonas K 20, O 3 e J 1', async () => {
    const onda = (await ctx.get(`${DETALHE}/35678`)).body;
    expect(onda.unidadesRecolhidas).toBe(24);
    expectClose(onda.ocupacao, 100);
    expect(onda.pedidos).toEqual([
      { pedido: '100146', unidades: 4, unidadesDoPedido: 4, linhas: 4, dividido: false, outrasOndas: [] },
      { pedido: '100147', unidades: 20, unidadesDoPedido: 43, linhas: 2, dividido: true, outrasOndas: ['35679'] },
    ]);
    expect(onda.zonas).toEqual([
      { zona: 'K', unidades: 20 },
      { zona: 'O', unidades: 3 },
      { zona: 'J', unidades: 1 },
    ]);
    expect(onda.naoMapeadas).toBe(0);
  });

  it('as linhas do CO da onda 35679, pela ordem de recolha do pedido (orderToCollect 2 e 3), com o tamanho normalizado', async () => {
    const onda = (await ctx.get(`${DETALHE}/35679`)).body;
    expect(onda.linhas).toEqual([
      { pedido: '100147', referencia: 'D05ZS7', tamanho: 8.5, unidades: 22, duplicada: false },
      { pedido: '100147', referencia: 'D05ZS7', tamanho: 10, unidades: 1, duplicada: false },
    ]);
  });

  it('operadores: o atribuído (CO) e o recolhedor (PW) vêm em separado', async () => {
    const onda = (await ctx.get(`${DETALHE}/35679`)).body;
    expect(onda.operadores).toEqual({ customerOrder: ['Operator_17'], pickingWave: ['Operator_17'] });
  });
});
