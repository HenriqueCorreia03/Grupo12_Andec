const numero = new Intl.NumberFormat("pt-PT", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Arredonda só na apresentação: 2 casas decimais (spec, contrato da API). */
export function formatarNumero(valor: number): string {
  return numero.format(valor);
}
