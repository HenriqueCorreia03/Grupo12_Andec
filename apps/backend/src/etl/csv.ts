import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'csv-parse/sync';

export interface CsvRow {
  /** Nº da linha no ficheiro onde o registo começa (o cabeçalho é a linha 1). */
  sourceLine: number;
  /** Campos exatamente como no ficheiro (sem remover espaços). */
  fields: string[];
}

/**
 * Lê um CSV respeitando aspas, sem o BOM, com fins de linha CRLF, LF ou CR.
 * Valida o cabeçalho e o nº de campos de cada linha.
 * Só lê: o ficheiro original nunca é alterado.
 */
export async function readCsv(
  dataDir: string,
  fileName: string,
  delimiter: ';' | ',',
  expectedHeader: string[],
): Promise<CsvRow[]> {
  const content = await readFile(join(dataDir, fileName));
  // Com `info: true`, cada registo vem com o deslocamento em bytes do seu fim
  // (os tipos do csv-parse não distinguem este caso).
  const records = parse(content, {
    delimiter,
    bom: true,
    skip_empty_lines: true,
    info: true,
  }) as unknown as { record: string[]; info: { bytes: number } }[];

  const lineAt = lineCounter(content);
  let recordStart = 0;
  const rows: CsvRow[] = records.map(({ record, info }) => {
    // Salta linhas vazias antes do registo; o registo termina em info.bytes.
    while (content[recordStart] === CR || content[recordStart] === LF) recordStart++;
    const row = { sourceLine: lineAt(recordStart), fields: record };
    recordStart = info.bytes;
    return row;
  });

  const [header, ...data] = rows;
  if (!header || header.fields.join('|') !== expectedHeader.join('|')) {
    throw new Error(
      `${fileName}: cabeçalho inesperado. Esperado "${expectedHeader.join(delimiter)}", ` +
        `encontrado "${(header?.fields ?? []).join(delimiter)}".`,
    );
  }
  for (const row of data) {
    if (row.fields.length !== expectedHeader.length) {
      throw new Error(
        `${fileName}, linha ${row.sourceLine}: ${row.fields.length} campos, esperados ${expectedHeader.length}.`,
      );
    }
  }
  return data;
}

const CR = 0x0d;
const LF = 0x0a;

/**
 * Devolve uma função que dá o nº da linha de um deslocamento em bytes.
 * CRLF, LF e CR contam como uma quebra de linha. Os deslocamentos pedidos têm de ser crescentes.
 */
function lineCounter(content: Buffer): (offset: number) => number {
  let position = 0;
  let line = 1;
  return (offset) => {
    while (position < offset) {
      if (content[position] === CR) {
        line++;
        if (content[position + 1] === LF) position++;
      } else if (content[position] === LF) {
        line++;
      }
      position++;
    }
    return line;
  };
}
