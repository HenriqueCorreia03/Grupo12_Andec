import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { customerOrder, rawCustomerOrder } from '../db/schema';
import { readCsv } from './csv';
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
const BATCH = 1000;

export interface CustomerOrderSummary {
  lines: number;
  duplicateLines: number;
  zeroLines: number;
}

type RawRow = typeof rawCustomerOrder.$inferInsert;
type CleanRow = typeof customerOrder.$inferInsert;

export async function loadCustomerOrder(
  tx: NodePgDatabase,
  dataDir: string,
): Promise<CustomerOrderSummary> {
  const csv = await readCsv(dataDir, FILE, ';', HEADER);

  const raw: RawRow[] = [];
  const clean: CleanRow[] = [];
  const seen = new Set<string>();
  let duplicateLines = 0;
  let zeroLines = 0;

  for (const { sourceLine, fields } of csv.rows) {
    const [codCustomer, orderNumber, orderToCollect, reference, size, quantity, creationDate, waveNumber, operator] =
      fields;
    raw.push({ sourceLine, codCustomer, orderNumber, orderToCollect, reference, size, quantity, creationDate, waveNumber, operator });

    const t = fields.map((f) => f.trim());
    try {
      const key = t.join('\u0000');
      const isDuplicate = seen.has(key);
      seen.add(key);
      const qty = parseInteger(t[5], 'quantidade');
      const normalized = normalizeSize(t[4]);
      if (isDuplicate) duplicateLines++;
      if (qty === 0) zeroLines++;
      clean.push({
        sourceLine,
        customer: t[0],
        orderNumber: t[1],
        orderToCollect: parseInteger(t[2], 'orderToCollect'),
        reference: t[3],
        size: normalized.size,
        sizeScaleUnconfirmed: normalized.scaleUnconfirmed,
        quantity: qty,
        createdAt: parseCreationDate(t[6]),
        waveNumber: t[7],
        operator: t[8],
        isDuplicate,
        isZero: qty === 0,
      });
    } catch (e) {
      throw new Error(`${FILE}, linha ${sourceLine}: ${(e as Error).message}`);
    }
  }

  await tx.execute(sql`truncate table ${rawCustomerOrder}, ${customerOrder} restart identity`);
  for (let i = 0; i < raw.length; i += BATCH) {
    await tx.insert(rawCustomerOrder).values(raw.slice(i, i + BATCH));
  }
  for (let i = 0; i < clean.length; i += BATCH) {
    await tx.insert(customerOrder).values(clean.slice(i, i + BATCH));
  }

  return { lines: clean.length, duplicateLines, zeroLines };
}
