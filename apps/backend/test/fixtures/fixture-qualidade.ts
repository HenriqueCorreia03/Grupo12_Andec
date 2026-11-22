import { crlf, type FixtureFiles, lf } from '../support/fixture-files';

/**
 * Fixture da qualidade (ticket 13; dados inventados), para o que a fixture 4 não cobre.
 * Localizações mapeadas: K-01-01 (zona K) e L-01-01 (zona L). RC-01 e ZN-COR não mapeadas.
 *
 * CO (onda W20, 10/04/2023 09:00):
 * - P1: E1 tamanho 8, 2 un. → recolhida 1 un. em K-01-01 e 1 un. em L-01-01: ligação repartida por 2 zonas.
 * - P2: E2 tamanho 245 (escala 215–305, "por confirmar"), 3 un. → 2 un. no ZN-COR e 1 un. no RC-01 (só não mapeadas).
 * - P3: E3 tamanho 9, 1 un. → referência nunca recolhida: sem correspondência no PW.
 *
 * Esperado: ligações repartidas 1 de 2 linhas ligadas = 50 %; não mapeadas RC-01 (1 un.) primeiro, mesmo com o
 * ZN-COR a ter mais unidades (2 un.); escala 215–305: 1 linha no CO e 3 no PW; encomendado 6 − recolhido 5 = 1
 * = 0 (ondas sem picking) + 1 (E3) + 0.
 */
const CO = (pedido: string, ref: string, tam: string, qtd: number) =>
  `C0000002            ;${pedido};1;${ref};${tam};${qtd};10/04/2023 09:00;W20;Operator_3`;
const PW = (ref: string, tam: string, loc: string) => `W20;${ref};${tam};1;${loc};Operator_3`;

export const fixtureQualidade: FixtureFiles = {
  'Customer_Order.csv': crlf([
    'codCustomer;orderNumber;orderToCollect;Reference;Size (US);quantity (units);creationDate;waveNumber;operator',
    CO('P1', 'E1', '8', 2),
    CO('P2', 'E2', '245', 3),
    CO('P3', 'E3', '9', 1),
  ]),
  'Picking_Wave.csv': crlf([
    'waveNumber;reference;Size (US);quantityToPick (units);locations;operator',
    PW('E1', '8.0', 'K-01-01'),
    PW('E1', '8.0', 'L-01-01'),
    PW('E2', '245', 'ZN-COR'),
    PW('E2', '245', 'ZN-COR'),
    PW('E2', '245', 'RC-01'),
  ]),
  'Product.csv': crlf(['Reference;ABCCOD;Sector', 'E1;A;PF', 'E2;B;PF', 'E3;C;PF']),
  'Storage_Location.csv': lf([
    'originalLocation,position,x,y,z',
    'K-01-01,"1, 1, 1",1,1,1',
    'L-01-01,"2, 1, 1",2,1,1',
  ]),
};
