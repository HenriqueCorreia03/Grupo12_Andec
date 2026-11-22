import { crlf, type FixtureFiles, lf } from '../support/fixture-files';

/**
 * Fixture sintética do ticket 06a (dados inventados): fronteiras do filtro de período.
 * Uma referência (R1), uma onda por pedido; quantidades diferentes para se perceber que pedidos entram.
 *
 * - P1: 02/02/2023 00:00, 1 un.   (início do dia)
 * - P2: 02/02/2023 23:59, 2 un.   (último minuto do dia)
 * - P3: 03/02/2023 00:00, 4 un.   (primeiro minuto do dia seguinte)
 * - P4: 01/02/2023 23:59, 8 un.   (último minuto do dia anterior)
 *
 * O dia 02/02/2023 = P1 + P2: 3 un. em 2 pedidos (tamanho médio 1,5).
 * Fevereiro (mes=2023-02) = os 4 pedidos: 15 un. (tamanho médio 3,75).
 */
const CO = (pedido: string, data: string, qtd: number, onda: string) =>
  `C0000001;${pedido};1;R1;9;${qtd};${data};${onda};Operator_1`;

export const fixtureFiltrosPeriodo: FixtureFiles = {
  'Customer_Order.csv': crlf([
    'codCustomer;orderNumber;orderToCollect;Reference;Size (US);quantity (units);creationDate;waveNumber;operator',
    CO('P1', '02/02/2023 00:00', 1, 'W1'),
    CO('P2', '02/02/2023 23:59', 2, 'W2'),
    CO('P3', '03/02/2023 00:00', 4, 'W3'),
    CO('P4', '01/02/2023 23:59', 8, 'W4'),
  ]),
  'Picking_Wave.csv': crlf(['waveNumber;reference;Size (US);quantityToPick (units);locations;operator']),
  'Product.csv': crlf(['Reference;ABCCOD;Sector', 'R1;A;PF']),
  'Storage_Location.csv': lf(['originalLocation,position,x,y,z']),
};
