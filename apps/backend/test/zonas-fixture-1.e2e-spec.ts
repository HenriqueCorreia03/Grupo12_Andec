import { fixture1 } from './fixtures/fixture-1';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Zonas, fixture 1 (onda 33444)', () => {
  let ctx: AppWithFixture;
  let zonas: Record<string, any>;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture1);
    zonas = (await ctx.get('/api/artigos/zonas')).body.participacaoPorZona;
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('K = 7 un. = 100 % das mapeadas; não mapeadas = 0', () => {
    expect(zonas.zonas.map((z: { zona: string; unidades: number }) => [z.zona, z.unidades])).toEqual([['K', 7]]);
    expectClose(zonas.zonas[0].percentagem, 100);
    expect(zonas.naoMapeadas.unidades).toBe(0);
    expectClose(zonas.naoMapeadas.percentagem, 0);
    expect(zonas.naoMapeadas.localizacoes).toEqual([]);
    expect(zonas.fonte).toBe('Picking_Wave + Storage_Location');
  });
});
