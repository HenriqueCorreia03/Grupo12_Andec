import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../db/database.module';
import { customerOrder, esforcoMatriz, pickingWave, storageLocation } from '../db/schema';
import { abcGlobal } from './abc';
import { type Filtros, SEM_FILTROS } from './filtros';

export type Nota = 1 | 2 | 3;

/** Esforço: juízo qualitativo da equipa, lido do ficheiro de configuração (via ETL); nunca é medido. */
export interface Esforco {
  nota: Nota;
  rotulo: 'alto' | 'médio' | 'baixo';
  origem: 'juízo da equipa';
  justificacao: string;
}

/** Critério calculado pelo backend a partir de uma medida (impacto ou robustez). */
export interface CriterioMedido {
  /** numerador ÷ denominador × 100, sem arredondamento; nulo sem dados. */
  valor: number | null;
  /** Nota 1–3 pelos limiares do critério; nula sem dados. */
  nota: Nota | null;
  numerador: number;
  denominador: number;
  /** A medida que dá origem à nota. */
  medida: string;
  /** Os limiares das notas, por extenso. */
  regra: string;
  /** Aviso quando o valor fica a menos de 1 ponto de um limiar (nota frágil); nulo nos outros casos. */
  avisoLimiar: string | null;
}

export interface ImpactoA extends CriterioMedido {
  /** Artigos A (classe global) com picking. */
  artigosA: number;
  /** Artigos A com o RC-01 entre as suas 3 localizações mais usadas. */
  artigosComRc01NasMaisUsadas: number;
  /** A mesma medida com 1 e com 5 localizações mais usadas, em vez de 3. */
  sensibilidade: { localizacoes: number; valor: number | null }[];
}

export interface ImpactoB extends CriterioMedido {
  /** Sensibilidade em unidades: unidades dos pedidos divididos com ≤ 24 un. (pedido completo)… */
  unidades: number;
  /** …÷ unidades dos pedidos válidos. */
  unidadesTotais: number;
  percentagemUnidades: number | null;
  /** Nota que a medida em unidades teria, pelos mesmos limiares. */
  notaUnidades: Nota | null;
}

export interface AlavancaA {
  impacto: ImpactoA;
  robustez: CriterioMedido;
  esforco: Esforco;
}

export interface AlavancaB {
  impacto: ImpactoB;
  robustez: CriterioMedido;
  esforco: Esforco;
}

/** Matriz impacto × esforço × robustez das duas alavancas (spec, "Critérios de prioridade"; ticket 12). */
export interface Matriz {
  /** (a) Reorganizar localizações. */
  a: AlavancaA;
  /** (b) Constituição das ondas. */
  b: AlavancaB;
  /** O que a matriz mostra (e o que não mostra). */
  nota: string;
  /** Filtros pedidos que a matriz ignora: é sempre calculada sobre o dataset completo. */
  filtrosNaoAplicaveis: string[];
}

/** A matriz compara as alavancas no dataset completo: qualquer filtro ativo é "não aplicável". */
function filtrosAtivos(filtros: Filtros): string[] {
  const ativos: [string, boolean][] = [
    ['período', filtros.inicio !== null || filtros.fim !== null],
    ['referência', filtros.referencia !== null],
    ['classe ABC', filtros.classe !== null],
    ['operador', filtros.operador !== null],
    ['zona', filtros.zona !== null],
    ['onda', filtros.onda !== null],
    ['pedido', filtros.pedido !== null],
  ];
  return ativos.filter(([, ativo]) => ativo).map(([nome]) => nome);
}

const ROTULO_ESFORCO: Record<Nota, Esforco['rotulo']> = { 1: 'alto', 2: 'médio', 3: 'baixo' };

/** Limiares (spec): a nota 2 começa no 1.º limiar e a nota 3 no 2.º (inclusivos). */
const LIMIARES_IMPACTO: [number, number] = [10, 30];
const LIMIARES_ROBUSTEZ: [number, number] = [85, 95];

/** Alvo da onda (24 un.): um pedido dividido com até 24 un. é uma divisão evitável (spec, "Pedidos divididos"). */
const LIMITE_UNIDADES = 24;

/** Localizações "mais usadas" de cada artigo A, e as da sensibilidade. */
const MAIS_USADAS = 3;
const SENSIBILIDADE = [1, 5];

