import { sql } from 'drizzle-orm';
import type { Database } from '../db/connection';
import { product, rawProduct } from '../db/schema';
import { readCsv } from './csv';
import { insertInBatches } from './insert-in-batches';

const FILE = 'Product.csv';
const HEADER = ['Reference', 'ABCCOD', 'Sector'];

export interface ProductSummary {
  references: number;
}

/** Product → tabela bruta (fiel ao CSV) e tabela normalizada (setor sem espaços). */
export async function loadProduct(tx: Database, dataDir: string): Promise<ProductSummary> {
  const rows = await readCsv(dataDir, FILE, ';', HEADER);

  const raw: (typeof rawProduct.$inferInsert)[] = [];
  const clean: (typeof product.$inferInsert)[] = [];
  const seenReferences = new Set<string>();

  for (const { sourceLine, fields } of rows) {
    const [reference, abccod, sector] = fields;
    raw.push({ sourceLine, reference, abccod, sector });

    const [referenceT, abccodT, sectorT] = fields.map((field) => field.trim());
    if (seenReferences.has(referenceT)) {
      throw new Error(`${FILE}, linha ${sourceLine}: referência repetida "${referenceT}"`);
    }
    seenReferences.add(referenceT);
    clean.push({ reference: referenceT, sourceLine, abccod: abccodT, sector: sectorT });
  }

  await tx.execute(sql`truncate table ${rawProduct}, ${product}`);
  await insertInBatches(tx, rawProduct, raw);
  await insertInBatches(tx, product, clean);

  return { references: clean.length };
}
