import { crlf, type FixtureFiles, lf } from '../support/fixture-files';

/**
 * Fixture 1 (spec, "Testing Decisions"): onda 33444, dados reais.
 *
 * Linhas copiadas dos CSV originais, com o mesmo formato: BOM e CRLF no CO,
 * no PW e no Product; Storage_Location com LF, sem BOM e com campos entre
 * aspas que têm vírgulas dentro.
 *
 * Valores esperados (calculados à mão, folha de Excel da fixture 1):
 * pedidos 90412 = 2 un., 90413 = 3 un., 90414 = 2 un.
 */

export const fixture1: FixtureFiles = {
  'Customer_Order.csv': crlf([
    'codCustomer;orderNumber;orderToCollect;Reference;Size (US);quantity (units);creationDate;waveNumber;operator',
    'C0000014            ;90414;1;AHR20O;95;2;10/01/2023 11:05;33444;Operator_8',
    'C0000014            ;90413;2;Q50W5L;12;2;10/01/2023 11:05;33444;Operator_8',
    'C0000014            ;90413;1;AHR20O;12;1;10/01/2023 11:05;33444;Operator_8',
    'C0000014            ;90412;2;AHR20O;12;1;10/01/2023 11:05;33444;Operator_8',
    'C0000014            ;90412;1;AHR20O;9;1;10/01/2023 11:05;33444;Operator_8',
  ]),
  'Picking_Wave.csv': crlf([
    'waveNumber;reference;Size (US);quantityToPick (units);locations;operator',
    '33444;Q50W5L;12.0;1;K-08-22     ;Operator_8',
    '33444;Q50W5L;12.0;1;K-08-22     ;Operator_8',
    '33444;AHR20O;12.0;1;K-07-23     ;Operator_8',
    '33444;AHR20O;12.0;1;K-07-23     ;Operator_8',
    '33444;AHR20O;9.5;1;K-05-21     ;Operator_8',
    '33444;AHR20O;9.5;1;K-05-21     ;Operator_8',
    '33444;AHR20O;9.0;1;K-03-13     ;Operator_8',
  ]),
  'Product.csv': crlf([
    'Reference;ABCCOD;Sector',
    'AHR20O;A;PF      ',
    'Q50W5L;C;PF      ',
  ]),
  'Storage_Location.csv': lf([
    'originalLocation,position,x,y,z',
    'K-03-13,"584, 900, 1",584,900,1',
    'K-05-21,"566, 900, 2",566,900,2',
    'K-07-23,"484, 900, 2",484,900,2',
    'K-08-22,"500, 958, 2",500,958,2',
  ]),
};
