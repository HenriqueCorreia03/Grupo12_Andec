import { fixture4 } from './fixtures/fixture-4';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Filtros, período, fixture 4 (fevereiro e março de 2023)', () => {
  let ctx: AppWithFixture;
  const visaoGeral = async (query: string) => (await ctx.get(`/api/visao-geral${query}`)).body;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture4);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('fevereiro de 2023 (mes=2023-02): P1, P2 e P5 = 9 un., tamanho médio 3,0', async () => {
    const { tamanhoMedioEncomenda: t } = await visaoGeral('?mes=2023-02');
    expectClose(t.valor, 3);
    expect(t.pedidosConsiderados).toBe(3);
  });

  it('o mesmo período dado por inicio e fim (01/02 a 28/02) dá o mesmo resultado', async () => {
    const { tamanhoMedioEncomenda: t } = await visaoGeral('?inicio=2023-02-01&fim=2023-02-28');
    expectClose(t.valor, 3);
  });

  it('março de 2023: só o P4 (3 un.) → tamanho médio 3 e 1 pedido na onda W11', async () => {
    const { tamanhoMedioEncomenda: t, pedidosPorOnda } = await visaoGeral('?mes=2023-03');
    expectClose(t.valor, 3);
    expect(t.pedidosConsiderados).toBe(1);
    expect(pedidosPorOnda.ondas).toBe(1);
  });
});
