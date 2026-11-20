import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../db/database.module';
import { customerOrder } from '../db/schema';
import { abcGlobal, CLASSES_ABC, type ClasseAbc } from './abc';
import type { Metadados } from './metadados';

export interface ResumoClasseAbc {
  classe: ClasseAbc;
  referencias: number;
  unidades: number;
  /** % das unidades encomendadas; 0 quando não há unidades. */
  percentagemUnidades: number;
}

export interface ReferenciaAbc {
  referencia: string;
  posicao: number;
  unidades: number;
  /** % acumulada das referências anteriores na ordenação (× 100, sem arredondamento). */
  acumuladoAntes: number;
  classe: ClasseAbc;
}

export interface ResumoAbc extends Metadados {
  classes: ResumoClasseAbc[];
  /** Referências com procura (classificadas). */
  totalReferencias: number;
}

export interface ReferenciasAbc extends ResumoAbc {
  /** Classe pedida no drill-down; nulo = todas as referências. */
  classeSelecionada: ClasseAbc | null;
  referencias: ReferenciaAbc[];
}

export interface TamanhosReferencia {
  referencia: string;
  classe: ClasseAbc;
  unidades: number;
  /** Unidades por tamanho normalizado (35…125 → 3,5…12,5); nulo = tamanho vazio no CSV. */
  tamanhos: { tamanho: number | null; unidades: number; escalaPorConfirmar: boolean }[];
}

export const DEFINICAO_ABC =
  'Unidades encomendadas por referência (linhas > 0 de pedidos válidos, com duplicados), ordenadas por unidades ' +
  '(decrescente) e, em empate, pelo código da referência. A se o acumulado antes da referência < 80 %, ' +
  'B se < 95 %, C no resto; a referência que atravessa um limiar fica na classe superior. Classe global (período completo).';

@Injectable()
export class AbcService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /** Nº de referências e % das unidades por classe (cartão da Visão geral). */
  async resumo(): Promise<ResumoAbc> {
    return this.resumir(await this.classificacao());
  }

  /** Referências pela ordem do ABC, opcionalmente só de uma classe (drill-down na página Artigos). */
  async referencias(classe: ClasseAbc | null): Promise<ReferenciasAbc> {
    const todas = await this.classificacao();
    return {
      ...(await this.resumir(todas)),
      classeSelecionada: classe,
      referencias: classe === null ? todas : todas.filter((r) => r.classe === classe),
    };
  }

  /** Unidades encomendadas da referência por tamanho normalizado (drill-down referência → tamanhos). */
  async tamanhos(referencia: string): Promise<TamanhosReferencia> {
    const {
      rows: [abc],
    } = await this.db.execute<{ classe: ClasseAbc; unidades: number }>(sql`
      with abc as (${abcGlobal()})
      select classe, unidades from abc where referencia = ${referencia}
    `);
    if (!abc) {
      throw new NotFoundException(`A referência "${referencia}" não tem procura (sem unidades encomendadas).`);
    }
    const { rows } = await this.db.execute<{ tamanho: number | null; unidades: number; escala_por_confirmar: boolean }>(sql`
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
      unidades: abc.unidades,
      tamanhos: rows.map((r) => ({ tamanho: r.tamanho, unidades: r.unidades, escalaPorConfirmar: r.escala_por_confirmar })),
    };
  }

  /** Todas as referências com procura, pela ordem do ABC global. */
  private async classificacao(): Promise<ReferenciaAbc[]> {
    const { rows } = await this.db.execute<{
      referencia: string;
      posicao: number;
      unidades: number;
      acumulado_antes: number;
      classe: ClasseAbc;
    }>(sql`
      with abc as (${abcGlobal()})
      select referencia, posicao, unidades, acumulado_antes, classe from abc order by posicao
    `);
    return rows.map((r) => ({
      referencia: r.referencia,
      posicao: r.posicao,
      unidades: r.unidades,
      acumuladoAntes: r.acumulado_antes,
      classe: r.classe,
    }));
  }

  private async resumir(referencias: ReferenciaAbc[]): Promise<ResumoAbc> {
    const total = referencias.reduce((soma, r) => soma + r.unidades, 0);
    const classes = CLASSES_ABC.map((classe) => {
      const daClasse = referencias.filter((r) => r.classe === classe);
      const unidades = daClasse.reduce((soma, r) => soma + r.unidades, 0);
      return {
        classe,
        referencias: daClasse.length,
        unidades,
        percentagemUnidades: total === 0 ? 0 : (unidades * 100) / total,
      };
    });
    return { classes, totalReferencias: referencias.length, ...(await this.metadados()) };
  }

  private async metadados(): Promise<Metadados> {
    const { rows } = await this.db.execute<{ linhas_positivas: number; linhas_zero: number }>(sql`
      select
        (count(*) filter (where ${customerOrder.quantity} > 0))::int as linhas_positivas,
        (count(*) filter (where ${customerOrder.quantity} = 0))::int as linhas_zero
      from ${customerOrder}
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
