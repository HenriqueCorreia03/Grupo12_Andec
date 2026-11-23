import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../db/database.module';
import { pickingWave } from '../db/schema';
import { abcGlobal, type ClasseAbc } from './abc';
import { type Filtros, naoAplicaveis, pickingFiltrado, SEM_FILTROS } from './filtros';
import type { Metadados } from './metadados';
import { paragensPorReferenciaELocalizacao } from './paragens';

const RC01 = 'RC-01';

export interface ArtigoPrioritario {
  /** Posição no critério de prioridade da alavanca (a). */
  posicao: number;
  referencia: string;
  /** Classe ABC global; nula se a referência não tiver unidades encomendadas. */
  classe: ClasseAbc | null;
  /** Pares distintos (onda, localização) em que a referência é recolhida. */
  paragens: number;
  /** Localizações distintas de onde sai a referência (o RC-01 conta como 1). */
  localizacoesDistintas: number;
  unidadesRecolhidas: number;
  passaPeloRc01: boolean;
}

export interface PrioridadeDosArtigos extends Metadados {
  artigos: ArtigoPrioritario[];
  /** Dispersão dos artigos A (classe global). */
  resumoA: {
    artigosA: number;
    /** Artigos A recolhidos no picking (com os filtros). */
    artigosAComPicking: number;
    /** Localizações distintas por artigo A com picking; nulas sem artigos A com picking. */
    localizacoes: { media: number | null; mediana: number | null; minimo: number | null; maximo: number | null };
  };
  limitacao: string;
}

/**
 * Prioridade dos artigos da alavanca (a) (ticket 10; spec, "Critérios de prioridade" 2): nº de paragens
 * (decrescente), depois nº de localizações distintas (decrescente), depois o código (crescente). Sem distâncias.
 */
@Injectable()
export class PrioridadeService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async prioridade(filtros: Filtros = SEM_FILTROS): Promise<PrioridadeDosArtigos> {
    const { rows } = await this.db.execute<{
      posicao: number;
      referencia: string;
      classe: ClasseAbc | null;
      paragens: number;
      localizacoes: number;
      unidades: number;
      rc01: boolean;
    }>(sql`
      with ${pickingFiltrado(filtros)},
      global as (${abcGlobal()}),
      por_localizacao as (${paragensPorReferenciaELocalizacao()}),
      por_artigo as (
        select
          referencia,
          sum(paragens)::int as paragens,
          count(*)::int as localizacoes,
          sum(unidades)::int as unidades,
          bool_or(localizacao = ${RC01}) as rc01
        from por_localizacao
        group by referencia
      )
      select
        (row_number() over (order by a.paragens desc, a.localizacoes desc, a.referencia collate "C"))::int as posicao,
        a.referencia, g.classe, a.paragens, a.localizacoes, a.unidades, a.rc01
      from por_artigo a
      left join global g on g.referencia = a.referencia
      order by posicao
    `);
    const artigos = rows.map((r) => ({
      posicao: r.posicao,
      referencia: r.referencia,
      classe: r.classe,
      paragens: r.paragens,
      localizacoesDistintas: r.localizacoes,
      unidadesRecolhidas: r.unidades,
      passaPeloRc01: r.rc01,
    }));
    return {
      artigos,
      resumoA: await this.resumoA(filtros, artigos),
      definicao:
        'Ordem de prioridade da alavanca (a): nº de paragens do artigo (pares distintos onda × localização) por ordem ' +
        'decrescente; em empate, nº de localizações distintas de onde sai (decrescente) e depois o código da referência ' +
        '(crescente). Não usa distâncias.',
      fonte: 'Picking_Wave',
      filtrosNaoAplicaveis: naoAplicaveis(filtros, 'PW'),
      linhasConsideradas: await this.linhasDoPicking(filtros),
      exclusoes: [],
      limitacao:
        'O RC-01 conta como 1 localização, mas é uma área com muitas referências: subestima a dispersão dos ' +
        'artigos que lá são recolhidos.',
    };
  }

  private async resumoA(filtros: Filtros, artigos: ArtigoPrioritario[]): Promise<PrioridadeDosArtigos['resumoA']> {
    const localizacoesA = artigos.filter((a) => a.classe === 'A').map((a) => a.localizacoesDistintas);
    const { rows } = await this.db.execute<{
      artigos_a: number;
      media: number | null;
      mediana: number | null;
      minimo: number | null;
      maximo: number | null;
    }>(sql`
      select
        (select count(*)::int from (${abcGlobal()}) as global
          where classe = 'A' and (${filtros.referencia}::text is null or referencia = ${filtros.referencia})) as artigos_a,
        avg(n)::float8 as media,
        percentile_cont(0.5) within group (order by n) as mediana,
        min(n)::int as minimo,
        max(n)::int as maximo
      from unnest(${`{${localizacoesA.join(',')}}`}::int[]) as n
    `);
    const r = rows[0];
    return {
      artigosA: r.artigos_a,
      artigosAComPicking: localizacoesA.length,
      localizacoes: { media: r.media, mediana: r.mediana, minimo: r.minimo, maximo: r.maximo },
    };
  }

  private async linhasDoPicking(filtros: Filtros): Promise<number> {
    const { rows } = await this.db.execute<{ linhas: number }>(sql`
      with ${pickingFiltrado(filtros)} select count(*)::int as linhas from ${pickingWave}
    `);
    return rows[0].linhas;
  }
}
