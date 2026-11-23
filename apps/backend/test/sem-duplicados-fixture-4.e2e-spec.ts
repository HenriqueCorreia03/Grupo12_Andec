import request from 'supertest';
import { fixture4 } from './fixtures/fixture-4';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

/**
 * Sensibilidade aos duplicados (ticket 17). Na fixture 4 a linha L2 é idêntica à L1 (P1, D1, 2 un.):
 * com duplicados (a regra principal) há 12 un.; sem duplicados ficam 10 un.
 */
describe('Alternador "sem duplicados" (fixture 4)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture4);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('sem duplicados: tamanho médio 10 ÷ 4 = 2,5 (com duplicados é 3,0)', async () => {
    const com = (await ctx.get('/api/visao-geral')).body.tamanhoMedioEncomenda;
    expectClose(com.valor, 3);
    const sem = (await ctx.get('/api/visao-geral?duplicados=sem')).body.tamanhoMedioEncomenda;
    expectClose(sem.valor, 2.5);
    expect(sem.pedidosConsiderados).toBe(4);
  });

  it('sem duplicados: no ABC o D1 passa de 6 para 4 un.; classes D1, D2, D4 = A e D3 = B', async () => {
    const porRef = (corpo: { referencias: { referencia: string; unidades: number; classePeriodo: string | null }[] }) =>
      Object.fromEntries(corpo.referencias.map((r) => [r.referencia, [r.unidades, r.classePeriodo]]));
    expect(porRef((await ctx.get('/api/artigos/abc')).body).D1).toEqual([6, 'A']);
    expect(porRef((await ctx.get('/api/artigos/abc?duplicados=sem')).body)).toEqual({
      D1: [4, 'A'],
      D2: [3, 'A'],
      D4: [2, 'A'],
      D3: [1, 'B'],
    });
  });

  it('duplicados=com é a regra principal: igual a não passar o parâmetro', async () => {
    const semParametro = (await ctx.get('/api/visao-geral')).body;
    const com = (await ctx.get('/api/visao-geral?duplicados=com')).body;
    expect(com).toEqual(semParametro);
  });

  it('um valor que não é "com" nem "sem" dá 400 com mensagem clara', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/visao-geral?duplicados=talvez').expect(400);
    expect(res.body.message).toMatch(/duplicados/);
  });
});
