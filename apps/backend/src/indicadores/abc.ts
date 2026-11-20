import { sql, type SQL } from 'drizzle-orm';
import { customerOrder } from '../db/schema';

export type ClasseAbc = 'A' | 'B' | 'C';
export const CLASSES_ABC: ClasseAbc[] = ['A', 'B', 'C'];

/**
 * ABC global (período completo), uma linha por referência com procura:
 * (referencia, unidades, unidades_antes, total, acumulado_antes, classe).
 *
 * Regras (spec, "Indicadores mínimos"):
 * - unidades das linhas > 0 (só existem em pedidos válidos), com os duplicados;
 * - ordem: unidades decrescentes; empate pelo código da referência, por ordem de caracteres (COLLATE "C");
 * - A se o acumulado antes < 80 %, B se < 95 %, C no resto (comparações em inteiros, sem arredondamentos).
 *
 * Para usar dentro de outra consulta: `with abc as (${abcGlobal()}) select ...`.
 * O filtro de classe (ticket 06a) usa esta classe global.
 */
export function abcGlobal(): SQL {
  return sql`
    with por_referencia as (
      select ${customerOrder.reference} as referencia, sum(${customerOrder.quantity})::bigint as unidades
      from ${customerOrder}
      where ${customerOrder.quantity} > 0
      group by ${customerOrder.reference}
    ),
    ordenado as (
      select
        referencia,
        unidades,
        coalesce(sum(unidades) over (
          order by unidades desc, referencia collate "C"
          rows between unbounded preceding and 1 preceding
        ), 0)::bigint as unidades_antes,
        sum(unidades) over ()::bigint as total,
        row_number() over (order by unidades desc, referencia collate "C") as posicao
      from por_referencia
    )
    select
      referencia,
      unidades::int as unidades,
      posicao::int as posicao,
      unidades_antes::float8 * 100 / total as acumulado_antes,
      case
        when unidades_antes * 100 < total * 80 then 'A'
        when unidades_antes * 100 < total * 95 then 'B'
        else 'C'
      end as classe
    from ordenado
  `;
}
