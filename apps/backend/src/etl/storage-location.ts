import { sql } from 'drizzle-orm';
import type { Database } from '../db/connection';
import { rawStorageLocation, storageLocation } from '../db/schema';
import { readCsv } from './csv';
import { insertInBatches } from './insert-in-batches';
import { parseInteger } from './normalize';

const FILE = 'Storage_Location.csv';
const HEADER = ['originalLocation', 'position', 'x', 'y', 'z'];

export interface StorageLocationSummary {
  locations: number;
}

/** Storage_Location (separador `,`, com campos entre aspas) → tabela bruta e localizações mapeadas. */
export async function loadStorageLocation(tx: Database, dataDir: string): Promise<StorageLocationSummary> {
  const rows = await readCsv(dataDir, FILE, ',', HEADER);

  const raw: (typeof rawStorageLocation.$inferInsert)[] = [];
  const clean: (typeof storageLocation.$inferInsert)[] = [];
  const seen = new Set<string>();

  for (const { sourceLine, fields } of rows) {
    const [originalLocation, position, x, y, z] = fields;
    raw.push({ sourceLine, originalLocation, position, x, y, z });

    const [locationT, positionT, xT, yT, zT] = fields.map((field) => field.trim());
    if (seen.has(locationT)) {
      throw new Error(`${FILE}, linha ${sourceLine}: localização repetida "${locationT}"`);
    }
    seen.add(locationT);
    try {
      clean.push({
        location: locationT,
        sourceLine,
        position: positionT,
        x: parseInteger(xT, 'x'),
        y: parseInteger(yT, 'y'),
        z: parseInteger(zT, 'z'),
      });
    } catch (error) {
      throw new Error(`${FILE}, linha ${sourceLine}: ${(error as Error).message}`);
    }
  }

  await tx.execute(sql`truncate table ${rawStorageLocation}, ${storageLocation}`);
  await insertInBatches(tx, rawStorageLocation, raw);
  await insertInBatches(tx, storageLocation, clean);

  return { locations: clean.length };
}
