import request from 'supertest';
import { fixture4 } from './fixtures/fixture-4';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';

/** Os mesmos parâmetros de filtro valem em todos os endpoints. */
const ENDPOINTS = [
  '/api/visao-geral',
  '/api/artigos/abc',
  '/api/artigos/referencias/D1/tamanhos',
  '/api/artigos/zonas',
  '/api/ondas-e-pedidos',
  '/api/ondas-e-pedidos/picking',
];

describe('Filtros, validação dos parâmetros e "sem dados" (fixture 4)', () => {
  let ctx: AppWithFixture;
  const resposta = (caminho: string) => request(ctx.app.getHttpServer()).get(caminho);
  const rejeitado = async (caminho: string, mensagem: RegExp) => {
    const res = await resposta(caminho).expect(400);
    expect(res.body.message).toMatch(mensagem);
  };

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture4);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  describe.each(ENDPOINTS)('%s', (endpoint) => {
    it('rejeita inicio sem fim e fim sem inicio (400)', async () => {
      await rejeitado(`${endpoint}?inicio=2023-02-01`, /inicio e fim/i);
      await rejeitado(`${endpoint}?fim=2023-02-28`, /inicio e fim/i);
    });

    it('rejeita uma classe fora de A, B e C (400)', async () => {
      await rejeitado(`${endpoint}?classe=D`, /classe/i);
    });

    it('rejeita operador, onda e pedido repetidos (400)', async () => {
      await rejeitado(`${endpoint}?operador=Operator_1&operador=Operator_2`, /operador/i);
      await rejeitado(`${endpoint}?onda=W10&onda=W12`, /onda/i);
      await rejeitado(`${endpoint}?pedido=P1&pedido=P2`, /pedido/i);
    });

    it('aceita operador, onda e pedido (200)', async () => {
      await resposta(`${endpoint}?operador=Operator_1&onda=W10&pedido=P1`).expect(200);
    });

    it('aceita os filtros válidos e ignora os parâmetros desconhecidos (200)', async () => {
      await resposta(`${endpoint}?mes=2023-02&referencia=D1&classe=A&zona=K&operador=Operator_1`).expect(200);
    });
  });

  describe('datas e mês', () => {
    const base = '/api/visao-geral';

    it('rejeita uma data impossível (30 de fevereiro) e um formato inválido', async () => {
      await rejeitado(`${base}?inicio=2023-02-30&fim=2023-03-01`, /data inválida/i);
      await rejeitado(`${base}?inicio=2023-2-1&fim=2023-02-28`, /formato/i);
      await rejeitado(`${base}?inicio=ontem&fim=hoje`, /formato/i);
    });

    it('rejeita inicio posterior ao fim', async () => {
      await rejeitado(`${base}?inicio=2023-03-01&fim=2023-02-01`, /posterior/i);
    });

    it('aceita inicio igual ao fim (um só dia)', async () => {
      await resposta(`${base}?inicio=2023-02-02&fim=2023-02-02`).expect(200);
    });

    it('rejeita um mês inválido e o mês combinado com inicio/fim', async () => {
      await rejeitado(`${base}?mes=2023-13`, /mês/i);
      await rejeitado(`${base}?mes=2023`, /mês/i);
      await rejeitado(`${base}?mes=2023-02&inicio=2023-02-01&fim=2023-02-28`, /mes.*inicio|inicio.*mes/i);
    });

    it('rejeita um parâmetro repetido', async () => {
      await rejeitado(`${base}?referencia=D1&referencia=D2`, /repetido/i);
    });
  });

  describe('referências', () => {
    it('uma referência desconhecida no filtro dá 200 com "sem dados"', async () => {
      const corpo = (await resposta('/api/visao-geral?referencia=NAOEXISTE').expect(200)).body;
      expect(corpo.tamanhoMedioEncomenda.valor).toBeNull();
      expect(corpo.pedidosPorOnda.valor).toBeNull();
      expect(corpo.pedidosMultissetor.valor).toBeNull();
      expect(corpo.participacaoPorSetor.setores).toEqual([]);
    });

    it('uma referência desconhecida no caminho dos tamanhos dá 404', async () => {
      await resposta('/api/artigos/referencias/NAOEXISTE/tamanhos').expect(404);
    });

    it('em /tamanhos, ?referencia= diferente da do caminho dá 400; igual dá 200', async () => {
      await rejeitado('/api/artigos/referencias/D1/tamanhos?referencia=D2', /referencia/i);
      await resposta('/api/artigos/referencias/D1/tamanhos?referencia=D1').expect(200);
    });
  });

  describe('"sem dados" no picking e nas zonas (nulo, nunca 0)', () => {
    it('picking sem ondas no filtro: ocupação, paragens e estatísticas nulas; sem ondas na lista', async () => {
      const corpo = (await resposta('/api/ondas-e-pedidos/picking?mes=2023-03').expect(200)).body;
      expect(corpo.ocupacao.valor).toBeNull();
      expect(corpo.ocupacao.minimo).toBeNull();
      expect(corpo.ocupacao.maximo).toBeNull();
      expect(corpo.ocupacao.percentagemCom24).toBeNull();
      expect(corpo.ocupacao.ondas).toBe(0);
      expect(corpo.paragens.valor).toBeNull();
      expect(corpo.localizacoesPorOnda.media).toBeNull();
      expect(corpo.localizacoesPorOnda.mediana).toBeNull();
      expect(corpo.ondas).toEqual([]);
    });

    it('com dados, as paragens são um número e não nulo (fevereiro: 3)', async () => {
      const corpo = (await resposta('/api/ondas-e-pedidos/picking?mes=2023-02').expect(200)).body;
      expect(corpo.paragens.valor).toBe(3);
    });

    it('zonas sem linhas: sem zonas e percentagem das não mapeadas nula', async () => {
      const zonas = (await resposta('/api/artigos/zonas?mes=2023-03').expect(200)).body.participacaoPorZona;
      expect(zonas.zonas).toEqual([]);
      expect(zonas.naoMapeadas.percentagem).toBeNull();
    });

    it('pedidos divididos sem pedidos no filtro: valor e percentagem nulos', async () => {
      const divididos = (await resposta('/api/ondas-e-pedidos?mes=2023-03&referencia=D1').expect(200)).body.pedidosDivididos;
      expect(divididos.valor).toBeNull();
      expect(divididos.percentagemAte24).toBeNull();
      expect(divididos.pedidosValidos).toBe(0);
    });
  });
});