/** Nota pelos limiares, comparada em inteiros (numerador × 100 vs denominador × limiar), sem erros de vírgula flutuante. */
function nota(numerador: number, denominador: number, [l2, l3]: [number, number]): Nota | null {
  if (denominador === 0) return null;
  if (numerador * 100 >= denominador * l3) return 3;
  if (numerador * 100 >= denominador * l2) return 2;
  return 1;
}

function percentagem(numerador: number, denominador: number): number | null {
  return denominador === 0 ? null : (numerador * 100) / denominador;
}

function avisoLimiar(valor: number | null, limiares: [number, number]): string | null {
  if (valor === null) return null;
  const limiar = limiares.find((l) => Math.abs(valor - l) < 1);
  return limiar === undefined ? null : `Colada ao limiar dos ${limiar} %: a nota é frágil.`;
}

function criterio(
  numerador: number,
  denominador: number,
  limiares: [number, number],
  medida: string,
): CriterioMedido {
  const valor = percentagem(numerador, denominador);
  const [l2, l3] = limiares;
  return {
    valor,
    nota: nota(numerador, denominador, limiares),
    numerador,
    denominador,
    medida,
    regra: `< ${l2} % → 1; ${l2}–${l3} % → 2; ≥ ${l3} % → 3`,
    avisoLimiar: avisoLimiar(valor, limiares),
  };
}

