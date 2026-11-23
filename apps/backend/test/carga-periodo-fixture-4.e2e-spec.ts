import { fixture4 } from './fixtures/fixture-4';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

const CARGA = '/api/ondas-e-pedidos/carga';

/**
 * Fixture 4: P1, P2 e P5 (3 pedidos, 9 un.) a 02/02/2023 às 10:00 (quinta-feira), nas ondas W10 e W12 (as duas com picking);
 * P4 (1 pedido, 3 un.) a 06/03/2023 às 09:00 (segunda-feira), na W11, que não tem picking. P3 só tem linhas a 0 un.
 * O PW: Operator_1 recolheu 5 un. (W10 e W12) e o Operator_2 1 un. (W10).
 */
describe('Carga por período e por operador (fixture 4)', () => {
  let ctx: AppWithFixture;
  let corpo: Record<string, any>;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture4);
    corpo = (await ctx.get(CARGA)).body;
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('por dia da semana: os 7 dias; quinta = 3 pedidos, 9 un., 2 ondas num dia; segunda = 1 pedido, 3 un., 0 ondas', () => {
    expect(corpo.porDiaDaSemana.map((d: { dia: number }) => d.dia)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    const quinta = corpo.porDiaDaSemana[3];
    expect(quinta).toMatchObject({ nome: 'quinta-feira', domingo: false, diasComAtividade: 1, pedidos: 3, unidades: 9, ondas: 2 });
    expectClose(quinta.pedidosPorDia, 3);
    expectClose(quinta.unidadesPorDia, 9);
    expectClose(quinta.ondasPorDia, 2);
    const segunda = corpo.porDiaDaSemana[0];
    expect(segunda).toMatchObject({ nome: 'segunda-feira', diasComAtividade: 1, pedidos: 1, unidades: 3, ondas: 0 });
    expectClose(segunda.ondasPorDia, 0);
  });

  it('o domingo vem assinalado e, sem atividade, mostra 0 e "por dia" nulo (não 0)', () => {
    const domingo = corpo.porDiaDaSemana[6];
    expect(domingo).toMatchObject({ dia: 7, nome: 'domingo', domingo: true, diasComAtividade: 0, pedidos: 0, unidades: 0, ondas: 0 });
    expect(domingo.pedidosPorDia).toBeNull();
    expect(corpo.porDiaDaSemana.filter((d: { domingo: boolean }) => d.domingo)).toHaveLength(1);
  });

  it('por hora: as 24 horas; às 10h 3 pedidos, 9 un., 2 ondas; às 9h 1 pedido, 3 un.; às 0h nada', () => {
    expect(corpo.porHora).toHaveLength(24);
    expect(corpo.porHora[10]).toMatchObject({ hora: 10, diasComAtividade: 1, pedidos: 3, unidades: 9, ondas: 2 });
    expect(corpo.porHora[9]).toMatchObject({ hora: 9, pedidos: 1, unidades: 3, ondas: 0 });
    expect(corpo.porHora[0]).toMatchObject({ hora: 0, pedidos: 0, unidades: 0, ondas: 0, diasComAtividade: 0, pedidosPorDia: null });
  });

  it('por mês (a série do ticket 08): fevereiro 3 pedidos e 9 un.; março 1 pedido e 3 un.', () => {
    expect(corpo.porMes.map((m: { mes: string }) => m.mes)).toEqual(['2023-02', '2023-03']);
    expect(corpo.porMes[0]).toMatchObject({ pedidos: 3, unidades: 9, diasComAtividade: 1 });
    expect(corpo.porMes[1]).toMatchObject({ pedidos: 1, unidades: 3, diasComAtividade: 1 });
  });

  it('por operador recolhedor: Operator_1 = 5 un. em 2 ondas; Operator_2 = 1 un. em 1 onda; "carga, não desempenho"', () => {
    expect(corpo.porOperador.rotulo).toBe('carga, não desempenho');
    expect(corpo.porOperador.operadores).toEqual([
      { operador: 'Operator_1', unidades: 5, ondas: 2 },
      { operador: 'Operator_2', unidades: 1, ondas: 1 },
    ]);
  });
});
