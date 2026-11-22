import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { sql, type SQL } from 'drizzle-orm';
import { DATABASE, type Database } from '../db/database.module';
import { customerOrder } from '../db/schema';
import { abcGlobal, abcSobre, CLASSES_ABC, type ClasseAbc } from './abc';
import { type Filtros, linhasFiltradas, SEM_FILTROS, selecionarLinhasCO } from './filtros';
import type { Metadados } from './metadados';

export interface ResumoClasseAbc {
  classe: ClasseAbc;
  /** Referências com movimento no período que são desta classe (no período). */
  referencias: number;
  unidades: number;
  /** % das unidades encomendadas; nulo quando a seleção não tem unidades ("sem dados"). */
  percentagemUnidades: number | null;
}

export interface ReferenciaAbc {
  referencia: string;
  /** Posição no ABC do período; nulo quando a referência não tem movimento no período. */
  posicao: number | null;
  /** Unidades encomendadas no período (0 sem movimento). */
  unidades: number;
  /** % acumulada das referências anteriores no ABC do período (× 100, sem arredondamento); nulo sem movimento. */
  acumuladoAntes: number | null;
  /** Classe global (histórico completo, fixa): é a que o filtro de classe usa. */
  classe: ClasseAbc;
  /** Classe no período (ABC recalculado só com as linhas do período); nulo sem movimento no período. */
  classePeriodo: ClasseAbc | null;
}

export interface ResumoAbc extends Metadados {
  /** Classes no período, só com as referências com movimento. */
  classes: ResumoClasseAbc[];
  /** Referências com movimento no período (e dentro dos filtros). */
  totalReferencias: number;
}

export interface ReferenciasAbc extends ResumoAbc {
  /** Classe global pedida no filtro; nulo = todas as referências. */
  classeSelecionada: ClasseAbc | null;
  /** Referências do âmbito dos filtros, por unidades do período; as sem movimento ficam no fim. */
  referencias: ReferenciaAbc[];
}

export interface TamanhosReferencia {
  referencia: string;
  /** Classe global da referência. */
  classe: ClasseAbc;
  /** Unidades encomendadas no período (0 sem movimento). */
  unidades: number;
  /** Unidades por tamanho normalizado (35…125 → 3,5…12,5); nulo = tamanho vazio no CSV. */
  tamanhos: { tamanho: number | null; unidades: number; escalaPorConfirmar: boolean }[];
}

export const DEFINICAO_ABC =
  'Unidades encomendadas por referência (linhas > 0 de pedidos válidos, com duplicados), ordenadas por unidades ' +
  '(decrescente) e, em empate, pelo código da referência. A se o acumulado antes da referência < 80 %, ' +
  'B se < 95 %, C no resto; a referência que atravessa um limiar fica na classe superior. ' +
  'Classe no período = ABC recalculado só com as linhas do período; classe global = histórico completo (é a do filtro de classe).';

/** O ABC do período usa só o filtro de período: a referência e a classe global escolhem o que se mostra. */
function soPeriodo(filtros: Filtros): Filtros {
  return { ...filtros, referencia: null, classe: null };
}

