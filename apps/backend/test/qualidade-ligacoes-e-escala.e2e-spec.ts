import { fixtureQualidade } from './fixtures/fixture-qualidade';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Qualidade dos dados, fixture da qualidade (ligações repartidas, não mapeadas, escala 215–305)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixtureQualidade);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('ligações repartidas: a linha do P1 tem unidades em K e em L; a do P2 só em não mapeadas → 1 de 2 = 50 %', async () => {
    const { ligacoesRepartidas } = (await ctx.get('/api/qualidade')).body;
    expect(ligacoesRepartidas.linhasLigadas).toBe(2);
    expect(ligacoesRepartidas.linhasRepartidas).toBe(1);
    expectClose(ligacoesRepartidas.valor, 50);
  });

  it('não mapeadas: RC-01 primeiro (1 un.), mesmo com o ZN-COR a ter mais (2 un.); 3 de 5 un. recolhidas = 60 %', async () => {
    const { naoMapeadas } = (await ctx.get('/api/qualidade')).body;
    expect(naoMapeadas.localizacoes).toEqual([
      { localizacao: 'RC-01', unidades: 1, referencias: 1 },
      { localizacao: 'ZN-COR', unidades: 2, referencias: 1 },
    ]);
    expect(naoMapeadas.unidades).toBe(3);
    expectClose(naoMapeadas.percentagemRecolhido, 60);
  });

  it('escala de tamanhos 215–305: 1 linha no CO e 3 no PW, marcadas "por confirmar"', async () => {
    const { escalaPorConfirmar } = (await ctx.get('/api/qualidade')).body;
    expect(escalaPorConfirmar).toEqual({ linhasCO: 1, linhasPW: 3, estado: 'por confirmar' });
  });

  it('recolhido vs encomendado: 6 − 5 = 1 = 0 + 1 (E3, nunca recolhida) + 0; 1 de 3 linhas sem correspondência', async () => {
    const { recolhidoVsEncomendado: r, contagens } = (await ctx.get('/api/qualidade')).body;
    expect([r.encomendado, r.recolhido, r.diferenca]).toEqual([6, 5, 1]);
    expect([r.ondasSemPicking, r.referenciasNuncaRecolhidas, r.semCausaConhecida]).toEqual([0, 1, 0]);
    expect(contagens.linhasSemCorrespondencia).toBe(1);
  });
});
