import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { sql } from 'drizzle-orm';
import type { Database } from '../db/connection';
import { esforcoMatriz } from '../db/schema';

/** Ficheiro de configuração versionado no repositório (igual a partir de src/ e de dist/). */
export const ESFORCO_MATRIZ_FILE = resolve(__dirname, '../../config/esforco-matriz.json');

const ALAVANCAS = ['a', 'b'] as const;

export interface EsforcoMatrizSummary {
  alavancas: number;
}

/**
 * Esforço da matriz (juízo da equipa) → tabela `esforco_matriz`.
 * Falha com uma mensagem clara se faltar uma alavanca, se a nota não for 1, 2 ou 3, ou se a justificação vier vazia.
 */
export async function loadEsforcoMatriz(tx: Database, file = ESFORCO_MATRIZ_FILE): Promise<EsforcoMatrizSummary> {
  const config = JSON.parse(await readFile(file, 'utf8')) as {
    alavancas?: Record<string, { nota?: unknown; justificacao?: unknown }>;
  };

  const linhas = ALAVANCAS.map((alavanca) => {
    const entrada = config.alavancas?.[alavanca];
    const { nota, justificacao } = entrada ?? {};
    if (nota !== 1 && nota !== 2 && nota !== 3) {
      throw new Error(`${file}: a nota do esforço da alavanca (${alavanca}) tem de ser 1, 2 ou 3.`);
    }
    if (typeof justificacao !== 'string' || justificacao.trim() === '') {
      throw new Error(`${file}: falta a justificação do esforço da alavanca (${alavanca}).`);
    }
    return { alavanca, nota, justificacao: justificacao.trim() };
  });

  await tx.execute(sql`truncate table ${esforcoMatriz}`);
  await tx.insert(esforcoMatriz).values(linhas);
  return { alavancas: linhas.length };
}
