import { fixture4 } from './fixtures/fixture-4';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

const ZONAS = '/api/artigos/zonas';

describe('Ligação CO ↔ PW: zona das unidades encomendadas (fixture 4)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture4);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('12 un. encomendadas: K 5, não mapeada 1, sem zona 6 (falta de picking 2 + D3 sem tamanho 1 + W11 sem picking 3)', async () => {
    const encomenda = (await ctx.get(ZONAS)).body.unidadesEncomendadasPorZona;
    expect(encomenda.zonas).toHaveLength(1);
    expect(encomenda.zonas[0].zona).toBe('K');
    expectClose(encomenda.zonas[0].unidades, 5);
    expectClose(encomenda.naoMapeada, 1);
    expectClose(encomenda.semZona, 6);
    expectClose(encomenda.total, 12);
  });

  it('repartição do D1 10,5 (encomendado 6, recolhido 4: K 3 e RC-01 1): P1 = K 2, não mapeada 0,6667, sem zona 1,3333', async () => {
    const p1 = (await ctx.get(`${ZONAS}?pedido=P1`)).body.unidadesEncomendadasPorZona;
    expectClose(p1.zonas[0].unidades, 2);
    expectClose(p1.naoMapeada, 2 / 3);
    expectClose(p1.semZona, 4 / 3);
    expectClose(p1.total, 4);
  });

  it('P2: K 1, não mapeada 0,3333, sem zona 1,6667 (0,6667 de falta do D1 + 1 do D3, que não tem tamanho)', async () => {
    const p2 = (await ctx.get(`${ZONAS}?pedido=P2`)).body.unidadesEncomendadasPorZona;
    expectClose(p2.zonas[0].unidades, 1);
    expectClose(p2.naoMapeada, 1 / 3);
    expectClose(p2.semZona, 5 / 3);
    expectClose(p2.total, 3);
  });

  it('multizona 0 % (0 de 4): nenhum pedido tem ≥ 2 zonas mapeadas; a "não mapeada" não conta como zona', async () => {
    const multizona = (await ctx.get(ZONAS)).body.pedidosMultizona;
    expect(multizona.pedidosMultizona).toBe(0);
    expect(multizona.pedidosValidos).toBe(4);
    expectClose(multizona.valor, 0);
  });

  it('filtro de zona K na encomenda: 3 pedidos (P1, P2, P5), 5 un., tamanho médio 1,6667', async () => {
    const visao = (await ctx.get('/api/visao-geral?zona=K')).body;
    expect(visao.tamanhoMedioEncomenda.pedidosConsiderados).toBe(3);
    expectClose(visao.tamanhoMedioEncomenda.valor, 5 / 3);
  });

  it('um pedido conta na zona se tiver mais de 0 un. atribuídas a ela; uma zona sem unidades dá "sem dados"', async () => {
    const visao = (await ctx.get('/api/visao-geral?zona=H')).body;
    expect(visao.tamanhoMedioEncomenda.valor).toBeNull();
    expect(visao.tamanhoMedioEncomenda.pedidosConsiderados).toBe(0);
  });
});
