import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../db/database.module';
import { customerOrder, pickingWave } from '../db/schema';
import { type Filtros, SEM_FILTROS, selecionarLinhasPicking, naoAplicaveis } from './filtros';
import type { Metadados } from './metadados';

/** Capacidade de referência da onda (um alvo, não um limite; spec, "Ocupação da onda"). */
const CAPACIDADE = 24;

export interface OcupacaoDasOndas extends Metadados {
  /** Média, sobre as ondas do PW, de unidades recolhidas ÷ 24 × 100; nulo sem ondas. */
  valor: number | null;
  ondas: number;
  ondasCom24: number;
  ondasMaisDe24: number;
  /** % de ondas com exatamente 24 un.; nulo sem ondas. */
  percentagemCom24: number | null;
  minimo: number | null;
  maximo: number | null;
  /** Nº de ondas por nº de unidades recolhidas, por ordem crescente de unidades. */
  distribuicao: { unidades: number; ondas: number }[];
}

export interface Paragens extends Metadados {
  /** Pares distintos (onda, localização); nulo quando a seleção não tem ondas ("sem dados"). */
  valor: number | null;
}

export interface LocalizacoesPorOnda extends Metadados {
  media: number | null;
  mediana: number | null;
  maximo: number | null;
  /** Nº de ondas por nº de localizações distintas, por ordem crescente. */
  distribuicao: { localizacoes: number; ondas: number }[];
}

export interface OndaPicking {
  onda: string;
  /** Data dos pedidos da onda no CO (aaaa-mm-dd); nulo se a onda não existir no CO. */
  data: string | null;
  /** Hora de criação mais antiga dos pedidos da onda no CO (hh:mm); nulo se a onda não existir no CO. */
  hora: string | null;
  /** Unidades recolhidas que passam os filtros (medida aditiva). */
  unidades: number;
  /** Unidades recolhidas na onda completa (propriedade da onda: não depende dos filtros). */
  unidadesDaOnda: number;
  /** Unidades da onda completa ÷ 24 × 100. */
  ocupacao: number;
  paragens: number;
  localizacoes: number;
}

export interface PickingDasOndas {
  ocupacao: OcupacaoDasOndas;
  paragens: Paragens;
  localizacoesPorOnda: LocalizacoesPorOnda;
  ondas: OndaPicking[];
}

@Injectable()
export class PickingService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async picking(filtros: Filtros = SEM_FILTROS): Promise<PickingDasOndas> {
    const ondas = await this.ondas(filtros);
    // A ocupação é uma propriedade da onda: usa as unidades da onda completa, não as que passam os filtros.
    const unidades = ondas.map((o) => o.unidadesDaOnda);
    const localizacoes = ondas.map((o) => o.localizacoes);
    const linhas = ondas.reduce((total, o) => total + o.unidades, 0);
    const mediaUnidades = media(unidades);
    const com24 = unidades.filter((u) => u === CAPACIDADE).length;
    const universo = 'Universo de ondas = PW (as ondas sem picking ficam de fora e contam na qualidade).';

    return {
      ocupacao: {
        valor: mediaUnidades === null ? null : (mediaUnidades * 100) / CAPACIDADE,
        ondas: ondas.length,
        ondasCom24: com24,
        ondasMaisDe24: unidades.filter((u) => u > CAPACIDADE).length,
        percentagemCom24: ondas.length === 0 ? null : (com24 * 100) / ondas.length,
        minimo: ondas.length === 0 ? null : Math.min(...unidades),
        maximo: ondas.length === 0 ? null : Math.max(...unidades),
        distribuicao: contar(unidades).map(([un, n]) => ({ unidades: un, ondas: n })),
        definicao:
          `Unidades recolhidas na onda ÷ ${CAPACIDADE} × 100 (capacidade de referência: é um alvo, não um limite). ` +
          'Média sobre as ondas do PW; cada linha do PW é 1 un.',
        nota: universo,
        fonte: 'Picking_Wave',
        filtrosNaoAplicaveis: naoAplicaveis(filtros, 'PW'),
        linhasConsideradas: linhas,
        exclusoes: [],
      },
      paragens: {
        natureza: 'volume',
        valor: ondas.length === 0 ? null : localizacoes.reduce((total, n) => total + n, 0),
        definicao: 'Pares distintos (onda, localização) no PW; a mesma localização em duas ondas conta duas vezes.',
        fonte: 'Picking_Wave',
        filtrosNaoAplicaveis: naoAplicaveis(filtros, 'PW'),
        linhasConsideradas: linhas,
        exclusoes: [],
      },
      localizacoesPorOnda: {
        media: media(localizacoes),
        mediana: mediana(localizacoes),
        maximo: localizacoes.length === 0 ? null : Math.max(...localizacoes),
        distribuicao: contar(localizacoes).map(([loc, n]) => ({ localizacoes: loc, ondas: n })),
        definicao: 'Nº de localizações distintas de cada onda no PW; média, mediana e distribuição.',
        nota: universo,
        fonte: 'Picking_Wave',
        filtrosNaoAplicaveis: naoAplicaveis(filtros, 'PW'),
        linhasConsideradas: linhas,
        exclusoes: [],
      },
      ondas,
    };
  }

  private async ondas(filtros: Filtros): Promise<OndaPicking[]> {
    const { rows } = await this.db.execute<{
      onda: string;
      data: string | null;
      hora: string | null;
      unidades: number;
      unidades_da_onda: number;
      localizacoes: number;
    }>(sql`
      with datas as (
        select ${customerOrder.waveNumber} as onda, min(${customerOrder.createdAt}) as criada
        from ${customerOrder}
        group by ${customerOrder.waveNumber}
      ),
      -- Só as linhas do PW que passam os filtros: unidades, paragens e localizações (medidas aditivas).
      filtradas as (${selecionarLinhasPicking(filtros)}),
      recolhido as (
        select
          wave_number as onda,
          sum(quantity)::int as unidades,
          count(distinct location)::int as localizacoes
        from filtradas
        group by wave_number
      ),
      -- A onda completa, para a ocupação.
      completa as (
        select ${pickingWave.waveNumber} as onda, sum(${pickingWave.quantity})::int as unidades
        from ${pickingWave}
        group by ${pickingWave.waveNumber}
      )
      select
        r.onda,
        to_char(d.criada, 'YYYY-MM-DD') as data,
        to_char(d.criada, 'HH24:MI') as hora,
        r.unidades,
        c.unidades as unidades_da_onda,
        r.localizacoes
      from recolhido r
      join completa c on c.onda = r.onda
      left join datas d on d.onda = r.onda
      order by d.criada nulls last, r.onda
    `);
    return rows.map((r) => ({
      onda: r.onda,
      data: r.data,
      hora: r.hora,
      unidades: r.unidades,
      unidadesDaOnda: r.unidades_da_onda,
      ocupacao: (r.unidades_da_onda * 100) / CAPACIDADE,
      paragens: r.localizacoes,
      localizacoes: r.localizacoes,
    }));
  }
}

function media(valores: number[]): number | null {
  return valores.length === 0 ? null : valores.reduce((total, v) => total + v, 0) / valores.length;
}

/** Mediana contínua (igual ao percentile_cont(0.5) e à MEDIANA do Excel). */
function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 === 1 ? ordenados[meio] : (ordenados[meio - 1] + ordenados[meio]) / 2;
}

function contar(valores: number[]): [number, number][] {
  const contagem = new Map<number, number>();
  for (const v of valores) contagem.set(v, (contagem.get(v) ?? 0) + 1);
  return [...contagem.entries()].sort((a, b) => a[0] - b[0]);
}
