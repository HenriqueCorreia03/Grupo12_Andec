import { fixture3 } from './fixtures/fixture-3';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';
import { expectClose } from './support/expect-close';

describe('Artigos, fixture 3 (ondas 35678 e 35679, pedido dividido)', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture3);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('ABC: D05ZS7 A (antes 0 %), QXS5D1 B (antes 91,49 %), 05W6TK C (antes 97,87 %)', async () => {
    const { referencias } = (await ctx.get('/api/artigos/abc')).body;
    expect(referencias.map((r: { referencia: string; unidades: number; classe: string }) => [r.referencia, r.unidades, r.classe])).toEqual([
      ['D05ZS7', 43, 'A'],
      ['QXS5D1', 3, 'B'],
      ['05W6TK', 1, 'C'],
    ]);
    expectClose(referencias[1].acumuladoAntes, (43 / 47) * 100);
    expectClose(referencias[2].acumuladoAntes, (46 / 47) * 100);
  });

  it('tamanhos de D05ZS7 normalizados: 8 → 18 un., 85 → 8,5 → 24 un. (duas ondas), 10 → 1 un.', async () => {
    const body = (await ctx.get('/api/artigos/referencias/D05ZS7/tamanhos')).body;
    expect(body.referencia).toBe('D05ZS7');
    expect(body.classe).toBe('A');
    expect(body.unidades).toBe(43);
    expect(body.tamanhos).toEqual([
      { tamanho: 8, unidades: 18, escalaPorConfirmar: false },
      { tamanho: 8.5, unidades: 24, escalaPorConfirmar: false },
      { tamanho: 10, unidades: 1, escalaPorConfirmar: false },
    ]);
  });

  it('05W6TK: 125 → 12,5', async () => {
    const body = (await ctx.get('/api/artigos/referencias/05W6TK/tamanhos')).body;
    expect(body.tamanhos).toEqual([{ tamanho: 12.5, unidades: 1, escalaPorConfirmar: false }]);
  });
});
