import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../db/database.module';

export interface TamanhoMedioEncomenda {
  /** Σ unidades ÷ nº de pedidos válidos; nulo quando não há pedidos ("sem dados"). */
  valor: number | null;
  mediana: number | null;
  p90: number | null;
  pedidosConsiderados: number;
  pedidosExcluidos: number;
  definicao: string;
  fonte: 'Customer_Order';
}

export interface VisaoGeral {
  tamanhoMedioEncomenda: TamanhoMedioEncomenda;
}

const DEFINICAO_TAMANHO_MEDIO =
  'Unidades encomendadas ÷ nº de pedidos válidos (pedidos com total > 0 un.). ' +
  'Mediana e p90 sobre o total de unidades de cada pedido válido (método contínuo). ' +
  'Pedidos com 0 un. ficam fora.';

@Injectable()
export class IndicadoresService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async visaoGeral(): Promise<VisaoGeral> {
    return { tamanhoMedioEncomenda: await this.tamanhoMedioEncomenda() };
  }

  private async tamanhoMedioEncomenda(): Promise<TamanhoMedioEncomenda> {
    const { rows } = await this.db.execute<{
      valor: number | null;
      mediana: number | null;
      p90: number | null;
      pedidos_considerados: number;
      pedidos_excluidos: number;
    }>(sql`
      with pedidos as (
        select order_number, sum(quantity) as unidades
        from customer_order
        group by order_number
      ),
      validos as (
        select unidades from pedidos where unidades > 0
      )
      select
        (select sum(unidades)::float8 / nullif(count(*), 0) from validos) as valor,
        (select percentile_cont(0.5) within group (order by unidades) from validos) as mediana,
        (select percentile_cont(0.9) within group (order by unidades) from validos) as p90,
        (select count(*)::int from validos) as pedidos_considerados,
        (select count(*)::int from pedidos where unidades = 0) as pedidos_excluidos
    `);
    const r = rows[0];
    return {
      valor: r.valor,
      mediana: r.mediana,
      p90: r.p90,
      pedidosConsiderados: r.pedidos_considerados,
      pedidosExcluidos: r.pedidos_excluidos,
      definicao: DEFINICAO_TAMANHO_MEDIO,
      fonte: 'Customer_Order',
    };
  }
}
