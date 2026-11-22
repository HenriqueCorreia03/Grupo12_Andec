import { fixture4 } from './fixtures/fixture-4';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

/**
 * Comparação com o período anterior (ticket 08; spec, "Comparação no tempo"). Fixture 4:
 * fevereiro de 2023 = P1, P2, P5 (9 un., 1 dia com atividade: 02/02); março = P4 (3 un., 1 dia: 06/03).
 * Regra combinada pela equipa: com um mês selecionado, o mês conta como unidade (fevereiro é o mês da
 * data mínima, logo janeiro fica antes dos dados → "sem período anterior").
 */
describe('Comparação com o período anterior, fixture 4', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture4);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('sem filtro de período: "sem período anterior"', async () => {
    const { comparacao } = (await ctx.get('/api/visao-geral')).body.tamanhoMedioEncomenda;
    expect(comparacao).toEqual({ disponivel: false, texto: 'sem período anterior', motivo: 'sem filtro de período' });
  });

  it('fevereiro: o mês anterior fica antes dos dados → "sem período anterior"', async () => {
    const body = (await ctx.get('/api/visao-geral?mes=2023-02')).body;
    expect(body.tamanhoMedioEncomenda.comparacao).toEqual({
      disponivel: false,
      texto: 'sem período anterior',
      motivo: 'período anterior antes do início dos dados',
    });
    expectClose(body.tamanhoMedioEncomenda.valor, 3);
  });

  it('março: tamanho médio 3,0 vs 3,0 (rácio, comparação direta) → variação 0 %', async () => {
    const { comparacao } = (await ctx.get('/api/visao-geral?mes=2023-03')).body.tamanhoMedioEncomenda;
    expect(comparacao.disponivel).toBe(true);
    expect(comparacao.periodoAnterior).toEqual({ inicio: '2023-02-01', fim: '2023-02-28' });
    expect(comparacao.modo).toBe('direto');
    expectClose(comparacao.valorAtual, 3);
    expectClose(comparacao.valorAnterior, 3);
    expectClose(comparacao.variacao, 0);
  });

  it('março: volumes por dia com atividade — pedidos 1 vs 3 e unidades 3 vs 9 (−66,67 %)', async () => {
    const { volume } = (await ctx.get('/api/visao-geral?mes=2023-03')).body;
    expectClose(volume.pedidos.valor, 1);
    expectClose(volume.unidades.valor, 3);
    expect(volume.pedidos.diasComAtividade).toBe(1);

    for (const [indicador, atual, anterior] of [
      [volume.pedidos, 1, 3],
      [volume.unidades, 3, 9],
    ] as const) {
      expect(indicador.comparacao.modo).toBe('por dia com atividade');
      expect(indicador.comparacao.diasComAtividade).toEqual({ atual: 1, anterior: 1 });
      expectClose(indicador.comparacao.valorAtual, atual);
      expectClose(indicador.comparacao.valorAnterior, anterior);
      expectClose(indicador.comparacao.variacao, ((atual - anterior) / anterior) * 100);
    }
  });

  it('abril: o período anterior é o mês civil de março (31 dias), não 30 dias para trás', async () => {
    const { pedidos } = (await ctx.get('/api/visao-geral?mes=2023-04')).body.volume;
    expect(pedidos.comparacao.periodoAnterior).toEqual({ inicio: '2023-03-01', fim: '2023-03-31' });
    expect(pedidos.valor).toBeNull();
    expectClose(pedidos.comparacao.valorAnterior, 1);
    expect(pedidos.comparacao.variacao).toBeNull();
  });

  it('intervalo de datas: o anterior tem a mesma duração e fica imediatamente antes', async () => {
    const { comparacao } = (await ctx.get('/api/visao-geral?inicio=2023-03-01&fim=2023-03-10')).body.tamanhoMedioEncomenda;
    expect(comparacao.disponivel).toBe(true);
    expect(comparacao.periodoAnterior).toEqual({ inicio: '2023-02-19', fim: '2023-02-28' });
    // Sem pedidos no período anterior: não há valor anterior nem variação ("sem dados").
    expect(comparacao.valorAnterior).toBeNull();
    expect(comparacao.variacao).toBeNull();
  });

  it('intervalo de datas que começa antes dos dados (dia a dia) → "sem período anterior"', async () => {
    const { comparacao } = (await ctx.get('/api/visao-geral?inicio=2023-02-03&fim=2023-02-05')).body.tamanhoMedioEncomenda;
    expect(comparacao).toEqual({
      disponivel: false,
      texto: 'sem período anterior',
      motivo: 'período anterior antes do início dos dados',
    });
  });

  it('picking: as paragens são volume e usam a data da onda (fevereiro 3 paragens; março sem picking)', async () => {
    const { paragens } = (await ctx.get('/api/ondas-e-pedidos/picking?mes=2023-03')).body;
    expect(paragens.comparacao.modo).toBe('por dia com atividade');
    expect(paragens.comparacao.periodoAnterior).toEqual({ inicio: '2023-02-01', fim: '2023-02-28' });
    expect(paragens.comparacao.valorAtual).toBeNull();
    expectClose(paragens.comparacao.valorAnterior, 3);
  });

  it('série mensal por dia com atividade: fevereiro e março, ambos parciais', async () => {
    const serie = (await ctx.get('/api/visao-geral/serie-mensal')).body;
    expect(serie.meses.map((m: { mes: string; parcial: boolean; diasComAtividade: number; domingos: number; pedidos: number; ondasRecolhidas: number }) => [m.mes, m.parcial, m.diasComAtividade, m.domingos, m.pedidos, m.ondasRecolhidas])).toEqual([
      ['2023-02', true, 1, 0, 3, 2],
      ['2023-03', true, 1, 0, 1, 0],
    ]);
    const [fevereiro, marco] = serie.meses;
    expectClose(fevereiro.unidades, 9);
    expectClose(fevereiro.pedidosPorDia, 3);
    expectClose(fevereiro.unidadesPorDia, 9);
    expectClose(fevereiro.ondasRecolhidasPorDia, 2);
    expectClose(fevereiro.tamanhoMedio, 3);
    expectClose(marco.unidades, 3);
    expectClose(marco.unidadesPorDia, 3);
    expectClose(marco.ondasRecolhidasPorDia, 0);
    expectClose(marco.tamanhoMedio, 3);
    expect(serie.fonte).toBe('Customer_Order + Picking_Wave');
    expect(serie.linhasConsideradas).toBe(7);
    expect(serie.exclusoes).toEqual([{ motivo: 'linhas com 0 un.', quantidade: 2 }]);
  });

  it('série mensal com período: só os meses do período (os filtros aplicam-se a todos os gráficos)', async () => {
    const { meses } = (await ctx.get('/api/visao-geral/serie-mensal?mes=2023-03')).body;
    expect(meses.map((m: { mes: string; pedidos: number }) => [m.mes, m.pedidos])).toEqual([['2023-03', 1]]);
  });

  it('série mensal com filtro de referência: só as linhas da referência; os dias com atividade não mudam', async () => {
    const { meses } = (await ctx.get('/api/visao-geral/serie-mensal?referencia=D1')).body;
    expect(meses.map((m: { mes: string; pedidos: number; diasComAtividade: number }) => [m.mes, m.pedidos, m.diasComAtividade])).toEqual([
      ['2023-02', 2, 1],
      ['2023-03', 0, 1],
    ]);
    expectClose(meses[0].unidades, 6);
    expectClose(meses[1].unidades, 0);
  });
});
