import { crlf, type FixtureFiles, lf } from '../support/fixture-files';

/**
 * Fixture da matriz (ticket 12; dados inventados): desempates do ranking de localizações e limiar exato.
 *
 * ABC (CO): R1 = 6 un., R2 = 6 un. (empate, ganha R1 pelo código), R3 = 1 un. → R1 A (antes 0 %),
 * R2 A (antes 46,15 %), R3 B (antes 92,31 %). Localizações mapeadas: K-01-01 a K-01-04; RC-01 não mapeada.
 *
 * Paragens dos artigos A (trios referência, onda, localização) e ranking:
 * - R1 (5 paragens): K-01-01 (2 paragens, 2 un.), RC-01 (1, 2 un.: ganha pelas unidades), K-01-02 (1, 1 un.:
 *   ganha à K-01-03 pelo código), K-01-03 (1, 1 un.) → fora das 3 mais usadas: 1 (K-01-03).
 * - R2 (5 paragens, todas na W2 com 1 un.): por código K-01-01, K-01-02, K-01-03, K-01-04, RC-01
 *   → fora das 3 mais usadas: 2 (K-01-04 e RC-01).
 * Impacto (a) = 3 de 10 = 30 % exatos → nota 3 e "colada ao limiar dos 30 %". RC-01 nas 3 mais usadas: 1 (R1).
 * Sensibilidade: fora da mais usada (3 + 4) de 10 = 70 %; fora das 5 mais usadas 0 %.
 * As paragens do R3 (classe B) não contam.
 *
 * Robustez (a): 9 de 12 un. recolhidas em mapeadas (3 no RC-01) = 75 %.
 * Robustez (b): 4 de 5 linhas do CO com correspondência (R2 tamanho 9 na W1 nunca foi recolhido) = 80 %.
 * Impacto (b): nenhum pedido dividido → 0 de 3.
 */
const CO = (pedido: string, ref: string, tam: string, qtd: number, onda: string) =>
  `C0000001            ;${pedido};1;${ref};${tam};${qtd};15/05/2023 08:00;${onda};Operator_1`;
const PW = (onda: string, ref: string, loc: string) => `${onda};${ref};8.0;1;${loc};Operator_1`;

export const fixtureMatriz: FixtureFiles = {
  'Customer_Order.csv': crlf([
    'codCustomer;orderNumber;orderToCollect;Reference;Size (US);quantity (units);creationDate;waveNumber;operator',
    CO('P1', 'R1', '8', 4, 'W1'),
    CO('P2', 'R1', '8', 2, 'W2'),
    CO('P2', 'R2', '8', 5, 'W2'),
    CO('P3', 'R3', '8', 1, 'W1'),
    CO('P3', 'R2', '9', 1, 'W1'),
  ]),
  'Picking_Wave.csv': crlf([
    'waveNumber;reference;Size (US);quantityToPick (units);locations;operator',
    PW('W1', 'R1', 'K-01-01'),
    PW('W1', 'R1', 'RC-01'),
    PW('W1', 'R1', 'RC-01'),
    PW('W1', 'R1', 'K-01-02'),
    PW('W2', 'R1', 'K-01-01'),
    PW('W2', 'R1', 'K-01-03'),
    PW('W2', 'R2', 'K-01-01'),
    PW('W2', 'R2', 'K-01-02'),
    PW('W2', 'R2', 'K-01-03'),
    PW('W2', 'R2', 'K-01-04'),
    PW('W2', 'R2', 'RC-01'),
    PW('W1', 'R3', 'K-01-03'),
  ]),
  'Product.csv': crlf(['Reference;ABCCOD;Sector', 'R1;A;PF', 'R2;A;PF', 'R3;B;PF']),
  'Storage_Location.csv': lf([
    'originalLocation,position,x,y,z',
    'K-01-01,"1, 1, 1",1,1,1',
    'K-01-02,"1, 2, 1",1,2,1',
    'K-01-03,"1, 3, 1",1,3,1',
    'K-01-04,"1, 4, 1",1,4,1',
  ]),
};
