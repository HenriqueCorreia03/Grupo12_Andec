import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../db/database.module';
import { customerOrder, customerOrderZone, pickingWave, storageLocation } from '../db/schema';
import { type Filtros, filtrosAtivos, SEM_FILTROS } from '../indicadores/filtros';
import { ZONA_NAO_MAPEADA, ZONA_SEM_ZONA } from '../indicadores/ligacao';
import { LIMITACOES_CONHECIDAS, PERGUNTAS_AO_DOCENTE } from './conteudo-estatico';

/** Localização que a spec mostra sempre primeiro dentro das não mapeadas. */
const RC01 = 'RC-01';

/** Exclusões e contagens do ETL (spec, "Regras de limpeza"). */
export interface Contagens {
  linhasCO: number;
  /** Linhas idênticas a uma anterior em todas as colunas: contam como linhas reais. */
  linhasDuplicadas: number;
  unidadesDuplicadas: number;
  linhasZero: number;
  /** Pedidos com 0 un. no total: ficam fora de todos os denominadores de pedidos. */
  pedidosZero: number;
  linhasTamanhoVazio: number;
  /** Tamanhos fora de todas as escalas conhecidas (mantidos tal como estão). */
  linhasForaDasEscalas: number;
  /** Linhas do CO cuja chave onda + referência + tamanho não existe no PW (ficam "sem zona"). */
  linhasSemCorrespondencia: number;
  percentagemSemCorrespondencia: number | null;
  /** Ondas do CO sem nenhuma linha no PW, e as unidades encomendadas nelas. */
  ondasSemPicking: number;
  unidadesOndasSemPicking: number;
}

/** Diferença encomendado − recolhido decomposta pela ordem da spec ("Recolhido vs encomendado"). */
export interface RecolhidoVsEncomendado {
  encomendado: number;
  recolhido: number;
  diferenca: number;
  /** (1) Unidades encomendadas em ondas sem picking. */
  ondasSemPicking: number;
  /** (2) Unidades de referências nunca recolhidas no PW, em ondas com picking… */
  referenciasNuncaRecolhidas: number;
  /** …e quantas referências são. */
  nReferenciasNuncaRecolhidas: number;
  /** (3) O resto da diferença, sem causa conhecida. */
  semCausaConhecida: number;
}

export interface NaoMapeadas {
  /** Localizações recolhidas que não existem no Storage_Location: RC-01 primeiro, depois por unidades. */
  localizacoes: { localizacao: string; unidades: number; referencias: number }[];
  unidades: number;
  /** % sobre o total recolhido; nulo sem unidades recolhidas. */
  percentagemRecolhido: number | null;
}

/** Ligação CO ↔ PW: linhas do CO cujas unidades recolhidas ficam repartidas por ≥ 2 zonas mapeadas. */
export interface LigacoesRepartidas {
  /** Linhas do CO com unidades atribuídas a alguma localização (mapeada ou não). */
  linhasLigadas: number;
  /** Dessas, as que têm unidades em 2 ou mais zonas mapeadas ("não mapeada" não conta como zona). */
  linhasRepartidas: number;
  valor: number | null;
}

/** Escala de tamanhos 215–305: mantida tal como está, sem interpretação (spec, "Tamanhos"). */
export interface EscalaPorConfirmar {
  linhasCO: number;
  linhasPW: number;
  estado: 'por confirmar';
}

export interface Qualidade {
  contagens: Contagens;
  recolhidoVsEncomendado: RecolhidoVsEncomendado;
  naoMapeadas: NaoMapeadas;
  ligacoesRepartidas: LigacoesRepartidas;
  escalaPorConfirmar: EscalaPorConfirmar;
  /** Conteúdo estático, igual ao da spec. */
  limitacoes: readonly string[];
  perguntasAoDocente: readonly string[];
  /** Filtros pedidos que a página ignora: é sempre calculada sobre o dataset completo. */
  filtrosNaoAplicaveis: string[];
}

