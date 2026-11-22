import { fixture4 } from './fixtures/fixture-4';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

const PICKING = '/api/ondas-e-pedidos/picking';

describe('Filtro de operador recolhedor (fixture 4)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture4);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('Operator_1 no picking: 5 un., 2 paragens e 1 localização distinta', async () => {
    const corpo = (await ctx.get(`${PICKING}?operador=Operator_1`)).body;
    const unidades = corpo.ondas.reduce((total: number, o: { unidades: number }) => total + o.unidades, 0);
    expect(unidades).toBe(5);
    expect(corpo.paragens.valor).toBe(2);
    // As duas ondas (W10 e W12) passam só por K-01-01: 1 localização em cada uma.
    expectClose(corpo.localizacoesPorOnda.media, 1);
    expect(corpo.localizacoesPorOnda.maximo).toBe(1);
  });

  it('Operator_2: 1 un. no RC-01 (não mapeada); a ocupação da W10 continua a ser a da onda completa (5 ÷ 24)', async () => {
    const zonas = (await ctx.get('/api/artigos/zonas?operador=Operator_2')).body.participacaoPorZona;
    expect(zonas.zonas).toEqual([]);
    expect(zonas.naoMapeadas.unidades).toBe(1);
    expect(zonas.naoMapeadas.rc01Unidades).toBe(1);

    const picking = (await ctx.get(`${PICKING}?operador=Operator_2`)).body;
    expect(picking.ondas).toHaveLength(1);
    expect(picking.ondas[0]).toMatchObject({ onda: 'W10', unidades: 1, unidadesDaOnda: 5, paragens: 1 });
    expectClose(picking.ondas[0].ocupacao, (5 / 24) * 100);
    expectClose(picking.ocupacao.valor, (5 / 24) * 100);
  });

  it('nos indicadores de encomenda o filtro não muda nada e vem na lista de filtros não aplicáveis', async () => {
    const semFiltro = (await ctx.get('/api/visao-geral')).body;
    const comOperador = (await ctx.get('/api/visao-geral?operador=Operator_2')).body;
    const semAviso = (corpo: unknown) =>
      JSON.parse(JSON.stringify(corpo, (chave, valor) => (chave === 'filtrosNaoAplicaveis' ? undefined : valor)));
    expect(semAviso(comOperador)).toEqual(semAviso(semFiltro));
    expectClose(comOperador.tamanhoMedioEncomenda.valor, 3);
    for (const indicador of ['tamanhoMedioEncomenda', 'pedidosPorOnda', 'participacaoPorSetor', 'pedidosMultissetor', 'abc']) {
      expect(semFiltro[indicador].filtrosNaoAplicaveis).toEqual([]);
      expect(comOperador[indicador].filtrosNaoAplicaveis).toEqual(['operador']);
    }

    const divididos = (await ctx.get('/api/ondas-e-pedidos?operador=Operator_2')).body.pedidosDivididos;
    expect(divididos.filtrosNaoAplicaveis).toEqual(['operador']);
    expectClose(divididos.valor, 25);
  });

  it('nos indicadores de picking o operador é aplicável: a lista vem vazia', async () => {
    const picking = (await ctx.get(`${PICKING}?operador=Operator_1`)).body;
    expect(picking.ocupacao.filtrosNaoAplicaveis).toEqual([]);
    expect(picking.paragens.filtrosNaoAplicaveis).toEqual([]);
    const zonas = (await ctx.get('/api/artigos/zonas?operador=Operator_1')).body;
    expect(zonas.participacaoPorZona.filtrosNaoAplicaveis).toEqual([]);
  });

  it('um operador sem linhas no PW dá "sem dados" (nulos, não 0)', async () => {
    const picking = (await ctx.get(`${PICKING}?operador=Operator_12`)).body;
    expect(picking.ocupacao.valor).toBeNull();
    expect(picking.paragens.valor).toBeNull();
    expect(picking.ondas).toEqual([]);
  });
});
