import { fixturePickingLimites } from './fixtures/fixture-picking-limites';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Picking, casos-limite (fixture sintética)', () => {
  let ctx: AppWithFixture;
  let picking: Record<string, any>;
  let zonas: Record<string, any>;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixturePickingLimites);
    picking = (await ctx.get('/api/ondas-e-pedidos/picking')).body;
    zonas = (await ctx.get('/api/artigos/zonas')).body.participacaoPorZona;
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('24 un. é a capacidade (conta como "com 24"); 25 e 30 un. são "mais de 24"', () => {
    expect(picking.ocupacao.ondasCom24).toBe(1);
    expect(picking.ocupacao.ondasMaisDe24).toBe(2);
    expectClose(picking.ocupacao.percentagemCom24, 25);
    expect(picking.ocupacao.minimo).toBe(1);
    expect(picking.ocupacao.maximo).toBe(30);
  });

  it('ocupação média = (24 + 25 + 30 + 1) ÷ 4 ÷ 24 = 83,3333 %, e uma onda pode passar dos 100 %', () => {
    expectClose(picking.ocupacao.valor, (80 / 4 / 24) * 100);
    const porOnda = Object.fromEntries(picking.ondas.map((o: { onda: string; ocupacao: number }) => [o.onda, o.ocupacao]));
    expectClose(porOnda.WB, (25 / 24) * 100);
    expectClose(porOnda.WC, (30 / 24) * 100);
  });

  it('"L-01-01   " com espaços é a mesma localização que "L-01-01": paragens 2 + 1 + 1 + 1 = 5; localizações 2, 1, 1, 1', () => {
    expect(picking.paragens.valor).toBe(5);
    expectClose(picking.localizacoesPorOnda.media, 1.25);
    expectClose(picking.localizacoesPorOnda.mediana, 1);
    expect(picking.localizacoesPorOnda.maximo).toBe(2);
    expect(picking.localizacoesPorOnda.distribuicao).toEqual([
      { localizacoes: 1, ondas: 3 },
      { localizacoes: 2, ondas: 1 },
    ]);
  });

  it('a hora da onda é a do pedido mais antigo (WA: 08:00); uma onda sem pedidos no CO tem data e hora nulas', () => {
    const porOnda = Object.fromEntries(picking.ondas.map((o: { onda: string }) => [o.onda, o]));
    expect(porOnda.WA).toMatchObject({ data: '2023-01-10', hora: '08:00' });
    expect(porOnda.WB).toMatchObject({ data: '2023-01-10', hora: '09:00' });
    expect(porOnda.WD).toMatchObject({ data: null, hora: null });
  });

  it('zona L = 50 un. (100 % das mapeadas, o espaço não cria outra localização); X-99-99 não mapeada = 30 ÷ 80 = 37,5 %', () => {
    expect(zonas.zonas.map((z: { zona: string; unidades: number }) => [z.zona, z.unidades])).toEqual([['L', 50]]);
    expectClose(zonas.zonas[0].percentagem, 100);
    expect(zonas.naoMapeadas.unidades).toBe(30);
    expectClose(zonas.naoMapeadas.percentagem, 37.5);
    expect(zonas.naoMapeadas.rc01Unidades).toBe(0);
    expect(zonas.naoMapeadas.localizacoes).toEqual([{ localizacao: 'X-99-99', unidades: 30 }]);
  });
});
