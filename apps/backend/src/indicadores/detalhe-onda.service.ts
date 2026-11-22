import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../db/database.module';
import { customerOrder, pickingWave, storageLocation } from '../db/schema';
import type { Exclusao } from './metadados';

/** Capacidade de referência da onda (um alvo, não um limite; spec, "Ocupação da onda"). */
const CAPACIDADE = 24;

export interface PedidoDaOnda {
  pedido: string;
  /** Unidades encomendadas do pedido nesta onda. */
  unidades: number;
  /** Unidades do pedido completo, somadas em todas as ondas. */
  unidadesDoPedido: number;
  /** Linhas do pedido nesta onda (com mais de 0 un.). */
  linhas: number;
  /** Pedido presente em mais de uma onda (propriedade do pedido completo). */
  dividido: boolean;
  /** As outras ondas onde o pedido aparece. */
  outrasOndas: string[];
}

export interface LinhaDaOnda {
  pedido: string;
  referencia: string;
  /** Tamanho normalizado (9,5); nulo quando vem vazio no CSV. */
  tamanho: number | null;
  unidades: number;
  /** Linha idêntica a uma anterior: conta na mesma (spec, duplicados). */
  duplicada: boolean;
}

export interface LocalizacaoDaOnda {
  localizacao: string;
  /** Zona da localização mapeada; nulo = não mapeada. */
  zona: string | null;
  unidades: number;
}

/** Vista de detalhe de uma onda completa (drill-through): é uma entidade, por isso não depende dos outros filtros. */
export interface DetalheOnda {
  onda: string;
  /** Data e hora (a mais antiga) dos pedidos da onda no CO; nulos se a onda só existir no PW. */
  data: string | null;
  hora: string | null;
  /** Unidades recolhidas no PW; nulo se a onda não tem picking. */
  unidadesRecolhidas: number | null;
  /** Unidades recolhidas ÷ 24 × 100; nulo se a onda não tem picking. */
  ocupacao: number | null;
  pedidos: PedidoDaOnda[];
  linhas: LinhaDaOnda[];
  localizacoes: LocalizacaoDaOnda[];
  /** Unidades recolhidas por zona mapeada; as não mapeadas somam-se à parte. */
  zonas: { zona: string; unidades: number }[];
  naoMapeadas: number;
  /** Operadores de cada ficheiro: o atribuído (CO) e o recolhedor (PW) nem sempre coincidem. */
  operadores: { customerOrder: string[]; pickingWave: string[] };
  exclusoes: Exclusao[];
}

