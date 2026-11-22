import { fixture3 } from './fixtures/fixture-3';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

const ZONAS = '/api/artigos/zonas';

describe('Ligação CO ↔ PW: pedidos multizona (fixture 3)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture3);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('multizona 1 de 2 = 50 % (o 100146 tem unidades em O e em J)', async () => {
    const multizona = (await ctx.get(ZONAS)).body.pedidosMultizona;
    expect(multizona.pedidosMultizona).toBe(1);
    expect(multizona.pedidosValidos).toBe(2);
    expectClose(multizona.valor, 50);
  });

  it('filtro de zona O: a participação por zona continua a mostrar K, O e J e indica a zona selecionada (para a destacar)', async () => {
    const corpo = (await ctx.get(`${ZONAS}?zona=O`)).body;
    expect(corpo.zonasSelecionadas).toEqual(['O']);
    expect(corpo.participacaoPorZona.zonas.map((z: { zona: string }) => z.zona)).toEqual(['K', 'O', 'J']);
    expectClose(corpo.participacaoPorZona.zonas[1].percentagem, (3 / 47) * 100);
  });

  it('filtro de zona O no picking: só as 3 un. recolhidas em O (a ocupação das ondas continua a ser a da onda completa)', async () => {
    const picking = (await ctx.get('/api/ondas-e-pedidos/picking?zona=O')).body;
    const unidades = picking.ondas.reduce((total: number, o: { unidades: number }) => total + o.unidades, 0);
    expect(unidades).toBe(3);
    expect(picking.ondas).toHaveLength(1);
    expect(picking.ondas[0]).toMatchObject({ onda: '35678', unidadesDaOnda: 24 });
    expectClose(picking.ondas[0].ocupacao, 100);
  });

  it('filtro de zona O na encomenda: só o pedido 100146 tem unidades em O; passa a ser o único pedido', async () => {
    const visao = (await ctx.get('/api/visao-geral?zona=O')).body;
    expect(visao.tamanhoMedioEncomenda.pedidosConsiderados).toBe(1);
    const multizona = (await ctx.get(`${ZONAS}?zona=O`)).body.pedidosMultizona;
    expect(multizona.pedidosValidos).toBe(1);
    expect(multizona.pedidosMultizona).toBe(1);
  });

  describe('várias zonas (zona=O,J): um pedido conta se tiver mais de 0 un. em qualquer uma delas', () => {
    it('encomenda: só o 100146 (O 3 + J 1 = 4 un.); o 100147 só está em K', async () => {
      const visao = (await ctx.get('/api/visao-geral?zona=O,J')).body;
      expect(visao.tamanhoMedioEncomenda.pedidosConsiderados).toBe(1);
      expectClose(visao.tamanhoMedioEncomenda.valor, 4);
    });

    it('K,J: os 2 pedidos, com 43 + 1 = 44 un. (tamanho médio 22)', async () => {
      const visao = (await ctx.get('/api/visao-geral?zona=K,J')).body;
      expect(visao.tamanhoMedioEncomenda.pedidosConsiderados).toBe(2);
      expectClose(visao.tamanhoMedioEncomenda.valor, 22);
    });

    it('picking: 4 un. recolhidas em O ou J; a resposta indica as zonas selecionadas e mostra todas as zonas', async () => {
      const picking = (await ctx.get('/api/ondas-e-pedidos/picking?zona=O,J')).body;
      const unidades = picking.ondas.reduce((total: number, o: { unidades: number }) => total + o.unidades, 0);
      expect(unidades).toBe(4);
      const corpo = (await ctx.get(`${ZONAS}?zona=O,J`)).body;
      expect(corpo.zonasSelecionadas).toEqual(['O', 'J']);
      expect(corpo.participacaoPorZona.zonas).toHaveLength(3);
    });

    it('a ordem e as repetições não mudam o resultado (J,O,J = O,J)', async () => {
      const a = (await ctx.get('/api/visao-geral?zona=J,O,J')).body;
      const b = (await ctx.get('/api/visao-geral?zona=O,J')).body;
      expect(a).toEqual(b);
    });
  });
});
