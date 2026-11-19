/** Tolerância da spec para comparações numéricas. */
export const TOLERANCE = 1e-9;

export function expectClose(actual: unknown, expected: number): void {
  expect(typeof actual).toBe('number');
  expect(Math.abs((actual as number) - expected)).toBeLessThan(TOLERANCE);
}
