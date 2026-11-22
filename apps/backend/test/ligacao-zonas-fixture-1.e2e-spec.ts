import { fixture1 } from './fixtures/fixture-1';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Ligação CO ↔ PW e filtro de zona (fixture 1, onda 33444)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture1);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('zona K: os 3 pedidos e as 7 un. (AHR20O tam. 12 está em 2 pedidos e o recolhido, 2 un., reparte-se 1 + 1)', async () => {
    const visao = (await ctx.get('/api/visao-geral?zona=K')).body;
    expect(visao.tamanhoMedioEncomenda.pedidosConsiderados).toBe(3);
    expectClose(visao.tamanhoMedioEncomenda.valor, 7 / 3);
    const encomenda = (await ctx.get('/api/artigos/zonas?zona=K')).body.unidadesEncomendadasPorZona;
    expectClose(encomenda.zonas[0].unidades, 7);
    expectClose(encomenda.semZona, 0);
  });

  it('o AHR20O tam. 12 (encomendado 1 + 1, recolhido 2 em K-07-23) dá 1 un. em K ao 90413 e, com o tam. 9, 2 un. ao 90412', async () => {
    const p90413 = (await ctx.get('/api/artigos/zonas?pedido=90413&referencia=AHR20O')).body.unidadesEncomendadasPorZona;
    expectClose(p90413.zonas[0].unidades, 1);
    const p90412 = (await ctx.get('/api/artigos/zonas?pedido=90412&referencia=AHR20O')).body.unidadesEncomendadasPorZona;
    expectClose(p90412.zonas[0].unidades, 2);
  });

  it('zona H (sem unidades): "sem dados" em vez de 0', async () => {
    const visao = (await ctx.get('/api/visao-geral?zona=H')).body;
    expect(visao.tamanhoMedioEncomenda.valor).toBeNull();
    expect(visao.pedidosMultissetor.valor).toBeNull();
    const picking = (await ctx.get('/api/ondas-e-pedidos/picking?zona=H')).body;
    expect(picking.ocupacao.valor).toBeNull();
    expect(picking.paragens.valor).toBeNull();
  });
});
