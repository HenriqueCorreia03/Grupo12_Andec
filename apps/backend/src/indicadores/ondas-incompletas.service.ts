import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../db/database.module';
import { customerOrder, pickingWave } from '../db/schema';
import { type Filtros, naoAplicaveis, pedidosQuePassam, SEM_FILTROS, selecionarLinhasPicking } from './filtros';
import type { Exclusao } from './metadados';

/** Capacidade de referência da onda (um alvo, não um limite; spec, "Ocupação da onda"). */
const CAPACIDADE = 24;

export interface OndasIncompletas {
  /** Ondas do PW que passam os filtros (as ondas sem picking não existem no PW). */
  ondasDoPicking: number;
  /** Ondas com menos de 24 un. recolhidas (a onda completa, não só as linhas que passam os filtros). */
  ondasIncompletas: number;
  /** % de ondas do PW que são incompletas; nulo sem ondas. */
  percentagemIncompletas: number | null;
  /** Ondas incompletas criadas no mesmo dia e na mesma hora (hora da onda) que pelo menos outra onda incompleta. */
  ondasSimultaneas: number;
  /** Nº de pares (dia, hora) com 2 ou mais ondas incompletas. */
  gruposDiaHora: number;
  /** Pedidos divididos (em mais de uma onda) com linhas numa onda incompleta simultânea. */
  pedidosDivididosEnvolvidos: number;
  /** Uma observação medida no histórico, não uma simulação nem uma poupança prevista. */
  rotulo: 'observação, não ganho esperado';
  definicao: string;
  fonte: 'Customer_Order + Picking_Wave';
  linhasConsideradas: number;
  exclusoes: Exclusao[];
  filtrosNaoAplicaveis: string[];
}

@Injectable()
export class OndasIncompletasService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async ondasIncompletas(filtros: Filtros = SEM_FILTROS): Promise<OndasIncompletas> {
    const { rows } = await this.db.execute<{
      ondas: number;
      incompletas: number;
      simultaneas: number;
      grupos: number;
      pedidos: number;
      linhas: number;
    }>(sql`
      with passam as (${pedidosQuePassam(filtros)}),
      -- Hora da onda = hora de criação mais antiga dos seus pedidos (a data da onda é a dos seus pedidos).
      datas as (
        select ${customerOrder.waveNumber} as onda, date_trunc('hour', min(${customerOrder.createdAt})) as hora
        from ${customerOrder}
        group by ${customerOrder.waveNumber}
      ),
      selecionadas as (select distinct wave_number from (${selecionarLinhasPicking(filtros)}) as linhas),
      -- Propriedade da onda: as unidades da onda completa.
      ondas as (
        select p.${sql.raw('wave_number')} as onda, sum(p.${sql.raw('quantity')}) as unidades, d.hora
        from ${pickingWave} p
        left join datas d on d.onda = p.${sql.raw('wave_number')}
        where p.${sql.raw('wave_number')} in (select wave_number from selecionadas)
        group by p.${sql.raw('wave_number')}, d.hora
      ),
      incompletas as (select onda, hora from ondas where unidades < ${CAPACIDADE}),
      simultaneas as (
        select onda, hora from incompletas
        where hora is not null and hora in (select hora from incompletas where hora is not null group by hora having count(*) >= 2)
      ),
      divididos as (
        select ${customerOrder.orderNumber} as pedido
        from ${customerOrder}
        where ${customerOrder.orderNumber} in (select order_number from passam) and ${customerOrder.quantity} > 0
        group by ${customerOrder.orderNumber}
        having count(distinct ${customerOrder.waveNumber}) > 1
      )
      select
        (select count(*)::int from ondas) as ondas,
        (select count(*)::int from incompletas) as incompletas,
        (select count(*)::int from simultaneas) as simultaneas,
        (select count(distinct hora)::int from simultaneas) as grupos,
        (
          select count(distinct c.${sql.raw('order_number')})::int
          from ${customerOrder} c
          where c.${sql.raw('quantity')} > 0
            and c.${sql.raw('wave_number')} in (select onda from simultaneas)
            and c.${sql.raw('order_number')} in (select pedido from divididos)
        ) as pedidos,
        (select count(*)::int from (${selecionarLinhasPicking(filtros)}) as linhas) as linhas
    `);
    const [r] = rows;
    return {
      ondasDoPicking: r.ondas,
      ondasIncompletas: r.incompletas,
      percentagemIncompletas: r.ondas === 0 ? null : (r.incompletas * 100) / r.ondas,
      ondasSimultaneas: r.simultaneas,
      gruposDiaHora: r.grupos,
      pedidosDivididosEnvolvidos: r.pedidos,
      rotulo: 'observação, não ganho esperado',
      definicao:
        `Ondas com menos de ${CAPACIDADE} un. recolhidas criadas no mesmo dia e na mesma hora (hora da onda = hora de criação mais antiga dos seus pedidos) ` +
        'que pelo menos outra onda incompleta, e os pedidos divididos que passam por elas. É uma observação medida no histórico: ' +
        'não simula juntar ondas nem prevê qualquer ganho.',
      fonte: 'Customer_Order + Picking_Wave',
      linhasConsideradas: r.linhas,
      exclusoes: [],
      filtrosNaoAplicaveis: naoAplicaveis(filtros, 'PW'),
    };
  }
}
