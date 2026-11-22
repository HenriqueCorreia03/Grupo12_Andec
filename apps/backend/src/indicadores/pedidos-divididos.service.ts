import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../db/database.module';
import { customerOrder } from '../db/schema';
import type { Metadados } from './metadados';

/** Limiar da onda de 24 un.: acima dele a divisão é inevitável (spec, "Pedidos divididos"). */
const LIMITE_UNIDADES = 24;

export interface PedidosDivididos extends Metadados {
  /** % de pedidos válidos presentes em mais de uma onda; nulo quando não há pedidos válidos ("sem dados"). */
  valor: number | null;
  pedidosDivididos: number;
  pedidosValidos: number;
  /** Divididos com mais de 24 un. no pedido completo (divisão inevitável). */
  divididosMaisDe24: number;
  /** Divididos com 24 un. ou menos no pedido completo (divisão evitável). */
  divididosAte24: number;
  /** % dos pedidos válidos que são divididos com ≤ 24 un.; nulo sem pedidos válidos. */
  percentagemAte24: number | null;
}

export interface OndasEPedidos {
  pedidosDivididos: PedidosDivididos;
}

@Injectable()
export class PedidosDivididosService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async ondasEPedidos(): Promise<OndasEPedidos> {
    return { pedidosDivididos: await this.pedidosDivididos() };
  }

  private async pedidosDivididos(): Promise<PedidosDivididos> {
    const { rows } = await this.db.execute<{
      validos: number;
      divididos: number;
      divididos_mais_de_24: number;
      divididos_ate_24: number;
      linhas_positivas: number;
      linhas_zero: number;
      pedidos_zero: number;
    }>(sql`
      with pedidos as (
        select
          count(distinct ${customerOrder.waveNumber}) filter (where ${customerOrder.quantity} > 0) as ondas,
          sum(${customerOrder.quantity}) as unidades,
          count(*) filter (where ${customerOrder.quantity} > 0) as linhas_positivas,
          count(*) filter (where ${customerOrder.quantity} = 0) as linhas_zero
        from ${customerOrder}
        group by ${customerOrder.orderNumber}
      )
      select
        (count(*) filter (where unidades > 0))::int as validos,
        (count(*) filter (where unidades > 0 and ondas > 1))::int as divididos,
        (count(*) filter (where unidades > 0 and ondas > 1 and unidades > ${LIMITE_UNIDADES}))::int as divididos_mais_de_24,
        (count(*) filter (where unidades > 0 and ondas > 1 and unidades <= ${LIMITE_UNIDADES}))::int as divididos_ate_24,
        coalesce(sum(linhas_positivas), 0)::int as linhas_positivas,
        coalesce(sum(linhas_zero), 0)::int as linhas_zero,
        (count(*) filter (where unidades = 0))::int as pedidos_zero
      from pedidos
    `);
    const [r] = rows;
    return {
      valor: r.validos === 0 ? null : (r.divididos * 100) / r.validos,
      pedidosDivididos: r.divididos,
      pedidosValidos: r.validos,
      divididosMaisDe24: r.divididos_mais_de_24,
      divididosAte24: r.divididos_ate_24,
      percentagemAte24: r.validos === 0 ? null : (r.divididos_ate_24 * 100) / r.validos,
      definicao:
        'Pedidos válidos (total > 0 un.) com linhas > 0 em mais de uma onda ÷ pedidos válidos × 100. ' +
        `Separa os divididos com mais de ${LIMITE_UNIDADES} un. (inevitáveis) dos de ${LIMITE_UNIDADES} un. ou menos (evitáveis); ` +
        'as unidades são as do pedido completo, somadas em todas as ondas.',
      fonte: 'Customer_Order',
      linhasConsideradas: r.linhas_positivas,
      exclusoes: [
        { motivo: 'pedidos com 0 un.', quantidade: r.pedidos_zero },
        { motivo: 'linhas com 0 un.', quantidade: r.linhas_zero },
      ],
    };
  }
}
