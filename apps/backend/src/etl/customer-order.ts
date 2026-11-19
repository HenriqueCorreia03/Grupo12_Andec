import { sql } from 'drizzle-orm';
import type { Database } from '../db/connection';
import { customerOrder, rawCustomerOrder } from '../db/schema';
import { readCsv } from './csv';
import { insertInBatches } from './insert-in-batches';
import { normalizeSize, parseCreationDate, parseInteger } from './normalize';

const FILE = 'Customer_Order.csv';
const HEADER = [
  'codCustomer',
  'orderNumber',
  'orderToCollect',
  'Reference',
  'Size (US)',
  'quantity (units)',
  'creationDate',
  'waveNumber',
  'operator',
];

export interface CustomerOrderSummary {
  lines: number;
  duplicateLines: number;
  zeroLines: number;
}

/** Customer_Order → tabela bruta (fiel ao CSV) e tabela normalizada. */
export async function loadCustomerOrder(tx: Database, dataDir: string): Promise<CustomerOrderSummary> {
  const rows = await readCsv(dataDir, FILE, ';', HEADER);

  const raw: (typeof rawCustomerOrder.$inferInsert)[] = [];
  const clean: (typeof customerOrder.$inferInsert)[] = [];
  const seenLines = new Set<string>();

  for (const { sourceLine, fields } of rows) {
    const [codCustomer, orderNumber, orderToCollect, reference, size, quantity, creationDate, waveNumber, operator] =
      fields;
    raw.push({ sourceLine, codCustomer, orderNumber, orderToCollect, reference, size, quantity, creationDate, waveNumber, operator });

    const trimmed = fields.map((field) => field.trim());
    const [customerT, orderNumberT, orderToCollectT, referenceT, sizeT, quantityT, creationDateT, waveNumberT, operatorT] =
      trimmed;
    try {
      const lineKey = trimmed.join('\u0000');
      const isDuplicate = seenLines.has(lineKey);
      seenLines.add(lineKey);
      const units = parseInteger(quantityT, 'quantidade');
      const normalizedSize = normalizeSize(sizeT);
      clean.push({
        sourceLine,
        customer: customerT,
        orderNumber: orderNumberT,
        orderToCollect: parseInteger(orderToCollectT, 'orderToCollect'),
        reference: referenceT,
        size: normalizedSize.size,
        sizeScaleUnconfirmed: normalizedSize.scaleUnconfirmed,
        sizeOutOfKnownScales: normalizedSize.outOfKnownScales,
        quantity: units,
        createdAt: parseCreationDate(creationDateT),
        waveNumber: waveNumberT,
        operator: operatorT,
        isDuplicate,
        isZero: units === 0,
      });
    } catch (error) {
      throw new Error(`${FILE}, linha ${sourceLine}: ${(error as Error).message}`);
    }
  }

  await tx.execute(sql`truncate table ${rawCustomerOrder}, ${customerOrder} restart identity`);
  await insertInBatches(tx, rawCustomerOrder, raw);
  await insertInBatches(tx, customerOrder, clean);

  return {
    lines: clean.length,
    duplicateLines: clean.filter((row) => row.isDuplicate).length,
    zeroLines: clean.filter((row) => row.isZero).length,
  };
}