/** Limites da escala por confirmar; o PW usa a mesma normalização de tamanhos que o CO. */
const ESCALA_POR_CONFIRMAR = { min: 215, max: 305 };

function percentagem(numerador: number, denominador: number): number | null {
  return denominador === 0 ? null : (numerador * 100) / denominador;
}

@Injectable()
export class QualidadeService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async qualidade(filtros: Filtros = SEM_FILTROS): Promise<Qualidade> {
    const { rows } = await this.db.execute<{
      linhas_co: number;
      linhas_duplicadas: number;
      unidades_duplicadas: number;
      linhas_zero: number;
      pedidos_zero: number;
      linhas_tamanho_vazio: number;
      linhas_fora_escalas: number;
      escala_co: number;
      escala_pw: number;
      linhas_sem_correspondencia: number;
      ondas_sem_picking: number;
      unidades_ondas_sem_picking: number;
      encomendado: number;
      recolhido: number;
      n_referencias_nunca_recolhidas: number;
      unidades_referencias_nunca_recolhidas: number;
    }>(sql`
      with chaves_pw as (
        select distinct
          ${pickingWave.waveNumber} as onda,
          ${pickingWave.reference} as referencia,
          ${pickingWave.size} as tamanho
        from ${pickingWave}
      ),
      ondas_pw as (select distinct ${pickingWave.waveNumber} as onda from ${pickingWave}),
      referencias_pw as (select distinct ${pickingWave.reference} as referencia from ${pickingWave}),
      linhas as (
        select
          ${customerOrder.orderNumber} as pedido,
          ${customerOrder.reference} as referencia,
          ${customerOrder.waveNumber} as onda,
          ${customerOrder.quantity} as unidades,
          ${customerOrder.size} is null as tamanho_vazio,
          ${customerOrder.sizeOutOfKnownScales} as fora_escalas,
          ${customerOrder.sizeScaleUnconfirmed} as escala_por_confirmar,
          ${customerOrder.isDuplicate} as duplicada,
          ${customerOrder.isZero} as zero,
          exists (
            select 1 from chaves_pw k
            where k.onda = ${customerOrder.waveNumber}
              and k.referencia = ${customerOrder.reference}
              and k.tamanho = ${customerOrder.size}
          ) as com_correspondencia,
          ${customerOrder.waveNumber} in (select onda from ondas_pw) as onda_com_picking,
          ${customerOrder.reference} in (select referencia from referencias_pw) as referencia_recolhida
        from ${customerOrder}
      )
      select
        count(*)::int as linhas_co,
        (count(*) filter (where duplicada))::int as linhas_duplicadas,
        coalesce(sum(unidades) filter (where duplicada), 0)::int as unidades_duplicadas,
        (count(*) filter (where zero))::int as linhas_zero,
        (select count(*)::int from (select 1 from linhas group by pedido having sum(unidades) = 0) p) as pedidos_zero,
        (count(*) filter (where tamanho_vazio))::int as linhas_tamanho_vazio,
        (count(*) filter (where fora_escalas))::int as linhas_fora_escalas,
        (count(*) filter (where escala_por_confirmar))::int as escala_co,
        (
          select count(*)::int from ${pickingWave}
          where ${pickingWave.size} between ${ESCALA_POR_CONFIRMAR.min} and ${ESCALA_POR_CONFIRMAR.max}
        ) as escala_pw,
        (count(*) filter (where not com_correspondencia))::int as linhas_sem_correspondencia,
        (count(distinct onda) filter (where not onda_com_picking))::int as ondas_sem_picking,
        coalesce(sum(unidades) filter (where not onda_com_picking), 0)::int as unidades_ondas_sem_picking,
        coalesce(sum(unidades), 0)::int as encomendado,
        (select coalesce(sum(${pickingWave.quantity}), 0)::int from ${pickingWave}) as recolhido,
        (count(distinct referencia) filter (where unidades > 0 and onda_com_picking and not referencia_recolhida))::int
          as n_referencias_nunca_recolhidas,
        coalesce(sum(unidades) filter (where onda_com_picking and not referencia_recolhida), 0)::int
          as unidades_referencias_nunca_recolhidas
      from linhas
    `);
    const [r] = rows;
    const diferenca = r.encomendado - r.recolhido;
    const recolhidoVsEncomendado: RecolhidoVsEncomendado = {
      encomendado: r.encomendado,
      recolhido: r.recolhido,
      diferenca,
      ondasSemPicking: r.unidades_ondas_sem_picking,
      referenciasNuncaRecolhidas: r.unidades_referencias_nunca_recolhidas,
      nReferenciasNuncaRecolhidas: r.n_referencias_nunca_recolhidas,
      semCausaConhecida: diferenca - r.unidades_ondas_sem_picking - r.unidades_referencias_nunca_recolhidas,
    };
    return {
      contagens: {
        linhasCO: r.linhas_co,
        linhasDuplicadas: r.linhas_duplicadas,
        unidadesDuplicadas: r.unidades_duplicadas,
        linhasZero: r.linhas_zero,
        pedidosZero: r.pedidos_zero,
        linhasTamanhoVazio: r.linhas_tamanho_vazio,
        linhasForaDasEscalas: r.linhas_fora_escalas,
        linhasSemCorrespondencia: r.linhas_sem_correspondencia,
        percentagemSemCorrespondencia: percentagem(r.linhas_sem_correspondencia, r.linhas_co),
        ondasSemPicking: r.ondas_sem_picking,
        unidadesOndasSemPicking: r.unidades_ondas_sem_picking,
      },
      recolhidoVsEncomendado,
      naoMapeadas: await this.naoMapeadas(r.recolhido),
      ligacoesRepartidas: await this.ligacoesRepartidas(),
      escalaPorConfirmar: { linhasCO: r.escala_co, linhasPW: r.escala_pw, estado: 'por confirmar' },
      limitacoes: LIMITACOES_CONHECIDAS,
      perguntasAoDocente: PERGUNTAS_AO_DOCENTE,
      filtrosNaoAplicaveis: filtrosAtivos(filtros),
    };
  }

  private async naoMapeadas(recolhido: number): Promise<NaoMapeadas> {
    const { rows } = await this.db.execute<{ localizacao: string; unidades: number; referencias: number }>(sql`
      select
        ${pickingWave.location} as localizacao,
        sum(${pickingWave.quantity})::int as unidades,
        count(distinct ${pickingWave.reference})::int as referencias
      from ${pickingWave}
      left join ${storageLocation} on ${storageLocation.location} = ${pickingWave.location}
      where ${storageLocation.location} is null
      group by ${pickingWave.location}
      order by (${pickingWave.location} = ${RC01}) desc, unidades desc, ${pickingWave.location} collate "C"
    `);
    const unidades = rows.reduce((total, l) => total + l.unidades, 0);
    return { localizacoes: rows, unidades, percentagemRecolhido: percentagem(unidades, recolhido) };
  }

  private async ligacoesRepartidas(): Promise<LigacoesRepartidas> {
    const { rows } = await this.db.execute<{ ligadas: number; repartidas: number }>(sql`
      with por_linha as (
        select
          ${customerOrderZone.lineId} as linha,
          count(*) filter (where ${customerOrderZone.zone} <> ${ZONA_SEM_ZONA} and ${customerOrderZone.units} > 0) as destinos,
          count(*) filter (
            where ${customerOrderZone.zone} not in (${ZONA_SEM_ZONA}, ${ZONA_NAO_MAPEADA}) and ${customerOrderZone.units} > 0
          ) as zonas
        from ${customerOrderZone}
        group by ${customerOrderZone.lineId}
      )
      select
        (count(*) filter (where destinos > 0))::int as ligadas,
        (count(*) filter (where zonas >= 2))::int as repartidas
      from por_linha
    `);
    const [r] = rows;
    return { linhasLigadas: r.ligadas, linhasRepartidas: r.repartidas, valor: percentagem(r.repartidas, r.ligadas) };
  }
}
