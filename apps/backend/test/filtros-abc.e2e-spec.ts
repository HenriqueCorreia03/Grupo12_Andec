import { fixtureFiltrosEntidades } from './fixtures/fixture-filtros-entidades';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

/**
 * ABC com filtros (fixture sintética): R1 = 112 un. (classe global A), R2 = 17 un. (classe global B).
 * R1 só tem pedidos a 10/01/2023; R2 tem pedidos a 10/01 (12 un.) e a 20/01 (5 un.).
 * Classe no período = o ABC recalculado só com as linhas do período; o filtro de classe usa a global.
 */
describe('Filtros, ABC (fixture sintética)', () => {
  let ctx: AppWithFixture;
  const lista = async (query = '') => (await ctx.get(`/api/artigos/abc${query}`)).body;
  const resumo = (corpo: { referencias: { referencia: string; unidades: number; classe: string; classePeriodo: string | null }[] }) =>
    corpo.referencias.map((r) => [r.referencia, r.unidades, r.classe, r.classePeriodo]);

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixtureFiltrosEntidades);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('sem filtros: R1 (112, A) e R2 (17, B); a classe no período é igual à global', async () => {
    const corpo = await lista();
    expect(resumo(corpo)).toEqual([
      ['R1', 112, 'A', 'A'],
      ['R2', 17, 'B', 'B'],
    ]);
    expect(corpo.totalReferencias).toBe(2);
  });

  it('período 20/01 (só o Q3 = 5 un. de R2): R2 sobe para a classe A no período e fica em primeiro; R1 aparece com 0 un. e classe no período nula, no fim', async () => {
    const corpo = await lista('?inicio=2023-01-20&fim=2023-01-20');
    expect(resumo(corpo)).toEqual([
      ['R2', 5, 'B', 'A'],
      ['R1', 0, 'A', null],
    ]);
    expect(corpo.referencias[0].posicao).toBe(1);
    expectClose(corpo.referencias[0].acumuladoAntes, 0);
    expect(corpo.referencias[1].posicao).toBeNull();
    expect(corpo.referencias[1].acumuladoAntes).toBeNull();
  });

  it('período 20/01: os cartões só contam as referências com movimento (R2): classe A = 1 referência, 5 un., 100 %', async () => {
    const corpo = await lista('?inicio=2023-01-20&fim=2023-01-20');
    expect(corpo.totalReferencias).toBe(1);
    expect(corpo.classes).toEqual([
      { classe: 'A', referencias: 1, unidades: 5, percentagemUnidades: 100 },
      { classe: 'B', referencias: 0, unidades: 0, percentagemUnidades: 0 },
      { classe: 'C', referencias: 0, unidades: 0, percentagemUnidades: 0 },
    ]);
    const visaoGeral = (await ctx.get('/api/visao-geral?inicio=2023-01-20&fim=2023-01-20')).body;
    expect(visaoGeral.abc.totalReferencias).toBe(1);
  });

  it('o filtro de classe usa a classe global: classe=B no período completo lista só R2 (global B)', async () => {
    const corpo = await lista('?classe=B');
    expect(resumo(corpo)).toEqual([['R2', 17, 'B', 'B']]);
    expect(corpo.classeSelecionada).toBe('B');
  });

  it('classe=B no período 20/01: R2 continua a ser da classe global B, mas é A no período', async () => {
    const corpo = await lista('?classe=B&inicio=2023-01-20&fim=2023-01-20');
    expect(resumo(corpo)).toEqual([['R2', 5, 'B', 'A']]);
  });

  it('referencia=R2 lista só R2', async () => {
    expect(resumo(await lista('?referencia=R2'))).toEqual([['R2', 17, 'B', 'B']]);
  });

  describe('"sem dados": a seleção não tem nenhuma linha', () => {
    const esperarSemDados = (corpo: Record<string, any>) => {
      expect(corpo.referencias).toEqual([]);
      expect(corpo.totalReferencias).toBe(0);
      for (const classe of corpo.classes) expect(classe.percentagemUnidades).toBeNull();
    };

    it('1. período sem linhas (março)', async () => {
      esperarSemDados(await lista('?mes=2023-03'));
    });

    it('2. referencia=R1, sem movimento de R1 no período 20/01', async () => {
      esperarSemDados(await lista('?referencia=R1&inicio=2023-01-20&fim=2023-01-20'));
    });

    it('3. classe=A, mas a única referência A (R1) não tem movimento no período 20/01 (só há B)', async () => {
      esperarSemDados(await lista('?classe=A&inicio=2023-01-20&fim=2023-01-20'));
    });

    it('4. referência desconhecida', async () => {
      esperarSemDados(await lista('?referencia=NAOEXISTE'));
    });
  });

  describe('unidades por tamanho de uma referência, no período', () => {
    it('R2 no período 20/01: só as 5 un. do Q3; R2 sem filtro: 17', async () => {
      const periodo = (await ctx.get('/api/artigos/referencias/R2/tamanhos?inicio=2023-01-20&fim=2023-01-20')).body;
      expect(periodo.unidades).toBe(5);
      expect(periodo.classe).toBe('B');
      const completo = (await ctx.get('/api/artigos/referencias/R2/tamanhos')).body;
      expect(completo.unidades).toBe(17);
    });

    it('R1 no período 20/01: 200 com "sem dados" (0 un., sem tamanhos); a referência existe, por isso não é 404', async () => {
      const corpo = (await ctx.get('/api/artigos/referencias/R1/tamanhos?inicio=2023-01-20&fim=2023-01-20')).body;
      expect(corpo.unidades).toBe(0);
      expect(corpo.tamanhos).toEqual([]);
    });
  });
});
