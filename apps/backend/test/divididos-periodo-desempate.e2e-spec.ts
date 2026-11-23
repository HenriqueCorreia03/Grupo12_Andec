import { fixtureDivididosDesempate } from './fixtures/fixture-divididos-desempate';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

const DIVIDIDOS = '/api/ondas-e-pedidos/divididos-por-periodo';

describe('Pedidos divididos por período: desempate pela ocupação média (alavanca b)', () => {
  let ctx: AppWithFixture;
  let corpo: Record<string, any>;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixtureDivididosDesempate);
    corpo = (await ctx.get(DIVIDIDOS)).body;
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('meses com o mesmo nº de divididos: fevereiro (ocupação 4,17 %) vem antes de janeiro (12,5 %)', () => {
    expect(corpo.meses.map((m: { mes: string }) => m.mes)).toEqual(['2023-02', '2023-01']);
    expect(corpo.meses.map((m: { pedidosDivididos: number }) => m.pedidosDivididos)).toEqual([1, 1]);
    expectClose(corpo.meses[0].ocupacaoMedia, (1 / 24) * 100);
    expectClose(corpo.meses[1].ocupacaoMedia, (3 / 24) * 100);
  });

  it('dias da semana empatados: a sexta-feira (menor ocupação) vem antes da terça-feira', () => {
    expect(corpo.diasDaSemana.map((d: { nome: string }) => d.nome)).toEqual(['sexta-feira', 'terça-feira']);
  });

  it('a hora é a mesma para os dois (10h): 2 pedidos divididos em 2 válidos, ocupação média 8,33 %', () => {
    expect(corpo.horas).toHaveLength(1);
    expect(corpo.horas[0]).toMatchObject({ hora: 10, pedidosDivididos: 2, pedidosValidos: 2, ondas: 4 });
    expectClose(corpo.horas[0].ocupacaoMedia, ((3 + 3 + 1 + 1) / 4 / 24) * 100);
  });
});
