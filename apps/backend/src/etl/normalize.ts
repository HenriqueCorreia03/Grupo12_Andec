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
  scaleUnconfirmed: boolean;
}

/**
 * Tamanhos (spec, regras de limpeza):
 * - vazio → nulo;
 * - códigos 35, 45, …, 125 → 3,5 … 12,5;
 * - inteiros 1–16 e decimais como 9.5 ficam iguais;
 * - escala 215–305 fica igual e é marcada como "escala por confirmar".
 */
export function normalizeSize(value: string): NormalizedSize {
  if (value === '') return { size: null, scaleUnconfirmed: false };
  const size = Number(value);
  if (!Number.isFinite(size)) throw new Error(`tamanho inválido "${value}"`);
  if (Number.isInteger(size) && size >= 35 && size <= 125 && size % 10 === 5) {
    return { size: size / 10, scaleUnconfirmed: false };
  }
  return { size, scaleUnconfirmed: size >= 215 && size <= 305 };
}

export function parseInteger(value: string, field: string): number {
  if (!/^-?\d+$/.test(value)) throw new Error(`${field} inválido "${value}"`);
  return Number(value);
}
