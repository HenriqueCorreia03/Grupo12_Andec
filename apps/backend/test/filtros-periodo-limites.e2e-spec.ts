import { fixtureFiltrosPeriodo } from './fixtures/fixture-filtros-periodo';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Filtros, período, fronteiras (fixture sintética)', () => {
  let ctx: AppWithFixture;
  const tamanho = async (query: string) => (await ctx.get(`/api/visao-geral${query}`)).body.tamanhoMedioEncomenda;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixtureFiltrosPeriodo);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('o dia 02/02 (inicio = fim) inclui P1 às 00:00 e P2 às 23:59 e deixa de fora P3 (03/02 00:00) e P4 (01/02 23:59): 3 un. ÷ 2 = 1,5', async () => {
    const t = await tamanho('?inicio=2023-02-02&fim=2023-02-02');
    expectClose(t.valor, 1.5);
    expect(t.pedidosConsiderados).toBe(2);
  });

  it('um intervalo de vários dias (01/02 a 02/02) inclui P4, P1 e P2: 11 un. ÷ 3', async () => {
    const t = await tamanho('?inicio=2023-02-01&fim=2023-02-02');
    expectClose(t.valor, 11 / 3);
    expect(t.pedidosConsiderados).toBe(3);
  });

  it('mes=2023-02 equivale a 01/02 a 28/02: os 4 pedidos, 15 un. ÷ 4 = 3,75', async () => {
    const t = await tamanho('?mes=2023-02');
    expectClose(t.valor, 3.75);
    expect(t.pedidosConsiderados).toBe(4);
  });

  it('um período sem pedidos (mes=2023-03) dá "sem dados": valor nulo e 0 pedidos', async () => {
    const t = await tamanho('?mes=2023-03');
    expect(t.valor).toBeNull();
    expect(t.pedidosConsiderados).toBe(0);
  });

  it('o dia anterior a todos os dados (fim = 31/01) dá "sem dados"', async () => {
    const t = await tamanho('?inicio=2023-01-01&fim=2023-01-31');
    expect(t.valor).toBeNull();
  });
});
