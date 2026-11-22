import { sql } from 'drizzle-orm';
import type { Database } from '../db/connection';
import { pickingWave, rawPickingWave } from '../db/schema';
import { readCsv } from './csv';
import { insertInBatches } from './insert-in-batches';
import { normalizeSize, parseInteger } from './normalize';

const FILE = 'Picking_Wave.csv';
const HEADER = ['waveNumber', 'reference', 'Size (US)', 'quantityToPick (units)', 'locations', 'operator'];

export interface PickingWaveSummary {
  lines: number;
}

/** Picking_Wave → tabela bruta (fiel ao CSV) e tabela normalizada (localização sem espaços). */
export async function loadPickingWave(tx: Database, dataDir: string): Promise<PickingWaveSummary> {
  const rows = await readCsv(dataDir, FILE, ';', HEADER);

  const raw: (typeof rawPickingWave.$inferInsert)[] = [];
  const clean: (typeof pickingWave.$inferInsert)[] = [];

  for (const { sourceLine, fields } of rows) {
    const [waveNumber, reference, size, quantity, location, operator] = fields;
    raw.push({ sourceLine, waveNumber, reference, size, quantity, location, operator });

    const [waveT, referenceT, sizeT, quantityT, locationT, operatorT] = fields.map((field) => field.trim());
    try {
      clean.push({
        sourceLine,
        waveNumber: waveT,
        reference: referenceT,
        size: normalizeSize(sizeT).size,
        quantity: parseInteger(quantityT, 'quantidade'),
        location: locationT,
        operator: operatorT,
      });
    } catch (error) {
      throw new Error(`${FILE}, linha ${sourceLine}: ${(error as Error).message}`);
    }
  }

  await tx.execute(sql`truncate table ${rawPickingWave}, ${pickingWave} restart identity`);
  await insertInBatches(tx, rawPickingWave, raw);
  await insertInBatches(tx, pickingWave, clean);

  return { lines: clean.length };
}
