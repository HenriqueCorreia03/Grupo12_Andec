import { sql, type SQL } from 'drizzle-orm';
import { pickingWave } from '../db/schema';

/**
 * Paragens por (referência, localização): uma paragem é um trio distinto (referência, onda, localização)
 * (spec, "Critérios de prioridade"), por isso as paragens de uma referência numa localização são o nº de
 * ondas distintas em que lá é recolhida. As localizações não mapeadas (por exemplo, o RC-01) entram como
 * qualquer outra e o RC-01 conta como 1 localização.
 *
 * Lê `picking_wave`: a tabela, ou um CTE com esse nome (por exemplo, `pickingFiltrado(filtros)`).
 * Colunas: referencia, localizacao, paragens, unidades (unidades recolhidas: cada linha do PW é 1 un.).
 * Usado pelo impacto (a) da matriz (ticket 12) e pelo ranking de prioridade dos artigos (ticket 10).
 */
export function paragensPorReferenciaELocalizacao(): SQL {
  return sql`
    select
      ${pickingWave.reference} as referencia,
      ${pickingWave.location} as localizacao,
      count(distinct ${pickingWave.waveNumber})::int as paragens,
      sum(${pickingWave.quantity})::int as unidades
    from ${pickingWave}
    group by ${pickingWave.reference}, ${pickingWave.location}
  `;
}
