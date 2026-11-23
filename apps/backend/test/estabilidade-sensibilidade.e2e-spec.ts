import { fixtureEstabilidade } from './fixtures/fixture-estabilidade';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

interface LinhaSensibilidade {
  limiarUnidades: number;
  valor: number | null;
  comparadas: number;
  mudaram: number;
  combinacoes: { comUnidades: number; excluidas: number; percentagemExcluidas: number | null };
}

/**
 * Sensibilidade da estabilidade do ABC ao limiar mínimo de unidades (ticket 14; spec, "Estabilidade do ABC").
 * Valores calculados à mão no comentário de `fixture-estabilidade.ts`.
 */
describe('Sensibilidade da estabilidade do ABC a 5/10/20 un., fixture sintética de 3 meses', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixtureEstabilidade);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  async function sensibilidade(caminho = '/api/artigos/estabilidade'): Promise<LinhaSensibilidade[]> {
    return (await ctx.get(caminho)).body.sensibilidade;
  }

  it('calcula a estabilidade para os limiares 5, 10 e 20 un., por esta ordem', async () => {
    const linhas = await sensibilidade();
    expect(linhas.map((l) => [l.limiarUnidades, l.comparadas, l.mudaram])).toEqual([
      [5, 6, 2],
      [10, 5, 1],
      [20, 3, 0],
    ]);
    expectClose(linhas[0].valor, (2 / 6) * 100);
    expectClose(linhas[1].valor, 20);
    expectClose(linhas[2].valor, 0);
  });

  it('mostra o nº e a % de combinações referência-mês excluídas em cada limiar (0, 1 e 4 de 9)', async () => {
    const linhas = await sensibilidade();
    expect(linhas.map((l) => [l.combinacoes.comUnidades, l.combinacoes.excluidas])).toEqual([
      [9, 0],
      [9, 1],
      [9, 4],
    ]);
    expectClose(linhas[0].combinacoes.percentagemExcluidas, 0);
    expectClose(linhas[1].combinacoes.percentagemExcluidas, (1 / 9) * 100);
    expectClose(linhas[2].combinacoes.percentagemExcluidas, (4 / 9) * 100);
  });

  it('a linha de 10 un. coincide com o valor principal, que continua a usar 10 un.', async () => {
    const body = (await ctx.get('/api/artigos/estabilidade')).body;
    expect(body.limiarUnidades).toBe(10);
    const dez = body.sensibilidade.find((l: LinhaSensibilidade) => l.limiarUnidades === 10);
    expect(dez.valor).toBe(body.valor);
    expect(dez.combinacoes).toEqual(body.combinacoes);
  });

  it('respeita o período: de fevereiro a março, com 20 un. comparam-se R1 e R2 e ninguém muda', async () => {
    const linhas = await sensibilidade('/api/artigos/estabilidade?inicio=2023-02-01&fim=2023-03-31');
    const vinte = linhas.find((l) => l.limiarUnidades === 20)!;
    expect([vinte.comparadas, vinte.mudaram]).toEqual([2, 0]);
    expect([vinte.combinacoes.comUnidades, vinte.combinacoes.excluidas]).toEqual([6, 2]);
    expectClose(vinte.valor, 0);
  });
});
