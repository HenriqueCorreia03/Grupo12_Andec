import { fixture4 } from './fixtures/fixture-4';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Visão geral, fixture 4 (casos difíceis, parte do CO)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture4);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('tamanho médio 12 ÷ 4 = 3,0, com 4 pedidos válidos; exclui o P3 (só zeros) e as 2 linhas a zero', async () => {
    const tamanho = (await ctx.get('/api/visao-geral')).body.tamanhoMedioEncomenda;
    expectClose(tamanho.valor, 3);
    expect(tamanho.pedidosConsiderados).toBe(4);
    expect(tamanho.pedidosExcluidos).toBe(1);
    expect(tamanho.linhasConsideradas).toBe(7);
    expect(tamanho.exclusoes).toEqual(
      expect.arrayContaining([
        { motivo: 'pedidos com 0 un.', quantidade: 1 },
        { motivo: 'linhas com 0 un.', quantidade: 2 },
      ]),
    );
  });

  it('pedidos por onda: W10 = 3 (P1, P2, P5), W11 = 1, W12 = 1 → 5 ÷ 3', async () => {
    const porOnda = (await ctx.get('/api/visao-geral')).body.pedidosPorOnda;
    expectClose(porOnda.valor, 5 / 3);
    expectClose(porOnda.mediana, 1);
    expect(porOnda.ondas).toBe(3);
    expect(porOnda.ondasComUmPedido).toBe(2);
    expect(porOnda.exclusoes).toEqual(
      expect.arrayContaining([{ motivo: 'linhas com 0 un.', quantidade: 2 }]),
    );
  });

  it('setor "PF      " fica PF = 100 % depois de remover os espaços; 0 % multissetor (0 de 4)', async () => {
    const body = (await ctx.get('/api/visao-geral')).body;
    expect(body.participacaoPorSetor.setores).toEqual([{ setor: 'PF', unidades: 12, percentagem: 100 }]);
    expect(body.pedidosMultissetor.pedidosMultissetor).toBe(0);
    expect(body.pedidosMultissetor.pedidosValidos).toBe(4);
    expectClose(body.pedidosMultissetor.valor, 0);
  });
});