@Injectable()
export class MatrizService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async matriz(filtros: Filtros = SEM_FILTROS): Promise<Matriz> {
    const esforco = await this.esforco();
    return {
      a: { impacto: await this.impactoA(), robustez: await this.robustezA(), esforco: esforco.a },
      b: { impacto: await this.impactoB(), robustez: await this.robustezB(), esforco: esforco.b },
      nota:
        'Mostra o potencial observado nos dados, nunca o ganho esperado. Impacto e robustez são medidos ' +
        'no dataset completo; o esforço é um juízo da equipa.',
      filtrosNaoAplicaveis: filtrosAtivos(filtros),
    };
  }

  /** Impacto (b): pedidos válidos em mais de uma onda e com total ≤ 24 un. ÷ pedidos válidos (pedido completo). */
  private async impactoB(): Promise<ImpactoB> {
    const { rows } = await this.db.execute<{
      validos: number;
      evitaveis: number;
      unidades_totais: number;
      unidades_evitaveis: number;
    }>(sql`
      with pedidos as (
        select
          count(distinct ${customerOrder.waveNumber}) filter (where ${customerOrder.quantity} > 0) as ondas,
          sum(${customerOrder.quantity}) as unidades
        from ${customerOrder}
        group by ${customerOrder.orderNumber}
      )
      select
        (count(*) filter (where unidades > 0))::int as validos,
        (count(*) filter (where unidades > 0 and ondas > 1 and unidades <= ${LIMITE_UNIDADES}))::int as evitaveis,
        coalesce(sum(unidades) filter (where unidades > 0), 0)::int as unidades_totais,
        coalesce(sum(unidades) filter (where unidades > 0 and ondas > 1 and unidades <= ${LIMITE_UNIDADES}), 0)::int
          as unidades_evitaveis
      from pedidos
    `);
    const [r] = rows;
    return {
      ...criterio(
        r.evitaveis,
        r.validos,
        LIMIARES_IMPACTO,
        `% dos pedidos válidos divididos (em mais de uma onda) com ≤ ${LIMITE_UNIDADES} un. (divisões evitáveis).`,
      ),
      unidades: r.unidades_evitaveis,
      unidadesTotais: r.unidades_totais,
      percentagemUnidades: percentagem(r.unidades_evitaveis, r.unidades_totais),
      notaUnidades: nota(r.unidades_evitaveis, r.unidades_totais, LIMIARES_IMPACTO),
    };
  }

  /** Robustez (a): unidades recolhidas em localizações mapeadas (existem no Storage_Location) ÷ unidades recolhidas. */
  private async robustezA(): Promise<CriterioMedido> {
    const { rows } = await this.db.execute<{ recolhidas: number; mapeadas: number }>(sql`
      select
        coalesce(sum(${pickingWave.quantity}), 0)::int as recolhidas,
        coalesce(sum(${pickingWave.quantity}) filter (where ${storageLocation.location} is not null), 0)::int as mapeadas
      from ${pickingWave}
      left join ${storageLocation} on ${storageLocation.location} = ${pickingWave.location}
    `);
    const [r] = rows;
    return criterio(
      r.mapeadas,
      r.recolhidas,
      LIMIARES_ROBUSTEZ,
      '% das unidades recolhidas em localizações mapeadas (as que existem no Storage_Location).',
    );
  }

  /** Robustez (b): linhas do CO (todas) cuja chave onda + referência + tamanho existe no PW ÷ linhas do CO. */
  private async robustezB(): Promise<CriterioMedido> {
    const { rows } = await this.db.execute<{ linhas: number; com_correspondencia: number }>(sql`
      with chaves as (
        select distinct
          ${pickingWave.waveNumber} as onda,
          ${pickingWave.reference} as referencia,
          ${pickingWave.size} as tamanho
        from ${pickingWave}
      )
      select
        count(*)::int as linhas,
        count(chaves.onda)::int as com_correspondencia
      from ${customerOrder}
      left join chaves
        on chaves.onda = ${customerOrder.waveNumber}
        and chaves.referencia = ${customerOrder.reference}
        and chaves.tamanho = ${customerOrder.size}
    `);
    const [r] = rows;
    return criterio(
      r.com_correspondencia,
      r.linhas,
      LIMIARES_ROBUSTEZ,
      '% das linhas do CO com correspondência no PW (onda + referência + tamanho normalizado).',
    );
  }

  /**
   * Impacto (a): uma paragem de artigo é um trio distinto (referência, onda, localização). As localizações de cada
   * artigo A ordenam-se por paragens (desc.), unidades recolhidas (desc.) e código (asc.); as não mapeadas entram
   * como as outras. Mede-se a % das paragens feitas fora das N primeiras.
   */
  private async impactoA(): Promise<ImpactoA> {
    const { rows } = await this.db.execute<{
      artigos_a: number;
      paragens: number;
      fora_1: number;
      fora_3: number;
      fora_5: number;
      com_rc01: number;
    }>(sql`
      with abc as (${abcGlobal()}),
      por_localizacao as (
        select
          ${pickingWave.reference} as referencia,
          ${pickingWave.location} as localizacao,
          count(distinct ${pickingWave.waveNumber}) as paragens,
          sum(${pickingWave.quantity}) as unidades
        from ${pickingWave}
        where ${pickingWave.reference} in (select referencia from abc where classe = 'A')
        group by ${pickingWave.reference}, ${pickingWave.location}
      ),
      ranking as (
        select
          *,
          row_number() over (
            partition by referencia
            order by paragens desc, unidades desc, localizacao collate "C"
          ) as posicao
        from por_localizacao
      )
      select
        count(distinct referencia)::int as artigos_a,
        coalesce(sum(paragens), 0)::int as paragens,
        coalesce(sum(paragens) filter (where posicao > ${SENSIBILIDADE[0]}), 0)::int as fora_1,
        coalesce(sum(paragens) filter (where posicao > ${MAIS_USADAS}), 0)::int as fora_3,
        coalesce(sum(paragens) filter (where posicao > ${SENSIBILIDADE[1]}), 0)::int as fora_5,
        (count(distinct referencia) filter (where posicao <= ${MAIS_USADAS} and localizacao = 'RC-01'))::int as com_rc01
      from ranking
    `);
    const [r] = rows;
    return {
      ...criterio(
        r.fora_3,
        r.paragens,
        LIMIARES_IMPACTO,
        '% das paragens de artigos A feitas fora das 3 localizações mais usadas do artigo ' +
          '(ranking por paragens, unidades recolhidas e código; as não mapeadas entram como as outras).',
      ),
      artigosA: r.artigos_a,
      artigosComRc01NasMaisUsadas: r.com_rc01,
      sensibilidade: [
        { localizacoes: SENSIBILIDADE[0], valor: percentagem(r.fora_1, r.paragens) },
        { localizacoes: SENSIBILIDADE[1], valor: percentagem(r.fora_5, r.paragens) },
      ],
    };
  }

  private async esforco(): Promise<Record<'a' | 'b', Esforco>> {
    const linhas = await this.db.select().from(esforcoMatriz);
    const porAlavanca = (alavanca: 'a' | 'b'): Esforco => {
      const linha = linhas.find((l) => l.alavanca === alavanca);
      if (!linha) throw new Error(`Falta o esforço da alavanca (${alavanca}): corra npm run etl.`);
      const nota = linha.nota as Nota;
      return { nota, rotulo: ROTULO_ESFORCO[nota], origem: 'juízo da equipa', justificacao: linha.justificacao };
    };
    return { a: porAlavanca('a'), b: porAlavanca('b') };
  }
}
