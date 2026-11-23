import { fixture4 } from './fixtures/fixture-4';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

const DIVIDIDOS = '/api/ondas-e-pedidos/divididos-por-periodo';

/**
 * Fixture 4: P1, P2 e P5 criados a 02/02/2023 às 10:00 (quinta-feira); P4 a 06/03/2023 às 09:00 (segunda-feira).
 * P5 é o único pedido dividido (ondas W10 e W12). O PW só tem as ondas W10 (5 un.) e W12 (1 un.).
 */
describe('Pedidos divididos por período (fixture 4)', () => {
  let ctx: AppWithFixture;
  let corpo: Record<string, any>;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture4);
    corpo = (await ctx.get(DIVIDIDOS)).body;
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('por mês: fevereiro tem 1 pedido dividido em 3 (P5) e ocupação média 12,5 %; março 0 em 1 e sem ocupação (a W11 não tem picking)', () => {
    expect(corpo.meses.map((m: { mes: string }) => m.mes)).toEqual(['2023-02', '2023-03']);
    const [fevereiro, marco] = corpo.meses;
    expect(fevereiro).toMatchObject({ pedidosDivididos: 1, pedidosValidos: 3, ondas: 2, diasComAtividade: 1 });
    expectClose(fevereiro.percentagem, (1 / 3) * 100);
    expectClose(fevereiro.ocupacaoMedia, 12.5);
    expectClose(fevereiro.divididosPorDia, 1);
    expect(marco).toMatchObject({ pedidosDivididos: 0, pedidosValidos: 1, ondas: 0, diasComAtividade: 1, ocupacaoMedia: null });
    expectClose(marco.percentagem, 0);
  });

  it('por hora: às 10h 1 dividido em 3 (vem primeiro), às 9h 0 em 1', () => {
    expect(corpo.horas.map((h: { hora: number }) => h.hora)).toEqual([10, 9]);
    expect(corpo.horas[0]).toMatchObject({ hora: 10, pedidosDivididos: 1, pedidosValidos: 3, ondas: 2 });
    expectClose(corpo.horas[0].ocupacaoMedia, 12.5);
    expect(corpo.horas[1]).toMatchObject({ hora: 9, pedidosDivididos: 0, pedidosValidos: 1, ondas: 0, ocupacaoMedia: null });
  });

  it('por dia da semana: quinta-feira (02/02) 1 dividido em 3; segunda-feira (06/03) 0 em 1; nenhum é domingo', () => {
    expect(corpo.diasDaSemana).toHaveLength(2);
    expect(corpo.diasDaSemana[0]).toMatchObject({ dia: 4, nome: 'quinta-feira', domingo: false, pedidosDivididos: 1, pedidosValidos: 3 });
    expect(corpo.diasDaSemana[1]).toMatchObject({ dia: 1, nome: 'segunda-feira', domingo: false, pedidosDivididos: 0, pedidosValidos: 1 });
  });

  it('traz o critério de ordenação, a fonte e as linhas excluídas (o P3 só tem linhas a 0 un.)', () => {
    expect(corpo.criterio).toMatch(/ocupação média/);
    expect(corpo.fonte).toBe('Customer_Order + Picking_Wave');
    expect(corpo.exclusoes).toEqual([{ motivo: 'linhas com 0 un.', quantidade: 2 }]);
  });
});
