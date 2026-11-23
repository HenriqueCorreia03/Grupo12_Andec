import { crlf, type FixtureFiles, lf } from '../support/fixture-files';

/**
 * Desempate do ranking dos pedidos divididos por período (dados inventados).
 * Dois pedidos divididos, um em janeiro e outro em fevereiro, os dois às 10:00:
 * - J1 (terça-feira, 10/01/2023): ondas J10 e J11 com 3 un. cada → ocupação média (3 ÷ 24 × 100) = 12,5 %.
 * - F1 (sexta-feira, 10/02/2023): ondas F10 e F11 com 1 un. cada → ocupação média (1 ÷ 24 × 100) = 4,1667 %.
 * Empatam em 1 pedido dividido por mês e por dia da semana: a ocupação média crescente põe fevereiro e a sexta-feira primeiro,
 * ao contrário da ordem do calendário.
 */
const CLIENTE = 'C0000077            ';
const CO = (pedido: string, ordem: number, ref: string, qtd: number, data: string, onda: string) =>
  `${CLIENTE};${pedido};${ordem};${ref};9;${qtd};${data};${onda};Operator_1`;
const JAN = '10/01/2023 10:00';
const FEV = '10/02/2023 10:00';
const PW = (onda: string, ref: string, n: number) =>
  Array.from({ length: n }, () => `${onda};${ref};9.0;1;K-01-01     ;Operator_1`);

export const fixtureDivididosDesempate: FixtureFiles = {
  'Customer_Order.csv': crlf([
    'codCustomer;orderNumber;orderToCollect;Reference;Size (US);quantity (units);creationDate;waveNumber;operator',
    CO('J1', 1, 'R1', 3, JAN, 'J10'),
    CO('J1', 2, 'R2', 3, JAN, 'J11'),
    CO('F1', 1, 'R1', 1, FEV, 'F10'),
    CO('F1', 2, 'R2', 1, FEV, 'F11'),
  ]),
  'Picking_Wave.csv': crlf([
    'waveNumber;reference;Size (US);quantityToPick (units);locations;operator',
    ...PW('J10', 'R1', 3),
    ...PW('J11', 'R2', 3),
    ...PW('F10', 'R1', 1),
    ...PW('F11', 'R2', 1),
  ]),
  'Product.csv': crlf(['Reference;ABCCOD;Sector', 'R1;A;PF      ', 'R2;A;PF      ']),
  'Storage_Location.csv': lf(['originalLocation,position,x,y,z', 'K-01-01,"100, 200, 1",100,200,1']),
};
