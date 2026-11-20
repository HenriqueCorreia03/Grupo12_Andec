import { fixture2 } from './fixtures/fixture-2';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Visão geral, fixture 2 (sintética, 2.º setor)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture2);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('reparte as unidades por setor: PF 85 % e SX 15 %', async () => {
    const { setores } = (await ctx.get('/api/visao-geral')).body.participacaoPorSetor;
    expect(setores.map((s: { setor: string }) => s.setor)).toEqual(['PF', 'SX']);
    expect(setores.map((s: { unidades: number }) => s.unidades)).toEqual([85, 15]);
    expectClose(setores[0].percentagem, 85);
    expectClose(setores[1].percentagem, 15);
  });

  it('conta 2 de 3 pedidos multissetor (66,6667 %)', async () => {
    const multi = (await ctx.get('/api/visao-geral')).body.pedidosMultissetor;
    expect(multi.pedidosMultissetor).toBe(2);
    expect(multi.pedidosValidos).toBe(3);
    expectClose(multi.valor, 200 / 3);
  });

  it('não mostra a limitação de setor único quando há dois setores', async () => {
    const body = (await ctx.get('/api/visao-geral')).body;
    expect(body.participacaoPorSetor.limitacao).toBeNull();
    expect(body.pedidosMultissetor.limitacao).toBeNull();
  });

  it('dá 1,5 pedidos por onda ((1 + 2) ÷ 2) e tamanho médio 100 ÷ 3', async () => {
    const body = (await ctx.get('/api/visao-geral')).body;
    expectClose(body.pedidosPorOnda.valor, 1.5);
    expect(body.pedidosPorOnda.ondas).toBe(2);
    expect(body.pedidosPorOnda.ondasComUmPedido).toBe(1);
    expectClose(body.tamanhoMedioEncomenda.valor, 100 / 3);
  });

  it('ABC: A = 3 refs / 85 %, B = 1 / 10 %, C = 2 / 5 % (limiar atravessado, empate pelo código, 95 % exato)', async () => {
    const { classes } = (await ctx.get('/api/visao-geral')).body.abc;
    expect(classes.map((c: { classe: string; referencias: number }) => [c.classe, c.referencias])).toEqual([
      ['A', 3],
      ['B', 1],
      ['C', 2],
    ]);
    expectClose(classes[0].percentagemUnidades, 85);
    expectClose(classes[1].percentagemUnidades, 10);
    expectClose(classes[2].percentagemUnidades, 5);
  });

  it('ABC por referência: SYN03 ganha o empate a SYN04 pelo código (A); SYN05 com antes = 95 % exato fica em C', async () => {
    const { referencias } = (await ctx.get('/api/artigos/abc')).body;
    expect(referencias.map((r: { referencia: string; classe: string }) => [r.referencia, r.classe])).toEqual([
      ['SYN01', 'A'],
      ['SYN02', 'A'],
      ['SYN03', 'A'],
      ['SYN04', 'B'],
      ['SYN05', 'C'],
      ['SYN06', 'C'],
    ]);
    expectClose(referencias[2].acumuladoAntes, 75);
    expectClose(referencias[4].acumuladoAntes, 95);
  });
});
