import { crlf, type FixtureFiles, lf } from '../support/fixture-files';

/**
 * Ondas incompletas simultâneas (spec, P6; dados inventados). Todas as ondas têm menos de 24 un.
 * - A (15/03/2023 10:05, 2 un.) e B (15/03/2023 10:40, 2 un.): mesmo dia e mesma hora → simultâneas.
 * - C (15/03/2023 11:10, 1 un.): outra hora do mesmo dia → sozinha na hora, não conta.
 * - D (16/03/2023 10:20, 2 un.): mesma hora do dia, mas outro dia → não conta.
 * - O pedido P1 está dividido nas ondas A e C; P2 só na B; P3 só na D.
 */
const CLIENTE = 'C0000088            ';
const CO = (pedido: string, qtd: number, data: string, onda: string) => `${CLIENTE};${pedido};1;R1;9;${qtd};${data};${onda};Operator_1`;
const PW = (onda: string, n: number) => Array.from({ length: n }, () => `${onda};R1;9.0;1;K-01-01     ;Operator_1`);

export const fixtureOndasIncompletas: FixtureFiles = {
  'Customer_Order.csv': crlf([
    'codCustomer;orderNumber;orderToCollect;Reference;Size (US);quantity (units);creationDate;waveNumber;operator',
    CO('P1', 2, '15/03/2023 10:05', 'A'),
    CO('P2', 2, '15/03/2023 10:40', 'B'),
    CO('P1', 1, '15/03/2023 11:10', 'C'),
    CO('P3', 2, '16/03/2023 10:20', 'D'),
  ]),
  'Picking_Wave.csv': crlf([
    'waveNumber;reference;Size (US);quantityToPick (units);locations;operator',
    ...PW('A', 2),
    ...PW('B', 2),
    ...PW('C', 1),
    ...PW('D', 2),
  ]),
  'Product.csv': crlf(['Reference;ABCCOD;Sector', 'R1;A;PF      ']),
  'Storage_Location.csv': lf(['originalLocation,position,x,y,z', 'K-01-01,"100, 200, 1",100,200,1']),
};
