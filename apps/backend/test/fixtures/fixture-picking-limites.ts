import { crlf, type FixtureFiles, lf } from '../support/fixture-files';

/**
 * Fixture sintética do ticket 04 (dados inventados), só para os casos-limite do picking.
 * Cada linha do PW vale 1 un.
 *
 * Ondas do PW:
 * - WA: 12 un. em L-01-01 + 12 un. em L-01-02 = 24 un. (exatamente a capacidade), 2 localizações
 * - WB: 25 un. em "L-01-01   " (com espaços: é a mesma localização que L-01-01), 1 localização
 * - WC: 30 un. em X-99-99 (não mapeada), 1 localização
 * - WD: 1 un. em L-01-01, sem pedidos no CO (data e hora nulas)
 *
 * CO: a WA tem dois pedidos (10/01/2023 08:00 e 10:30): a hora da onda é a mais antiga (08:00).
 *
 * Esperado (à mão): unidades 24, 25, 30 e 1 (média 20; ocupação média 83,3333 %); 1 onda com 24 (25 %),
 * 2 com > 24; mínimo 1, máximo 30; paragens 2 + 1 + 1 + 1 = 5; localizações por onda 2, 1, 1, 1
 * (média 1,25; mediana 1); zona L = 12 + 12 + 25 + 1 = 50 un. (100 % das mapeadas);
 * não mapeadas = X-99-99 com 30 un. = 30 ÷ 80 = 37,5 % do recolhido.
 */
const CABECALHO_CO =
  'codCustomer;orderNumber;orderToCollect;Reference;Size (US);quantity (units);creationDate;waveNumber;operator';
const CO = (pedido: string, data: string, onda: string) => `C0000001;${pedido};1;R1;9;1;${data};${onda};Operator_1`;
const PW = (onda: string, localizacao: string, unidades: number) =>
  Array.from({ length: unidades }, () => `${onda};R1;9.0;1;${localizacao};Operator_1`);

export const fixturePickingLimites: FixtureFiles = {
  'Customer_Order.csv': crlf([
    CABECALHO_CO,
    CO('P1', '10/01/2023 10:30', 'WA'),
    CO('P2', '10/01/2023 08:00', 'WA'),
    CO('P3', '10/01/2023 09:00', 'WB'),
    CO('P4', '10/01/2023 09:00', 'WC'),
  ]),
  'Picking_Wave.csv': crlf([
    'waveNumber;reference;Size (US);quantityToPick (units);locations;operator',
    ...PW('WA', 'L-01-01     ', 12),
    ...PW('WA', 'L-01-02     ', 12),
    ...PW('WB', 'L-01-01   ', 25),
    ...PW('WC', 'X-99-99     ', 30),
    ...PW('WD', 'L-01-01     ', 1),
  ]),
  'Product.csv': crlf(['Reference;ABCCOD;Sector', 'R1;A;PF']),
  'Storage_Location.csv': lf([
    'originalLocation,position,x,y,z',
    'L-01-01,"100, 200, 1",100,200,1',
    'L-01-02,"100, 216, 1",100,216,1',
  ]),
};
