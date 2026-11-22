import { fixtureFiltrosEntidades } from './fixtures/fixture-filtros-entidades';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

/**
 * Regra única (spec, "Propriedades das entidades e filtros"): as medidas aditivas usam só as linhas que passam
 * os filtros; as propriedades de uma entidade (pedido dividido, multissetor, ocupação da onda) calculam-se com a
 * entidade completa. O filtro só decide que entidades entram (≥ 1 linha que passa).
 */
describe('Filtros, propriedades da entidade completa (fixture sintética)', () => {
  let ctx: AppWithFixture;
  const obter = async (caminho: string) => (await ctx.get(caminho)).body;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixtureFiltrosEntidades);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  describe('pedidos divididos', () => {
    const divididos = async (query = '') => (await obter(`/api/ondas-e-pedidos${query}`)).pedidosDivididos;

    it('sem filtro: 1 de 3 (Q1, 24 un.) = 33,33 %, evitável', async () => {
      const d = await divididos();
      expectClose(d.valor, 100 / 3);
      expect(d.pedidosValidos).toBe(3);
      expect(d.pedidosDivididos).toBe(1);
      expect(d.divididosAte24).toBe(1);
      expect(d.divididosMaisDe24).toBe(0);
    });

    it('referência R1: Q1 entra com uma só linha e continua dividido, com as 24 un. do pedido completo (não 12): 1 de 2 = 50 %', async () => {
      const d = await divididos('?referencia=R1');
      expectClose(d.valor, 50);
      expect(d.pedidosValidos).toBe(2);
      expect(d.pedidosDivididos).toBe(1);
      expect(d.divididosAte24).toBe(1);
    });

    it('referência R2 e classe B (a classe global de R2) dão o mesmo: Q1 e Q3 entram, 1 de 2 = 50 %', async () => {
      for (const query of ['?referencia=R2', '?classe=B']) {
        const d = await divididos(query);
        expectClose(d.valor, 50);
        expect(d.pedidosValidos).toBe(2);
        expect(d.pedidosDivididos).toBe(1);
      }
    });

    it('classe A (R1): Q1 e Q2 entram, 1 de 2', async () => {
      const d = await divididos('?classe=A');
      expect(d.pedidosValidos).toBe(2);
      expect(d.pedidosDivididos).toBe(1);
    });

    it('período 20/01: só o Q3 entra, e há dados mas 0 divididos → valor 0 (não nulo)', async () => {
      const d = await divididos('?inicio=2023-01-20&fim=2023-01-20');
      expect(d.valor).toBe(0);
      expect(d.pedidosValidos).toBe(1);
      expect(d.pedidosDivididos).toBe(0);
    });
  });

  describe('pedidos multissetor e volume na Visão geral', () => {
    it('sem filtro: 1 de 3 pedidos é multissetor (Q1: PF + SX)', async () => {
      const { pedidosMultissetor: m } = await obter('/api/visao-geral');
      expect(m.pedidosValidos).toBe(3);
      expect(m.pedidosMultissetor).toBe(1);
    });

    it('referência R1: o Q1 continua multissetor (setores do pedido completo): 1 de 2; o volume só conta as linhas de R1 (112 ÷ 2 = 56)', async () => {
      const corpo = await obter('/api/visao-geral?referencia=R1');
      expect(corpo.pedidosMultissetor.pedidosValidos).toBe(2);
      expect(corpo.pedidosMultissetor.pedidosMultissetor).toBe(1);
      expectClose(corpo.tamanhoMedioEncomenda.valor, 56);
    });
  });

  describe('picking: ocupação da onda é do pedido completo; paragens e unidades são das linhas filtradas', () => {
    const picking = async (query = '') => obter(`/api/ondas-e-pedidos/picking${query}`);

    it('sem filtro: 3 ondas (24, 6 e 5 un.), ocupação média 48,6111 %, 4 paragens', async () => {
      const p = await picking();
      expect(p.ocupacao.ondas).toBe(3);
      expectClose(p.ocupacao.valor, ((24 + 6 + 5) / 3 / 24) * 100);
      expect(p.paragens.valor).toBe(4);
    });

    it('referência R1: só a W1 entra; 12 un. e 1 paragem (L-01-01), mas a ocupação continua 100 % (24 un. da onda)', async () => {
      const p = await picking('?referencia=R1');
      expect(p.ocupacao.ondas).toBe(1);
      expectClose(p.ocupacao.valor, 100);
      expect(p.paragens.valor).toBe(1);
      expect(p.ondas).toHaveLength(1);
      expect(p.ondas[0]).toMatchObject({ onda: 'W1', unidades: 12, unidadesDaOnda: 24, paragens: 1, localizacoes: 1 });
      expectClose(p.ondas[0].ocupacao, 100);
    });

    it('referência R2 e classe B dão o mesmo: W1, W2 e W3 entram, ocupação média 48,6111 %, 3 paragens', async () => {
      for (const query of ['?referencia=R2', '?classe=B']) {
        const p = await picking(query);
        expect(p.ocupacao.ondas).toBe(3);
        expectClose(p.ocupacao.valor, ((24 + 6 + 5) / 3 / 24) * 100);
        expect(p.paragens.valor).toBe(3);
        expect(p.ondas.find((o: { onda: string }) => o.onda === 'W1')).toMatchObject({ unidades: 12, unidadesDaOnda: 24 });
      }
    });

    it('período 20/01 (data da onda, via CO): só a W3, 5 un. → ocupação 20,8333 %, 1 paragem', async () => {
      const p = await picking('?inicio=2023-01-20&fim=2023-01-20');
      expect(p.ocupacao.ondas).toBe(1);
      expectClose(p.ocupacao.valor, (5 / 24) * 100);
      expect(p.paragens.valor).toBe(1);
    });
  });

  describe('zonas: só as linhas do PW que passam os filtros', () => {
    const zonas = async (query = '') => (await obter(`/api/artigos/zonas${query}`)).participacaoPorZona;

    it('sem filtro: L = 29 un. (100 % das mapeadas); não mapeadas 6 de 35 = 17,1429 %', async () => {
      const z = await zonas();
      expect(z.zonas.map((x: { zona: string; unidades: number }) => [x.zona, x.unidades])).toEqual([['L', 29]]);
      expectClose(z.naoMapeadas.percentagem, (6 / 35) * 100);
    });

    it('referência R1: L = 12 un. e nenhuma não mapeada', async () => {
      const z = await zonas('?referencia=R1');
      expect(z.zonas.map((x: { zona: string; unidades: number }) => [x.zona, x.unidades])).toEqual([['L', 12]]);
      expect(z.naoMapeadas.unidades).toBe(0);
    });

    it('referência R2: L = 17 un.; não mapeadas 6 de 23 = 26,087 %', async () => {
      const z = await zonas('?referencia=R2');
      expect(z.zonas[0].unidades).toBe(17);
      expectClose(z.naoMapeadas.percentagem, (6 / 23) * 100);
    });

    it('período 20/01: só a W3, L = 5 un.', async () => {
      const z = await zonas('?inicio=2023-01-20&fim=2023-01-20');
      expect(z.zonas.map((x: { zona: string; unidades: number }) => [x.zona, x.unidades])).toEqual([['L', 5]]);
      expect(z.naoMapeadas.unidades).toBe(0);
    });
  });
});
