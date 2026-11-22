import { fixture4 } from './fixtures/fixture-4';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Qualidade dos dados, fixture 4 (casos difíceis)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture4);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('contagens: 1 linha duplicada (2 un.), 2 linhas a zero, 1 pedido com 0 un. (P3), 1 linha com tamanho vazio (L4), 1 onda sem picking (W11, 3 un.)', async () => {
    const { contagens } = (await ctx.get('/api/qualidade')).body;
    expect(contagens.linhasCO).toBe(9);
    expect(contagens.linhasDuplicadas).toBe(1);
    expect(contagens.unidadesDuplicadas).toBe(2);
    expect(contagens.linhasZero).toBe(2);
    expect(contagens.pedidosZero).toBe(1);
    expect(contagens.linhasTamanhoVazio).toBe(1);
    expect(contagens.ondasSemPicking).toBe(1);
    expect(contagens.unidadesOndasSemPicking).toBe(3);
    expect(contagens.linhasForaDasEscalas).toBe(0);
  });

  it('linhas do CO sem correspondência no PW: 4 de 9 (L3 e L6 a zero, L4 tamanho vazio, L7 onda sem picking)', async () => {
    const { contagens } = (await ctx.get('/api/qualidade')).body;
    expect(contagens.linhasSemCorrespondencia).toBe(4);
    expectClose(contagens.percentagemSemCorrespondencia, (4 / 9) * 100);
  });

  it('recolhido vs encomendado: 12 − 6 = 6 = 3 (ondas sem picking) + 1 (D3, nunca recolhida) + 2 (sem causa conhecida)', async () => {
    const { recolhidoVsEncomendado: r } = (await ctx.get('/api/qualidade')).body;
    expect(r.encomendado).toBe(12);
    expect(r.recolhido).toBe(6);
    expect(r.diferenca).toBe(6);
    expect(r.ondasSemPicking).toBe(3);
    expect(r.referenciasNuncaRecolhidas).toBe(1);
    expect(r.nReferenciasNuncaRecolhidas).toBe(1);
    expect(r.semCausaConhecida).toBe(2);
  });

  it('localizações não mapeadas: só o RC-01 ("RC-01     " sem espaços), 1 un. de 1 referência = 16,67 % do recolhido', async () => {
    const { naoMapeadas } = (await ctx.get('/api/qualidade')).body;
    expect(naoMapeadas.localizacoes).toEqual([{ localizacao: 'RC-01', unidades: 1, referencias: 1 }]);
    expect(naoMapeadas.unidades).toBe(1);
    expectClose(naoMapeadas.percentagemRecolhido, (1 / 6) * 100);
  });

  it('ligações repartidas: 5 linhas com unidades recolhidas (L1, L2, L5, L8, L9), nenhuma em 2 zonas mapeadas → 0 %', async () => {
    const { ligacoesRepartidas } = (await ctx.get('/api/qualidade')).body;
    expect(ligacoesRepartidas.linhasLigadas).toBe(5);
    expect(ligacoesRepartidas.linhasRepartidas).toBe(0);
    expectClose(ligacoesRepartidas.valor, 0);
  });
});
