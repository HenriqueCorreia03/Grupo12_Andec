import { fixture3 } from './fixtures/fixture-3';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Ondas incompletas simultâneas (fixture 3)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture3);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('35678 tem 24 un. (completa) e 35679 tem 23 un. (incompleta): 1 incompleta, mas sem par incompleto não há simultâneas nem pedidos envolvidos', async () => {
    const corpo = (await ctx.get('/api/ondas-e-pedidos/ondas-incompletas')).body;
    expect(corpo).toMatchObject({ ondasDoPicking: 2, ondasIncompletas: 1, ondasSimultaneas: 0, gruposDiaHora: 0, pedidosDivididosEnvolvidos: 0 });
    expectClose(corpo.percentagemIncompletas, 50);
  });
});
