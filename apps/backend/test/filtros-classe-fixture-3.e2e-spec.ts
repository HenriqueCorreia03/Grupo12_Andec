import { fixture3 } from './fixtures/fixture-3';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Filtros, classe ABC global, fixture 3 (D05ZS7 = A, QXS5D1 = B, 05W6TK = C)', () => {
  let ctx: AppWithFixture;
  const tamanho = async (query: string) => (await ctx.get(`/api/visao-geral${query}`)).body.tamanhoMedioEncomenda;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture3);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('classe A = só D05ZS7: 43 un. no pedido 100147 → tamanho médio 43', async () => {
    const t = await tamanho('?classe=A');
    expectClose(t.valor, 43);
    expect(t.pedidosConsiderados).toBe(1);
    expect(t.linhasConsideradas).toBe(4);
  });

  it('classe B = só QXS5D1: 3 un. no pedido 100146 → tamanho médio 3', async () => {
    const t = await tamanho('?classe=B');
    expectClose(t.valor, 3);
    expect(t.pedidosConsiderados).toBe(1);
  });

  it('classe C = só 05W6TK: 1 un. no pedido 100146 → tamanho médio 1', async () => {
    const t = await tamanho('?classe=C');
    expectClose(t.valor, 1);
    expect(t.pedidosConsiderados).toBe(1);
  });

  it('a classe é a global e fixa: com a referência QXS5D1 e a classe A não há linhas ("sem dados"), mesmo sendo a única referência B', async () => {
    const t = await tamanho('?classe=A&referencia=QXS5D1');
    expect(t.valor).toBeNull();
    expect(t.pedidosConsiderados).toBe(0);
  });

  it('a referência e a classe que coincidem dão o mesmo que a referência sozinha', async () => {
    const t = await tamanho('?classe=B&referencia=QXS5D1');
    expectClose(t.valor, 3);
  });
});
