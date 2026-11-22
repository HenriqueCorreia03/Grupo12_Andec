import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../db/database.module';
import { customerOrder, pickingWave } from '../db/schema';
import { porDiaComAtividade } from './atividade';
import { type Filtros, linhasFiltradas, naoAplicaveis, pickingFiltrado, SEM_FILTROS } from './filtros';
import type { Exclusao } from './metadados';

export interface MesDaSerie {
  /** aaaa-mm */
  mes: string;
  /** Mês só em parte coberto pelos dados ou pelo período escolhido (no dataset real, sem filtro: janeiro e outubro). */
  parcial: boolean;
  /** Dias com ≥ 1 pedido criado no mês e no período (domingos incluídos); não dependem dos outros filtros. */
  diasComAtividade: number;
  /** Domingos entre os dias com atividade (assinalados na interface). */
  domingos: number;
  pedidos: number;
  unidades: number;
  /** Ondas do PW com recolhas, pela data da onda (a data dos seus pedidos). */
  ondasRecolhidas: number;
  /** Valores por dia com atividade; nulos num mês sem dias com atividade. */
  pedidosPorDia: number | null;
  unidadesPorDia: number | null;
  ondasRecolhidasPorDia: number | null;
  /** Unidades ÷ pedidos válidos do mês; nulo sem pedidos. */
  tamanhoMedio: number | null;
}

export interface SerieMensal {
  meses: MesDaSerie[];
  definicao: string;
  fonte: 'Customer_Order + Picking_Wave';
  nota: string;
  filtrosNaoAplicaveis: string[];
  linhasConsideradas: number;
  exclusoes: Exclusao[];
}

/**
 * Série mensal por dia com atividade (ticket 08; spec, "Comparação no tempo"). Sem filtro de período cobre
 * todos os meses dos dados (janeiro–outubro de 2023 no dataset real); com período, só os meses dentro dele
 * (spec: os filtros aplicam-se a todos os gráficos da página). Os outros filtros aplicam-se aos pedidos,
 * unidades e ondas; os dias com atividade são os da operação toda no período.
 */
@Injectable()
export class SerieMensalService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async serieMensal(filtros: Filtros = SEM_FILTROS): Promise<SerieMensal> {
    const [meses, encomendas, ondas, linhas] = await Promise.all([
      this.mesesComAtividade(filtros),
      this.encomendasPorMes(filtros),
      this.ondasPorMes(filtros),
      this.linhas(filtros),
    ]);
    return {
      meses: meses.map((m) => {
        const encomenda = encomendas.get(m.mes) ?? { pedidos: 0, unidades: 0 };
        const recolhidas = ondas.get(m.mes) ?? 0;
        const porDia = (valor: number) => porDiaComAtividade(valor, m.diasComAtividade);
        return {
          ...m,
          pedidos: encomenda.pedidos,
          unidades: encomenda.unidades,
          ondasRecolhidas: recolhidas,
          pedidosPorDia: porDia(encomenda.pedidos),
          unidadesPorDia: porDia(encomenda.unidades),
          ondasRecolhidasPorDia: porDia(recolhidas),
          tamanhoMedio: encomenda.pedidos === 0 ? null : encomenda.unidades / encomenda.pedidos,
        };
      }),
      definicao:
        'Pedidos válidos, unidades encomendadas e ondas recolhidas por mês, divididos pelos dias com atividade do mês ' +
        '(dia com ≥ 1 pedido criado, domingos incluídos), para comparar meses com números de dias diferentes.',
      fonte: 'Customer_Order + Picking_Wave',
      nota: 'Meses parciais (só em parte cobertos pelos dados ou pelo período escolhido) estão assinalados.',
      filtrosNaoAplicaveis: naoAplicaveis(filtros, 'CO'),
      linhasConsideradas: linhas.positivas,
      exclusoes: [{ motivo: 'linhas com 0 un.', quantidade: linhas.zero }],
    };
  }

  /**
   * Meses entre o primeiro e o último dia com atividade dentro do período (todo o histórico sem período),
   * com os dias com atividade de cada mês e se o mês está só em parte coberto.
   */
  private async mesesComAtividade(
    filtros: Filtros,
  ): Promise<Pick<MesDaSerie, 'mes' | 'parcial' | 'diasComAtividade' | 'domingos'>[]> {
    const { rows } = await this.db.execute<{ mes: string; parcial: boolean; dias: number; domingos: number }>(sql`
      with todos as (select distinct ${customerOrder.createdAt}::date as dia from ${customerOrder}),
      limites as (
        select
          greatest(min(dia), coalesce(${filtros.inicio}::date, min(dia))) as primeiro,
          least(max(dia), coalesce(${filtros.fim}::date, max(dia))) as ultimo
        from todos
      ),
      dias as (select dia from todos, limites where dia between primeiro and ultimo),
      meses as (
        select generate_series(date_trunc('month', primeiro), date_trunc('month', ultimo), interval '1 month')::date as mes
        from limites
        where primeiro <= ultimo
      )
      select
        to_char(m.mes, 'YYYY-MM') as mes,
        (m.mes < (select primeiro from limites) or (m.mes + interval '1 month' - interval '1 day')::date > (select ultimo from limites)) as parcial,
        count(d.dia)::int as dias,
        (count(d.dia) filter (where extract(isodow from d.dia) = 7))::int as domingos
      from meses m
      left join dias d on date_trunc('month', d.dia) = m.mes
      group by m.mes
      order by m.mes
    `);
    return rows.map((r) => ({ mes: r.mes, parcial: r.parcial, diasComAtividade: r.dias, domingos: r.domingos }));
  }

  private async linhas(filtros: Filtros): Promise<{ positivas: number; zero: number }> {
    const { rows } = await this.db.execute<{ positivas: number; zero: number }>(sql`
      with ${linhasFiltradas(filtros)}
      select
        (count(*) filter (where ${customerOrder.quantity} > 0))::int as positivas,
        (count(*) filter (where ${customerOrder.quantity} = 0))::int as zero
      from ${customerOrder}
    `);
    return rows[0];
  }

  private async encomendasPorMes(filtros: Filtros): Promise<Map<string, { pedidos: number; unidades: number }>> {
    const { rows } = await this.db.execute<{ mes: string; pedidos: number; unidades: number }>(sql`
      with ${linhasFiltradas(filtros)}
      select
        to_char(${customerOrder.createdAt}, 'YYYY-MM') as mes,
        count(distinct ${customerOrder.orderNumber})::int as pedidos,
        sum(${customerOrder.quantity})::float8 as unidades
      from ${customerOrder}
      where ${customerOrder.quantity} > 0
      group by 1
    `);
    return new Map(rows.map((r) => [r.mes, { pedidos: r.pedidos, unidades: r.unidades }]));
  }

  /** Ondas com recolhas no PW por mês da onda (a data da onda é a dos seus pedidos no CO). */
  private async ondasPorMes(filtros: Filtros): Promise<Map<string, number>> {
    const { rows } = await this.db.execute<{ mes: string; ondas: number }>(sql`
      with ${pickingFiltrado(filtros)},
      data_da_onda as (
        select ${customerOrder.waveNumber} as onda, to_char(min(${customerOrder.createdAt}), 'YYYY-MM') as mes
        from ${customerOrder}
        group by ${customerOrder.waveNumber}
      )
      select d.mes, count(distinct ${pickingWave.waveNumber})::int as ondas
      from ${pickingWave}
      join data_da_onda d on d.onda = ${pickingWave.waveNumber}
      group by d.mes
    `);
    return new Map(rows.map((r) => [r.mes, r.ondas]));
  }
}
