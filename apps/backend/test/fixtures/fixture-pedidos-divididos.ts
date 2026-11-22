import { crlf, type FixtureFiles, lf } from '../support/fixture-files';

/**
 * Fixtures sintéticas do ticket 05 (dados inventados), só para os casos-limite dos pedidos divididos.
 * Uma única referência (R1); a data e o tamanho são iguais em todas as linhas.
 */
const CO = (pedido: string, ordem: number, qtd: number, onda: string) =>
  `C0000001;${pedido};${ordem};R1;9;${qtd};10/01/2023 10:00;${onda};Operator_1`;

const CABECALHO_CO = 'codCustomer;orderNumber;orderToCollect;Reference;Size (US);quantity (units);creationDate;waveNumber;operator';

const RESTO: Omit<FixtureFiles, 'Customer_Order.csv'> = {
  'Picking_Wave.csv': crlf(['waveNumber;reference;Size (US);quantityToPick (units);locations;operator']),
  'Product.csv': crlf(['Reference;ABCCOD;Sector', 'R1;A;PF']),
  'Storage_Location.csv': lf(['originalLocation,position,x,y,z']),
};

/**
 * Casos-limite (unidades do pedido completo, somadas em todas as ondas):
 * - PA: W1 12 + W2 12 = 24 un.      → dividido, ≤ 24 (limite)
 * - PB: W1 13 + W2 12 = 25 un.      → dividido, > 24 (limite)
 * - PC: W1 1 + W2 1 + W3 1 = 3 un.  → dividido (3 ondas, conta uma vez), ≤ 24
 * - PD: W1 5 un. + W2 com linha a 0 → NÃO dividido (a linha a 0 não conta)
 * - PE: W1 3 + 2 (duas linhas na mesma onda) → NÃO dividido
 * - PF: W1 0 e W2 0                 → pedido com 0 un.: excluído, não é dividido
 * Válidos 5; divididos 3 (60 %); ≤ 24: 2 (PA, PC = 40 %); > 24: 1 (PB).
 * Linhas > 0: 10; linhas a 0: 3 (PD 1, PF 2); pedidos com 0 un.: 1.
 */
export const fixtureLimitesDivididos: FixtureFiles = {
  'Customer_Order.csv': crlf([
    CABECALHO_CO,
    CO('PA', 1, 12, 'W1'),
    CO('PA', 2, 12, 'W2'),
    CO('PB', 1, 13, 'W1'),
    CO('PB', 2, 12, 'W2'),
    CO('PC', 1, 1, 'W1'),
    CO('PC', 2, 1, 'W2'),
    CO('PC', 3, 1, 'W3'),
    CO('PD', 1, 5, 'W1'),
    CO('PD', 2, 0, 'W2'),
    CO('PE', 1, 3, 'W1'),
    CO('PE', 2, 2, 'W1'),
    CO('PF', 1, 0, 'W1'),
    CO('PF', 2, 0, 'W2'),
  ]),
  ...RESTO,
};

/** Só um pedido, com 0 un.: não há pedidos válidos ("sem dados"). */
export const fixtureSemPedidosValidos: FixtureFiles = {
  'Customer_Order.csv': crlf([CABECALHO_CO, CO('PZ', 1, 0, 'W1')]),
  ...RESTO,
};
