import type { FixtureFiles } from '../support/fixture-files';

/**
 * Fixture 4 (spec, "Testing Decisions"): casos difíceis (dados inventados).
 * - Referências D1–D4 com setor "PF      " (com espaços); cliente com espaços à direita.
 * - Storage_Location só com K-01-01.
 * - Ondas: W10 e W12 em 02/02/2023 10:00; W11 em 06/03/2023 09:00 (sem picking).
 * - Operator_1 nas ondas W10 e W12; Operator_12 (só no CO) na W11.
 *
 * Linhas do CO (L1–L9, pela ordem do ficheiro):
 * L1 P1 D1 105 2 W10 | L2 = L1 (duplicado real) | L3 P1 D2 9 0 W10 (linha a zero)
 * L4 P2 D3 vazio 1 W10 | L5 P2 D1 105 2 W10 | L6 P3 D2 9 0 W10 (pedido só com zeros)
 * L7 P4 D2 8 3 W11 | L8 P5 D4 7 1 W10 | L9 P5 D4 7 1 W12 (pedido dividido)
 */
const crlf = (lines: string[]) => '﻿' + lines.join('\r\n') + '\r\n';
const CLIENTE = 'C0000099            ';
const CO = (pedido: string, ordem: number, ref: string, tam: string, qtd: number, data: string, onda: string, op: string) =>
  `${CLIENTE};${pedido};${ordem};${ref};${tam};${qtd};${data};${onda};${op}`;
const FEV = '02/02/2023 10:00';
const MAR = '06/03/2023 09:00';
const PW = (onda: string, ref: string, tam: string, loc: string, op: string) => `${onda};${ref};${tam};1;${loc};${op}`;

export const fixture4: FixtureFiles = {
  'Customer_Order.csv': crlf([
    'codCustomer;orderNumber;orderToCollect;Reference;Size (US);quantity (units);creationDate;waveNumber;operator',
    CO('P1', 1, 'D1', '105', 2, FEV, 'W10', 'Operator_1'),
    CO('P1', 1, 'D1', '105', 2, FEV, 'W10', 'Operator_1'),
    CO('P1', 2, 'D2', '9', 0, FEV, 'W10', 'Operator_1'),
    CO('P2', 1, 'D3', '', 1, FEV, 'W10', 'Operator_1'),
    CO('P2', 2, 'D1', '105', 2, FEV, 'W10', 'Operator_1'),
    CO('P3', 1, 'D2', '9', 0, FEV, 'W10', 'Operator_1'),
    CO('P4', 1, 'D2', '8', 3, MAR, 'W11', 'Operator_12'),
    CO('P5', 1, 'D4', '7', 1, FEV, 'W10', 'Operator_1'),
    CO('P5', 2, 'D4', '7', 1, FEV, 'W12', 'Operator_1'),
  ]),
  'Picking_Wave.csv': crlf([
    'waveNumber;reference;Size (US);quantityToPick (units);locations;operator',
    PW('W10', 'D1', '10.5', 'K-01-01     ', 'Operator_1'),
    PW('W10', 'D1', '10.5', 'K-01-01     ', 'Operator_1'),
    PW('W10', 'D1', '10.5', 'K-01-01     ', 'Operator_1'),
    PW('W10', 'D1', '10.5', 'RC-01     ', 'Operator_2'),
    PW('W10', 'D4', '7.0', 'K-01-01     ', 'Operator_1'),
    PW('W12', 'D4', '7.0', 'K-01-01     ', 'Operator_1'),
  ]),
  'Product.csv': crlf([
    'Reference;ABCCOD;Sector',
    'D1;A;PF      ',
    'D2;B;PF      ',
    'D3;C;PF      ',
    'D4;C;PF      ',
  ]),
  'Storage_Location.csv': ['originalLocation,position,x,y,z', 'K-01-01,"100, 200, 1",100,200,1'].join('\n') + '\n',
};
