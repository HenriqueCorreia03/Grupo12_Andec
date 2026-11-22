import { sql, type SQL } from 'drizzle-orm';
import { customerOrderZone } from '../db/schema';

export { ZONA_NAO_MAPEADA, ZONA_SEM_ZONA } from '../etl/customer-order-zone';

/**
 * Ligação CO ↔ PW (spec, "Ligação CO ↔ PW"): (id da linha do CO, zona, unidades), já repartida pelo ETL.
 * Só tem linhas com quantidade > 0; usa sempre o CO completo, por isso não depende dos filtros.
 */
export function atribuicaoPorLinha(): SQL {
  return sql`select line_id as id, zone as zona, units as unidades from ${customerOrderZone}`;
}
