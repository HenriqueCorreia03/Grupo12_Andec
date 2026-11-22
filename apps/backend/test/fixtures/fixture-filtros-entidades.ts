import { crlf, type FixtureFiles, lf } from '../support/fixture-files';

/**
 * Fixture sintética do ticket 06a (dados inventados): filtros e propriedades de entidade.
 * R1 (setor PF) e R2 (setor SX); cada linha do PW vale 1 un.
 *
 * CO:
 * - Q1 (10/01/2023 10:00): R1 12 un. na W1 + R2 12 un. na W2 → pedido dividido, multissetor, 24 un. no total
 * - Q2 (10/01/2023 10:00): R1 100 un. na W1 → não dividido
 * - Q3 (20/01/2023 09:00): R2 5 un. na W3 → não dividido
 * ABC global: R1 = 112 un. (A, antes 0 %); R2 = 17 un. (B, antes 112 ÷ 129 = 86,8 %).
 *
 * PW:
 * - W1: 12 un. de R1 em L-01-01 + 12 un. de R2 em L-01-02 = 24 un. (ocupação 100 %), 2 localizações
 * - W2: 6 un. de R2 em X-99-99 (não mapeada) = 6 un. (25 %), 1 localização
 * - W3: 5 un. de R2 em L-01-02 = 5 un. (20,8333 %), 1 localização
 * L-01-01 e L-01-02 são mapeadas (zona L).
 */
const CO = (pedido: string, ordem: number, ref: string, qtd: number, data: string, onda: string) =>
  `C0000001;${pedido};${ordem};${ref};9;${qtd};${data};${onda};Operator_1`;
const PW = (onda: string, ref: string, localizacao: string, unidades: number) =>
  Array.from({ length: unidades }, () => `${onda};${ref};9.0;1;${localizacao};Operator_1`);

export const fixtureFiltrosEntidades: FixtureFiles = {
  'Customer_Order.csv': crlf([
    'codCustomer;orderNumber;orderToCollect;Reference;Size (US);quantity (units);creationDate;waveNumber;operator',
    CO('Q1', 1, 'R1', 12, '10/01/2023 10:00', 'W1'),
    CO('Q1', 2, 'R2', 12, '10/01/2023 10:00', 'W2'),
    CO('Q2', 1, 'R1', 100, '10/01/2023 10:00', 'W1'),
    CO('Q3', 1, 'R2', 5, '20/01/2023 09:00', 'W3'),
  ]),
  'Picking_Wave.csv': crlf([
    'waveNumber;reference;Size (US);quantityToPick (units);locations;operator',
    ...PW('W1', 'R1', 'L-01-01     ', 12),
    ...PW('W1', 'R2', 'L-01-02     ', 12),
    ...PW('W2', 'R2', 'X-99-99     ', 6),
    ...PW('W3', 'R2', 'L-01-02     ', 5),
  ]),
  'Product.csv': crlf(['Reference;ABCCOD;Sector', 'R1;A;PF', 'R2;B;SX']),
  'Storage_Location.csv': lf([
    'originalLocation,position,x,y,z',
    'L-01-01,"100, 200, 1",100,200,1',
    'L-01-02,"100, 216, 1",100,216,1',
  ]),
};
