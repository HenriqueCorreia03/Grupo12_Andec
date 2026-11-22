import { sql } from 'drizzle-orm';
import type { Database } from '../db/connection';
import { customerOrder } from '../db/schema';

/**
 * Dia com atividade = dia com ≥ 1 pedido criado (domingos incluídos); vale também para o picking (data da onda).
 * Só o período conta: é a atividade da operação toda, por isso referência, zona, classe ou operador não mudam
 * os dias (decisão do ticket 08). Sem período, conta todo o histórico.
 */
export async function diasComAtividade(db: Database, periodo: { inicio: string | null; fim: string | null }): Promise<number> {
  const { rows } = await db.execute<{ dias: number }>(sql`
    select count(distinct ${customerOrder.createdAt}::date)::int as dias
    from ${customerOrder}
    where (${periodo.inicio}::date is null or ${customerOrder.createdAt} >= ${periodo.inicio}::date)
      and (${periodo.fim}::date is null or ${customerOrder.createdAt} < (${periodo.fim}::date + 1))
  `);
  return rows[0].dias;
}

/** valor ÷ dias com atividade; nulo sem valor ou sem dias. */
export function porDiaComAtividade(valor: number | null, dias: number): number | null {
  return valor === null || dias === 0 ? null : valor / dias;
}
