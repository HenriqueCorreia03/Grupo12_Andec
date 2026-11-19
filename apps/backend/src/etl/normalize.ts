/**
 * Data no formato dd/mm/aaaa hh:mm (hora local, sem fuso horário)
 * → 'aaaa-mm-dd hh:mm:00', para uma coluna timestamp sem fuso.
 */
export function parseCreationDate(value: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(value);
  if (!m) throw new Error(`data inválida "${value}" (esperado dd/mm/aaaa hh:mm)`);
  const [, dd, mm, yyyy, hh, mi] = m;
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:00`;
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
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`tamanho inválido "${value}"`);
  if (Number.isInteger(n) && n >= 35 && n <= 125 && n % 10 === 5) {
    return { size: n / 10, scaleUnconfirmed: false };
  }
  return { size: n, scaleUnconfirmed: n >= 215 && n <= 305 };
}

export function parseInteger(value: string, field: string): number {
  if (!/^-?\d+$/.test(value)) throw new Error(`${field} inválido "${value}"`);
  return Number(value);
}
