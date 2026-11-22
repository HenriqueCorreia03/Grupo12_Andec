import { fixture1 } from './fixtures/fixture-1';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Filtros, referência, fixture 1 (onda 33444)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture1);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('Visão geral com referência Q50W5L: 2 un. em 1 pedido (90413) → tamanho médio 2, só 1 linha considerada', async () => {
    const { tamanhoMedioEncomenda: tamanho } = (await ctx.get('/api/visao-geral?referencia=Q50W5L')).body;
    expectClose(tamanho.valor, 2);
    expectClose(tamanho.mediana, 2);
    expect(tamanho.pedidosConsiderados).toBe(1);
    expect(tamanho.linhasConsideradas).toBe(1);
  });

  it('Visão geral com referência Q50W5L: 1 pedido na onda 33444 e setor PF = 100 % (2 un.)', async () => {
    const body = (await ctx.get('/api/visao-geral?referencia=Q50W5L')).body;
    expectClose(body.pedidosPorOnda.valor, 1);
    expect(body.pedidosPorOnda.ondas).toBe(1);
    expect(body.participacaoPorSetor.setores).toEqual([{ setor: 'PF', unidades: 2, percentagem: 100 }]);
    expect(body.pedidosMultissetor.pedidosValidos).toBe(1);
  });

  it('sem filtro continua tudo igual: 7 ÷ 3', async () => {
    const { tamanhoMedioEncomenda: tamanho } = (await ctx.get('/api/visao-geral')).body;
    expectClose(tamanho.valor, 7 / 3);
  });
});
