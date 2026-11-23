import { fixtureOndasIncompletas } from './fixtures/fixture-ondas-incompletas';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

const INCOMPLETAS = '/api/ondas-e-pedidos/ondas-incompletas';

describe('Ondas incompletas simultâneas: limites de dia e de hora (fixture inventada)', () => {
  let ctx: AppWithFixture;
  let corpo: Record<string, any>;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixtureOndasIncompletas);
    corpo = (await ctx.get(INCOMPLETAS)).body;
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('4 ondas incompletas em 4; só A e B (mesmo dia e mesma hora) são simultâneas: 2 ondas em 1 grupo', () => {
    expect(corpo).toMatchObject({ ondasDoPicking: 4, ondasIncompletas: 4, ondasSimultaneas: 2, gruposDiaHora: 1 });
    expectClose(corpo.percentagemIncompletas, 100);
  });

  it('o pedido P1, dividido entre as ondas A e C, envolve uma onda simultânea (a A): 1 pedido dividido; P2 e P3 não estão divididos', () => {
    expect(corpo.pedidosDivididosEnvolvidos).toBe(1);
  });

  it('é uma observação medida, não um ganho esperado', () => {
    expect(corpo.rotulo).toBe('observação, não ganho esperado');
    expect(corpo.definicao).toMatch(/mesmo dia e na mesma hora/);
  });
});
