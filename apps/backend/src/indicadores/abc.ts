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
  return abcSobre(sql`${customerOrder}`);
}

/**
 * O mesmo ABC, calculado sobre outras linhas do CO (por exemplo, só as do período filtrado: "classe no período").
 * `origem` é o que vem depois do `from`; as colunas são as da tabela `customer_order`.
 */
export function abcSobre(origem: SQL): SQL {
  return abcPorGrupo(origem, sql`null::text`);
}

/**
 * ABC mensal independente (estabilidade do ABC): a mesma regra, aplicada às unidades de cada mês em separado.
 * Uma linha por (mes 'YYYY-MM', referência) com unidades no mês; as posições e classes são de cada mês.
 */
export function abcMensalSobre(origem: SQL): SQL {
  return abcPorGrupo(origem, sql`to_char(${customerOrder.createdAt}, 'YYYY-MM')`);
}

/** A regra do ABC, uma vez, com uma partição (`grupo`, devolvida como `mes`); `null` dá o ABC único do período. */
function abcPorGrupo(origem: SQL, grupo: SQL): SQL {
  return sql`
    with por_referencia as (
      select ${grupo} as mes, ${customerOrder.reference} as referencia, sum(${customerOrder.quantity})::bigint as unidades
      from ${origem}
      where ${customerOrder.quantity} > 0
      group by 1, 2
    ),
    ordenado as (
      select
        mes,
        referencia,
        unidades,
        coalesce(sum(unidades) over (
          partition by mes order by unidades desc, referencia collate "C"
          rows between unbounded preceding and 1 preceding
        ), 0)::bigint as unidades_antes,
        sum(unidades) over (partition by mes)::bigint as total,
        row_number() over (partition by mes order by unidades desc, referencia collate "C") as posicao
      from por_referencia
    )
    select
      mes,
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