@Injectable()
export class AbcService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /** Nº de referências e % das unidades por classe no período (cartão da Visão geral). */
  async resumo(filtros: Filtros = SEM_FILTROS): Promise<ResumoAbc> {
    return this.resumir(await this.comMovimento(filtros), filtros);
  }

  /** Referências do âmbito dos filtros, pela ordem do ABC do período (drill-down na página Artigos). */
  async referencias(filtros: Filtros = SEM_FILTROS): Promise<ReferenciasAbc> {
    const ambito = await this.ambito(filtros);
    const comMovimento = ambito.filter((r) => r.unidades > 0);
    return {
      ...(await this.resumir(comMovimento, filtros)),
      classeSelecionada: filtros.classe,
      // Sem nenhuma linha na seleção: "sem dados" (e não uma lista de referências a 0).
      referencias: comMovimento.length === 0 ? [] : ambito,
    };
  }

  /** Unidades encomendadas da referência por tamanho normalizado, no período (drill-down referência → tamanhos). */
  async tamanhos(referencia: string, filtros: Filtros = SEM_FILTROS): Promise<TamanhosReferencia> {
    const {
      rows: [abc],
    } = await this.db.execute<{ classe: ClasseAbc }>(sql`
      with abc as (${abcGlobal()})
      select classe from abc where referencia = ${referencia}
    `);
    if (!abc) {
      throw new NotFoundException(`A referência "${referencia}" não tem procura (sem unidades encomendadas).`);
    }
    const { rows } = await this.db.execute<{ tamanho: number | null; unidades: number; escala_por_confirmar: boolean }>(sql`
      with ${linhasFiltradas(soPeriodo(filtros))}
      select
        ${customerOrder.size} as tamanho,
        sum(${customerOrder.quantity})::int as unidades,
        bool_or(${customerOrder.sizeScaleUnconfirmed}) as escala_por_confirmar
      from ${customerOrder}
      where ${customerOrder.reference} = ${referencia} and ${customerOrder.quantity} > 0
      group by ${customerOrder.size}
      order by ${customerOrder.size} nulls last
    `);
    return {
      referencia,
      classe: abc.classe,
      unidades: rows.reduce((soma, r) => soma + r.unidades, 0),
      tamanhos: rows.map((r) => ({ tamanho: r.tamanho, unidades: r.unidades, escalaPorConfirmar: r.escala_por_confirmar })),
    };
  }

  private async comMovimento(filtros: Filtros): Promise<ReferenciaAbc[]> {
    return (await this.ambito(filtros)).filter((r) => r.unidades > 0);
  }

  /**
   * Todas as referências com procura no histórico que cumprem a referência e a classe global do filtro,
   * com as unidades e a classe do período (nulas sem movimento). As sem movimento ficam no fim.
   */
  private async ambito(filtros: Filtros): Promise<ReferenciaAbc[]> {
    const condicoes: SQL[] = [];
    if (filtros.referencia !== null) condicoes.push(sql`g.referencia = ${filtros.referencia}`);
    if (filtros.classe !== null) condicoes.push(sql`g.classe = ${filtros.classe}`);
    const onde = condicoes.length === 0 ? sql`true` : sql.join(condicoes, sql` and `);
    const linhasDoPeriodo = sql`(${selecionarLinhasCO(soPeriodo(filtros))}) as customer_order`;

    const { rows } = await this.db.execute<{
      referencia: string;
      classe_global: ClasseAbc;
      unidades: number | null;
      posicao: number | null;
      acumulado_antes: number | null;
      classe_periodo: ClasseAbc | null;
    }>(sql`
      with global as (${abcGlobal()}),
      periodo as (${abcSobre(linhasDoPeriodo)})
      select
        g.referencia,
        g.classe as classe_global,
        p.unidades,
        p.posicao,
        p.acumulado_antes,
        p.classe as classe_periodo
      from global g
      left join periodo p on p.referencia = g.referencia
      where ${onde}
      order by p.posicao nulls last, g.referencia collate "C"
    `);
    return rows.map((r) => ({
      referencia: r.referencia,
      posicao: r.posicao,
      unidades: r.unidades ?? 0,
      acumuladoAntes: r.acumulado_antes,
      classe: r.classe_global,
      classePeriodo: r.classe_periodo,
    }));
  }

  private async resumir(comMovimento: ReferenciaAbc[], filtros: Filtros): Promise<ResumoAbc> {
    const total = comMovimento.reduce((soma, r) => soma + r.unidades, 0);
    const classes = CLASSES_ABC.map((classe) => {
      const daClasse = comMovimento.filter((r) => r.classePeriodo === classe);
      const unidades = daClasse.reduce((soma, r) => soma + r.unidades, 0);
      return {
        classe,
        referencias: daClasse.length,
        unidades,
        percentagemUnidades: total === 0 ? null : (unidades * 100) / total,
      };
    });
    return { classes, totalReferencias: comMovimento.length, ...(await this.metadados(filtros)) };
  }

  private async metadados(filtros: Filtros): Promise<Metadados> {
    const { rows } = await this.db.execute<{ linhas_positivas: number; linhas_zero: number }>(sql`
      select
        (count(*) filter (where quantity > 0))::int as linhas_positivas,
        (count(*) filter (where quantity = 0))::int as linhas_zero
      from (${selecionarLinhasCO(filtros)}) as linhas
    `);
    const [contagens] = rows;
    return {
      definicao: DEFINICAO_ABC,
      fonte: 'Customer_Order',
      linhasConsideradas: contagens.linhas_positivas,
      exclusoes: [{ motivo: 'linhas com 0 un.', quantidade: contagens.linhas_zero }],
    };
  }
}
