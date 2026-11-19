import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'csv-parse/sync';

export interface CsvFile {
  header: string[];
  /** Linhas de dados, com o nº da linha no ficheiro (o cabeçalho é a linha 1). */
  rows: { sourceLine: number; fields: string[] }[];
}

/**
 * Lê um CSV respeitando aspas, sem o BOM, com fins de linha CRLF, LF ou CR.
 * Os campos ficam exatamente como no ficheiro (sem remover espaços).
 * Só lê: o ficheiro original nunca é alterado.
 */
export async function readCsv(
  dataDir: string,
  fileName: string,
  delimiter: ';' | ',',
  expectedHeader: string[],
): Promise<CsvFile> {
  const content = await readFile(join(dataDir, fileName), 'utf8');
  const records: string[][] = parse(content, {
    delimiter,
    bom: true,
    skip_empty_lines: true,
    relax_quotes: false,
    info: false,
  });
  const [header, ...data] = records;
  if (!header || header.join('|') !== expectedHeader.join('|')) {
    throw new Error(
      `${fileName}: cabeçalho inesperado. Esperado "${expectedHeader.join(delimiter)}", ` +
        `encontrado "${(header ?? []).join(delimiter)}".`,
    );
  }
  return {
    header,
    rows: data.map((fields, i) => {
      if (fields.length !== header.length) {
        throw new Error(
          `${fileName}, linha ${i + 2}: ${fields.length} campos, esperados ${header.length}.`,
        );
      }
      return { sourceLine: i + 2, fields };
    }),
  };
}
