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

/** Variação relativa já × 100, com sinal: "+59,52 %", "−22,75 %", "0 %". */
export function formatarVariacao(valor: number): string {
  if (valor === 0) return "0 %";
  const sinal = valor > 0 ? "+" : "\u2212";
  return `${sinal}${formatarPercentagem(Math.abs(valor))}`;
}

/** aaaa-mm-dd → dd/mm/aaaa. */
export function formatarData(dia: string): string {
  const [ano, mes, d] = dia.split("-");
  return `${d}/${mes}/${ano}`;
}

const NOMES_MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** aaaa-mm → "mar 2023". */
export function formatarMes(mes: string): string {
  return `${formatarMesCurto(mes)} ${mes.split("-")[0]}`;
}

/** aaaa-mm → "mar" (eixo dos gráficos mensais, todos do mesmo ano). */
export function formatarMesCurto(mes: string): string {
  return NOMES_MESES[Number(mes.split("-")[1]) - 1];
}
