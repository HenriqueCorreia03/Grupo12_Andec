import { fixture4 } from './fixtures/fixture-4';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Zonas, fixture 4 (RC-01 não mapeada)', () => {
  let ctx: AppWithFixture;
  let zonas: Record<string, any>;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture4);
    zonas = (await ctx.get('/api/artigos/zonas')).body.participacaoPorZona;
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('6 un. recolhidas: K = 5 un. = 100 % das mapeadas (a zona é o prefixo antes do 1.º hífen)', () => {
    expect(zonas.zonas.map((z: { zona: string; unidades: number }) => [z.zona, z.unidades])).toEqual([['K', 5]]);
    expectClose(zonas.zonas[0].percentagem, 100);
  });

  it('o RC-01 (escrito com espaços no PW) é não mapeado: 1 un. = 16,6667 % do total recolhido, em separado', () => {
    expect(zonas.naoMapeadas.unidades).toBe(1);
    expectClose(zonas.naoMapeadas.percentagem, (1 / 6) * 100);
    expect(zonas.naoMapeadas.rc01Unidades).toBe(1);
    expect(zonas.naoMapeadas.localizacoes).toEqual([{ localizacao: 'RC-01', unidades: 1 }]);
    expect(zonas.zonas.map((z: { zona: string }) => z.zona)).not.toContain('RC');
  });
});
