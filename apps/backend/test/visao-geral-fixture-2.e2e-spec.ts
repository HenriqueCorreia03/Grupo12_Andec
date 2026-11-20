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
});
