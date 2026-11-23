import { fixture4 } from './fixtures/fixture-4';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

const INCOMPLETAS = '/api/ondas-e-pedidos/ondas-incompletas';

describe('Ondas incompletas simultâneas (fixture 4)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture4);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('W10 (5 un.) e W12 (1 un.) são incompletas e foram criadas a 02/02 às 10h: 2 simultâneas em 1 grupo, e o P5 (dividido entre as duas) está envolvido', async () => {
    const corpo = (await ctx.get(INCOMPLETAS)).body;
    expect(corpo).toMatchObject({ ondasDoPicking: 2, ondasIncompletas: 2, ondasSimultaneas: 2, gruposDiaHora: 1, pedidosDivididosEnvolvidos: 1 });
    expectClose(corpo.percentagemIncompletas, 100);
  });

  it('o período de março não tem ondas no PW (a W11 não tem picking): "sem dados", sem divisão por zero', async () => {
    const corpo = (await ctx.get(`${INCOMPLETAS}?mes=2023-03`)).body;
    expect(corpo).toMatchObject({ ondasDoPicking: 0, ondasIncompletas: 0, ondasSimultaneas: 0, pedidosDivididosEnvolvidos: 0 });
    expect(corpo.percentagemIncompletas).toBeNull();
  });
});