@Injectable()
export class DetalheOndaService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async detalhe(onda: string): Promise<DetalheOnda> {
    const cabecalho = await this.cabecalho(onda);
    if (cabecalho.linhasCO === 0 && cabecalho.linhasPW === 0) {
      throw new NotFoundException(`A onda "${onda}" não existe no Customer_Order nem no Picking_Wave.`);
    }
    const [pedidos, linhas, localizacoes, operadores] = await Promise.all([
      this.pedidos(onda),
      this.linhas(onda),
      this.localizacoes(onda),
      this.operadores(onda),
    ]);
    const porZona = new Map<string, number>();
    let naoMapeadas = 0;
    for (const l of localizacoes) {
      if (l.zona === null) naoMapeadas += l.unidades;
      else porZona.set(l.zona, (porZona.get(l.zona) ?? 0) + l.unidades);
    }
    const temPicking = cabecalho.linhasPW > 0;
    return {
      onda,
      data: cabecalho.data,
      hora: cabecalho.hora,
      unidadesRecolhidas: temPicking ? cabecalho.unidadesRecolhidas : null,
      ocupacao: temPicking ? (cabecalho.unidadesRecolhidas * 100) / CAPACIDADE : null,
      pedidos,
      linhas,
      localizacoes,
      zonas: [...porZona.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([zona, unidades]) => ({ zona, unidades })),
      naoMapeadas,
      operadores,
      exclusoes: [{ motivo: 'linhas com 0 un. do CO', quantidade: cabecalho.linhasZero }],
    };
  }

  private async cabecalho(onda: string) {
    const { rows } = await this.db.execute<{
      data: string | null;
      hora: string | null;
      linhas_co: number;
      linhas_zero: number;
      linhas_pw: number;
      unidades_recolhidas: number;
    }>(sql`
      select
        (select to_char(min(${customerOrder.createdAt}), 'YYYY-MM-DD') from ${customerOrder} where ${customerOrder.waveNumber} = ${onda}) as data,
        (select to_char(min(${customerOrder.createdAt}), 'HH24:MI') from ${customerOrder} where ${customerOrder.waveNumber} = ${onda}) as hora,
        (select count(*)::int from ${customerOrder} where ${customerOrder.waveNumber} = ${onda}) as linhas_co,
        (select count(*)::int from ${customerOrder} where ${customerOrder.waveNumber} = ${onda} and ${customerOrder.quantity} = 0) as linhas_zero,
        (select count(*)::int from ${pickingWave} where ${pickingWave.waveNumber} = ${onda}) as linhas_pw,
        (select coalesce(sum(${pickingWave.quantity}), 0)::int from ${pickingWave} where ${pickingWave.waveNumber} = ${onda}) as unidades_recolhidas
    `);
    const [r] = rows;
    return {
      data: r.data,
      hora: r.hora,
      linhasCO: r.linhas_co,
      linhasZero: r.linhas_zero,
      linhasPW: r.linhas_pw,
      unidadesRecolhidas: r.unidades_recolhidas,
    };
  }

  private async pedidos(onda: string): Promise<PedidoDaOnda[]> {
    const { rows } = await this.db.execute<{
      pedido: string;
      unidades: number;
      unidades_do_pedido: number;
      linhas: number;
      outras_ondas: string[];
    }>(sql`
      select
        l.order_number as pedido,
        sum(l.quantity)::int as unidades,
        (select sum(t.quantity)::int from ${customerOrder} t where t.order_number = l.order_number) as unidades_do_pedido,
        count(*)::int as linhas,
        coalesce(
          (select array_agg(distinct t.wave_number order by t.wave_number)
           from ${customerOrder} t
           where t.order_number = l.order_number and t.quantity > 0 and t.wave_number <> ${onda}),
          '{}'
        ) as outras_ondas
      from ${customerOrder} l
      where l.wave_number = ${onda} and l.quantity > 0
      group by l.order_number
      order by l.order_number
    `);
    return rows.map((r) => ({
      pedido: r.pedido,
      unidades: r.unidades,
      unidadesDoPedido: r.unidades_do_pedido,
      linhas: r.linhas,
      dividido: r.outras_ondas.length > 0,
      outrasOndas: r.outras_ondas,
    }));
  }

  private async linhas(onda: string): Promise<LinhaDaOnda[]> {
    const { rows } = await this.db.execute<{ pedido: string; referencia: string; tamanho: number | null; unidades: number; duplicada: boolean }>(sql`
      select
        ${customerOrder.orderNumber} as pedido,
        ${customerOrder.reference} as referencia,
        ${customerOrder.size} as tamanho,
        ${customerOrder.quantity} as unidades,
        ${customerOrder.isDuplicate} as duplicada
      from ${customerOrder}
      where ${customerOrder.waveNumber} = ${onda} and ${customerOrder.quantity} > 0
      order by ${customerOrder.orderNumber}, ${customerOrder.orderToCollect}, ${customerOrder.id}
    `);
    return rows;
  }

  private async localizacoes(onda: string): Promise<LocalizacaoDaOnda[]> {
    const { rows } = await this.db.execute<{ localizacao: string; zona: string | null; unidades: number }>(sql`
      select
        p.location as localizacao,
        case when s.location is not null then split_part(p.location, '-', 1) end as zona,
        sum(p.quantity)::int as unidades
      from ${pickingWave} p
      left join ${storageLocation} s on s.location = p.location
      where p.wave_number = ${onda}
      group by p.location, s.location
      order by unidades desc, p.location
    `);
    return rows;
  }

  private async operadores(onda: string): Promise<DetalheOnda['operadores']> {
    const { rows } = await this.db.execute<{ origem: string; operador: string }>(sql`
      select 'co' as origem, operator as operador from ${customerOrder} where ${customerOrder.waveNumber} = ${onda}
      union
      select 'pw', operator from ${pickingWave} where ${pickingWave.waveNumber} = ${onda}
      order by 1, 2
    `);
    return {
      customerOrder: rows.filter((r) => r.origem === 'co').map((r) => r.operador),
      pickingWave: rows.filter((r) => r.origem === 'pw').map((r) => r.operador),
    };
  }
}
