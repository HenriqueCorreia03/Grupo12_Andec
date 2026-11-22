import { fixture3 } from './fixtures/fixture-3';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Picking, fixture 3 (ondas 35678 e 35679)', () => {
  let ctx: AppWithFixture;
  let corpo: Record<string, any>;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture3);
    corpo = (await ctx.get('/api/ondas-e-pedidos/picking')).body;
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('ocupação: 35678 = 24 ÷ 24 = 100 %, 35679 = 23 ÷ 24 = 95,8333 %, média 97,9167 %', () => {
    expectClose(corpo.ocupacao.valor, ((24 + 23) / 2 / 24) * 100);
    const porOnda = Object.fromEntries(corpo.ondas.map((o: { onda: string; ocupacao: number }) => [o.onda, o.ocupacao]));
    expectClose(porOnda['35678'], 100);
    expectClose(porOnda['35679'], (23 / 24) * 100);
  });

  it('1 de 2 ondas tem exatamente 24 un. (50 %) e nenhuma tem mais de 24', () => {
    expect(corpo.ocupacao.ondasCom24).toBe(1);
    expect(corpo.ocupacao.ondasMaisDe24).toBe(0);
    expectClose(corpo.ocupacao.percentagemCom24, 50);
    expect(corpo.ocupacao.minimo).toBe(23);
    expect(corpo.ocupacao.maximo).toBe(24);
    expect(corpo.ocupacao.distribuicao).toEqual([
      { unidades: 23, ondas: 1 },
      { unidades: 24, ondas: 1 },
    ]);
  });

  it('6 paragens: K-04-13 aparece nas duas ondas e conta 2 vezes', () => {
    expect(corpo.paragens.valor).toBe(6);
  });

  it('localizações distintas por onda: 4 e 2 (média 3, mediana 3, máximo 4)', () => {
    const porOnda = Object.fromEntries(corpo.ondas.map((o: { onda: string; localizacoes: number }) => [o.onda, o.localizacoes]));
    expect(porOnda).toEqual({ '35678': 4, '35679': 2 });
    expectClose(corpo.localizacoesPorOnda.media, 3);
    expectClose(corpo.localizacoesPorOnda.mediana, 3);
    expect(corpo.localizacoesPorOnda.maximo).toBe(4);
    expect(corpo.localizacoesPorOnda.distribuicao).toEqual([
      { localizacoes: 2, ondas: 1 },
      { localizacoes: 4, ondas: 1 },
    ]);
  });

  it('as duas ondas têm a data (16/03/2023) e a hora (06:34) dos pedidos do CO', () => {
    for (const onda of corpo.ondas) {
      expect(onda.data).toBe('2023-03-16');
      expect(onda.hora).toBe('06:34');
    }
  });
});
