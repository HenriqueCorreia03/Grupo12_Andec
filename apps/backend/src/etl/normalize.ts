/**
 * Data no formato dd/mm/aaaa hh:mm (hora local, sem fuso horário)
 * → 'aaaa-mm-dd hh:mm:00', para uma coluna timestamp sem fuso.
 */
export function parseCreationDate(value: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error(`data inválida "${value}" (esperado dd/mm/aaaa hh:mm)`);
  const [, day, month, year, hour, minute] = match;
  return `${year}-${month}-${day} ${hour}:${minute}:00`;
}

export interface NormalizedSize {
  size: number | null;
  /** Escala 215–305: mantida tal como está, "escala por confirmar". */
  scaleUnconfirmed: boolean;
  /** Valor fora de todas as escalas conhecidas: mantido tal como está e contado na qualidade. */
  outOfKnownScales: boolean;
}

/**
 * Tamanhos (spec, regras de limpeza):
 * - vazio → nulo;
 * - códigos 35, 45, …, 125 → 3,5 … 12,5;
 * - valores de 1 a 16 (inteiros, ou decimais como 9.5 no PW) ficam iguais;
 * - escala 215–305 fica igual e é marcada como "escala por confirmar";
 * - qualquer outro valor fica igual e é marcado como "fora das escalas conhecidas".
 */
export function normalizeSize(value: string): NormalizedSize {
  if (value === '') return { size: null, scaleUnconfirmed: false, outOfKnownScales: false };
  const size = Number(value);
  if (!Number.isFinite(size)) throw new Error(`tamanho inválido "${value}"`);
  if (Number.isInteger(size) && size >= 35 && size <= 125 && size % 10 === 5) {
    return { size: size / 10, scaleUnconfirmed: false, outOfKnownScales: false };
  }
  const scaleUnconfirmed = size >= 215 && size <= 305;
  const usScale = size >= 1 && size <= 16;
  return { size, scaleUnconfirmed, outOfKnownScales: !scaleUnconfirmed && !usScale };
}

export function parseInteger(value: string, field: string): number {
  if (!/^-?\d+$/.test(value)) throw new Error(`${field} inválido "${value}"`);
  return Number(value);
}
