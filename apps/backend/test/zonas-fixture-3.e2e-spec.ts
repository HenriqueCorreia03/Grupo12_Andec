import { fixture3 } from './fixtures/fixture-3';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Zonas, fixture 3 (ondas 35678 e 35679)', () => {
  let ctx: AppWithFixture;
  let zonas: Record<string, any>;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture3);
    zonas = (await ctx.get('/api/artigos/zonas')).body.participacaoPorZona;
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('47 un. recolhidas: K = 43 (91,4894 %), O = 3 (6,3830 %), J = 1 (2,1277 %), por ordem decrescente de unidades', () => {
    expect(zonas.zonas.map((z: { zona: string; unidades: number }) => [z.zona, z.unidades])).toEqual([
      ['K', 43],
      ['O', 3],
      ['J', 1],
    ]);
    expectClose(zonas.zonas[0].percentagem, (43 / 47) * 100);
    expectClose(zonas.zonas[1].percentagem, (3 / 47) * 100);
    expectClose(zonas.zonas[2].percentagem, (1 / 47) * 100);
    expect(zonas.naoMapeadas.unidades).toBe(0);
  });
});
