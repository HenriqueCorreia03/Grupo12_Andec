const numero = new Intl.NumberFormat("pt-PT", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
  // Em pt-PT os números de 4 dígitos não levam separador por omissão; assim ficam todos iguais (3 751, 32 632).
  useGrouping: "always",
});

/** Arredonda só na apresentação: 2 casas decimais (spec, contrato da API). */
export function formatarNumero(valor: number): string {
  return numero.format(valor);
}

/** Percentagem que já vem × 100 da API (por exemplo 66,6667 → "66,67 %"). */
export function formatarPercentagem(valor: number): string {
  return `${numero.format(valor)} %`;
}

/** Como formatarNumero, mas devolve nulo ("sem dados") quando a API devolve nulo. */
export function formatarNumeroOuNulo(valor: number | null): string | null {
  return valor === null ? null : formatarNumero(valor);
}

/** Como formatarPercentagem, mas devolve nulo ("sem dados") quando a API devolve nulo. */
export function formatarPercentagemOuNulo(valor: number | null): string | null {
  return valor === null ? null : formatarPercentagem(valor);
}
