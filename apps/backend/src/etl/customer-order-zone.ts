import { sql } from 'drizzle-orm';
import type { Database } from '../db/connection';
import { customerOrder, customerOrderZone, pickingWave, storageLocation } from '../db/schema';

/** Valores de `zone` que não são uma zona do armazém (têm hífen, por isso nunca colidem com um prefixo de zona). */
export const ZONA_NAO_MAPEADA = 'nao-mapeada';
export const ZONA_SEM_ZONA = 'sem-zona';

export interface CustomerOrderZoneSummary {
  rows: number;
}

/**
 * Ligação CO ↔ PW (spec, "Ligação CO ↔ PW"): a zona das unidades encomendadas, calculada uma vez no ETL.
 *
 * Chave = onda + referência + tamanho normalizado. Para cada chave, o recolhido em cada zona reparte-se pelas
 * linhas do CO da chave proporcionalmente às unidades encomendadas. A parte encomendada e não recolhida (falta de
 * picking) fica "sem zona"; as linhas sem chave (tamanho vazio, referência nunca recolhida, onda sem picking)
 * ficam inteiras "sem zona". As unidades em localizações não mapeadas ficam "nao-mapeada".
 *
 * Só tem linhas com quantidade > 0, com unidades fracionárias (arredondar só na apresentação).
 * Usa sempre o CO completo: a repartição não depende dos filtros.
 */
function calcularAtribuicao() {
  return sql`
    with chaves as (
      select wave_number, reference, size, sum(quantity)::float8 as encomendado
      from ${customerOrder}
      where quantity > 0 and size is not null
      group by wave_number, reference, size
    ),
    recolhido as (
      select
        p.wave_number,
        p.reference,
        p.size,
        case when s.location is not null then split_part(p.location, '-', 1) else ${ZONA_NAO_MAPEADA} end as zona,
        sum(p.quantity)::float8 as unidades
      from ${pickingWave} p
      left join ${storageLocation} s on s.location = p.location
      where p.size is not null
      group by p.wave_number, p.reference, p.size, 4
    ),
    recolhido_total as (
      select wave_number, reference, size, sum(unidades) as total
      from recolhido
      group by wave_number, reference, size
    )
    select l.id, r.zona, l.quantity * r.unidades / k.encomendado as unidades
    from ${customerOrder} l
    join chaves k on k.wave_number = l.wave_number and k.reference = l.reference and k.size = l.size
    join recolhido r on r.wave_number = l.wave_number and r.reference = l.reference and r.size = l.size
    where l.quantity > 0
    union all
    select l.id, ${ZONA_SEM_ZONA} as zona, l.quantity * (1 - coalesce(t.total, 0) / k.encomendado) as unidades
    from ${customerOrder} l
    left join chaves k on k.wave_number = l.wave_number and k.reference = l.reference and k.size = l.size
    left join recolhido_total t on t.wave_number = l.wave_number and t.reference = l.reference and t.size = l.size
    where l.quantity > 0 and k.encomendado is not null
    union all
    select l.id, ${ZONA_SEM_ZONA} as zona, l.quantity::float8 as unidades
    from ${customerOrder} l
    where l.quantity > 0 and l.size is null
  `;
}

/** Tem de correr depois de carregar o CO, o PW e o Storage_Location (na mesma transação). */
export async function loadCustomerOrderZone(tx: Database): Promise<CustomerOrderZoneSummary> {
  await tx.execute(sql`truncate table ${customerOrderZone}`);
  const result = await tx.execute(sql`
    insert into ${customerOrderZone} (line_id, zone, units)
    select a.id, a.zona, sum(a.unidades) from (${calcularAtribuicao()}) a group by a.id, a.zona
  `);
  return { rows: result.rowCount ?? 0 };
}
