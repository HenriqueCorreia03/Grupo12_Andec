import request from 'supertest';
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

  it('ABC na Visão geral: D1, D2, D4 em A e D3 em B; linhas a zero ficam de fora', async () => {
    const abc = (await ctx.get('/api/visao-geral')).body.abc;
    expect(abc.classes.map((c: { classe: string; referencias: number }) => [c.classe, c.referencias])).toEqual([
      ['A', 3],
      ['B', 1],
      ['C', 0],
    ]);
    expect(abc.linhasConsideradas).toBe(7);
    expect(abc.exclusoes).toEqual(expect.arrayContaining([{ motivo: 'linhas com 0 un.', quantidade: 2 }]));
  });

  it('Artigos: lista as referências por ordem, com unidades (duplicados incluídos), acumulado antes e classe', async () => {
    const { referencias } = (await ctx.get('/api/artigos/abc')).body;
    expect(referencias.map((r: { referencia: string; unidades: number; classe: string }) => [r.referencia, r.unidades, r.classe])).toEqual([
      ['D1', 6, 'A'],
      ['D2', 3, 'A'],
      ['D4', 2, 'A'],
      ['D3', 1, 'B'],
    ]);
    expectClose(referencias[0].acumuladoAntes, 0);
    expectClose(referencias[1].acumuladoAntes, 50);
    expectClose(referencias[2].acumuladoAntes, 75);
    expectClose(referencias[3].acumuladoAntes, (11 / 12) * 100);
  });

  it('Artigos: o drill-down por classe devolve só as referências dessa classe', async () => {
    const body = (await ctx.get('/api/artigos/abc?classe=B')).body;
    expect(body.classeSelecionada).toBe('B');
    expect(body.referencias.map((r: { referencia: string }) => r.referencia)).toEqual(['D3']);
  });

  it('Artigos: tamanho vazio aparece como nulo; 105 → 10,5 com os duplicados; linhas a zero de D2 ficam de fora', async () => {
    expect((await ctx.get('/api/artigos/referencias/D3/tamanhos')).body.tamanhos).toEqual([
      { tamanho: null, unidades: 1, escalaPorConfirmar: false },
    ]);
    expect((await ctx.get('/api/artigos/referencias/D1/tamanhos')).body.tamanhos).toEqual([
      { tamanho: 10.5, unidades: 6, escalaPorConfirmar: false },
    ]);
    expect((await ctx.get('/api/artigos/referencias/D2/tamanhos')).body.tamanhos).toEqual([
      { tamanho: 8, unidades: 3, escalaPorConfirmar: false },
    ]);
  });

  it('Artigos: referência sem procura dá 404', async () => {
    await request(ctx.app.getHttpServer()).get('/api/artigos/referencias/NAOEXISTE/tamanhos').expect(404);
  });
});
