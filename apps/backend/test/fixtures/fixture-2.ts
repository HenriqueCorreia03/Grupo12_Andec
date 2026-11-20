import { crlf, type FixtureFiles, lf } from '../support/fixture-files';

/**
 * Fixture 2 (spec, "Testing Decisions"): ABC sintético com 2.º setor (dados inventados).
 * SYN01–SYN03 no setor PF; SYN04–SYN06 no setor SX (só nesta fixture).
 * Unidades: SYN01 50, SYN02 25, SYN03 10, SYN04 10, SYN05 4, SYN06 1 (total 100).
 * Pedidos: P-A (onda W-A) = SYN01 50; P-B (W-B) = SYN02 25 + SYN04 10;
 * P-C (W-B) = SYN03 10 + SYN05 4 + SYN06 1. Mesma data, mesmo tamanho. PW só com o cabeçalho.
 */
const CO = (pedido: string, ordem: number, ref: string, qtd: number, onda: string) =>
  `C0000001;${pedido};${ordem};${ref};9;${qtd};10/01/2023 10:00;${onda};Operator_1`;

export const fixture2: FixtureFiles = {
  'Customer_Order.csv': crlf([
    'codCustomer;orderNumber;orderToCollect;Reference;Size (US);quantity (units);creationDate;waveNumber;operator',
    CO('P-A', 1, 'SYN01', 50, 'W-A'),
    CO('P-B', 1, 'SYN02', 25, 'W-B'),
    CO('P-B', 2, 'SYN04', 10, 'W-B'),
    CO('P-C', 1, 'SYN03', 10, 'W-B'),
    CO('P-C', 2, 'SYN05', 4, 'W-B'),
    CO('P-C', 3, 'SYN06', 1, 'W-B'),
  ]),
  'Picking_Wave.csv': crlf(['waveNumber;reference;Size (US);quantityToPick (units);locations;operator']),
  'Product.csv': crlf([
    'Reference;ABCCOD;Sector',
    'SYN01;A;PF',
    'SYN02;A;PF',
    'SYN03;B;PF',
    'SYN04;B;SX',
    'SYN05;C;SX',
    'SYN06;C;SX',
  ]),
  'Storage_Location.csv': lf(['originalLocation,position,x,y,z']),
};
