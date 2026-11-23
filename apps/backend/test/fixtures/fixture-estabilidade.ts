import { crlf, type FixtureFiles, lf } from '../support/fixture-files';

/**
 * Fixture da estabilidade do ABC (ticket 10; dados inventados). Um pedido por referência e por mês.
 * Unidades: janeiro R1 80, R2 15, R3 5; fevereiro R1 20, R2 70, R3 10; março R1 60, R2 30, R3 10.
 * ABC mensal (A < 80 %, B < 95 %, C no resto, pelo acumulado antes):
 * - janeiro: R1 A (0 %), R2 B (80 %), R3 C (95 %) — R3 com 5 un. fica de fora (< 10 un.);
 * - fevereiro: R2 A (0 %), R1 A (70 %), R3 B (90 %);
 * - março: R1 A (0 %), R2 A (60 %), R3 B (90 %).
 * Janeiro → fevereiro: comparadas R1 e R2, muda R2 (B → A) → 50 %. Fevereiro → março: 3 comparadas, 0 mudam.
 * Total: 1 em 5 = 20 %. Combinações com unidades: 9; excluídas: 1 (11,11 %).
 * Sensibilidade (ticket 14), com "≥ limiar" para entrar nas comparações:
 * - 5 un.: nenhuma excluída (0 de 9). Jan → fev: 3 comparadas, mudam R2 (B → A) e R3 (C → B); fev → mar: 3, 0 mudam.
 *   Total: 2 em 6 = 33,33 %.
 * - 10 un.: como acima, 1 em 5 = 20 %; excluídas 1 de 9 (11,11 %).
 * - 20 un.: excluídas jan R2 (15), jan R3 (5), fev R3 (10) e mar R3 (10) = 4 de 9 (44,44 %); fev R1 tem 20 un. e entra.
 *   Jan → fev: só R1 (A → A); fev → mar: R1 e R2 (A → A). Total: 0 em 3 = 0 %.
 *   Só fevereiro e março: 2 comparadas, 0 mudam; combinações 6, excluídas 2 (fev R3, mar R3).
 */
const CO = (pedido: string, ref: string, qtd: number, data: string, onda: string) =>
  `C0000001;${pedido};1;${ref};9;${qtd};${data};${onda};Operator_1`;

export const fixtureEstabilidade: FixtureFiles = {
  'Customer_Order.csv': crlf([
    'codCustomer;orderNumber;orderToCollect;Reference;Size (US);quantity (units);creationDate;waveNumber;operator',
    CO('J1', 'R1', 80, '10/01/2023 10:00', 'WJ'),
    CO('J2', 'R2', 15, '10/01/2023 10:00', 'WJ'),
    CO('J3', 'R3', 5, '10/01/2023 10:00', 'WJ'),
    CO('F1', 'R1', 20, '10/02/2023 10:00', 'WF'),
    CO('F2', 'R2', 70, '10/02/2023 10:00', 'WF'),
    CO('F3', 'R3', 10, '10/02/2023 10:00', 'WF'),
    CO('M1', 'R1', 60, '10/03/2023 10:00', 'WM'),
    CO('M2', 'R2', 30, '10/03/2023 10:00', 'WM'),
    CO('M3', 'R3', 10, '10/03/2023 10:00', 'WM'),
  ]),
  'Picking_Wave.csv': crlf(['waveNumber;reference;Size (US);quantityToPick (units);locations;operator']),
  'Product.csv': crlf(['Reference;ABCCOD;Sector', 'R1;A;PF', 'R2;B;PF', 'R3;C;PF']),
  'Storage_Location.csv': lf(['originalLocation,position,x,y,z']),
};
