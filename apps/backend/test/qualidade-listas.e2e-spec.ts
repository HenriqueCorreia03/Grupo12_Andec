import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fixture4 } from './fixtures/fixture-4';
import { AppWithFixture, startAppWithFixture } from './support/app-with-fixture';

/** Itens numerados de uma secção "### …" da spec, sem a numeração e sem a marcação de código (`…`). */
function itensDaSpec(titulo: string): string[] {
  const spec = readFileSync(resolve(__dirname, '../../../docs/spec.md'), 'utf8').replace(/\r\n/g, '\n');
  const inicio = spec.indexOf(`### ${titulo}`);
  expect(inicio).toBeGreaterThanOrEqual(0);
  const seccao = spec.slice(inicio).split('\n### ')[0];
  return seccao
    .split('\n')
    .filter((linha) => /^\d+\. /.test(linha))
    .map((linha) => linha.replace(/^\d+\. /, '').replace(/`/g, ''));
}

describe('Qualidade dos dados: listas estáticas e filtros', () => {
  let ctx: AppWithFixture;

  beforeAll(async () => {
    ctx = await startAppWithFixture(fixture4);
  });

  afterAll(async () => {
    await ctx?.close();
  });

  it('a lista de limitações conhecidas é igual à da spec (13 itens, pela mesma ordem)', async () => {
    const { limitacoes } = (await ctx.get('/api/qualidade')).body;
    const esperadas = itensDaSpec('Limitações conhecidas');
    expect(esperadas).toHaveLength(13);
    expect(limitacoes).toEqual(esperadas);
  });

  it('a lista de perguntas ao docente é igual à da spec (9 itens, pela mesma ordem), separada das limitações', async () => {
    const { perguntasAoDocente } = (await ctx.get('/api/qualidade')).body;
    const esperadas = itensDaSpec('Perguntas ao docente');
    expect(esperadas).toHaveLength(9);
    expect(perguntasAoDocente).toEqual(esperadas);
  });

  it('a página usa sempre o dataset completo: com filtros, os valores não mudam e os filtros aparecem como não aplicáveis', async () => {
    const semFiltros = (await ctx.get('/api/qualidade')).body;
    const comFiltros = (await ctx.get('/api/qualidade?mes=2023-02&operador=Operator_1&zona=K')).body;
    expect(semFiltros.filtrosNaoAplicaveis).toEqual([]);
    expect(comFiltros.filtrosNaoAplicaveis).toEqual(['período', 'operador', 'zona']);
    expect({ ...comFiltros, filtrosNaoAplicaveis: [] }).toEqual(semFiltros);
  });
});
