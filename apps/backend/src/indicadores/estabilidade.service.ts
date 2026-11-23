import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../db/database.module';
import { customerOrder } from '../db/schema';
import { abcGlobal, abcMensalSobre, type ClasseAbc } from './abc';
import { type Filtros, linhasFiltradas, naoAplicaveis, SEM_FILTROS } from './filtros';
import type { Metadados } from './metadados';

/** Combinações referência-mês com menos unidades do que isto ficam fora do denominador (spec). */
const LIMIAR_UNIDADES = 10;

export interface MesDaReferencia {
  mes: string;
  /** Classe no ABC desse mês; nula sem unidades no mês ("sem procura no mês"). */
  classe: ClasseAbc | null;
  unidades: number;
  /** Com unidades, mas abaixo do limiar: não entra nas comparações. */
  excluida: boolean;
}

export interface TransicaoAbc {
  de: string;
  para: string;
  /** Referências com ≥ limiar un. nos dois meses. */
  comparadas: number;
  mudaram: number;
  /** mudaram ÷ comparadas × 100; nula sem referências comparadas. */
  percentagem: number | null;
}

export interface EstabilidadeAbc extends Metadados {
  limiarUnidades: number;
  meses: string[];
  transicoes: TransicaoAbc[];
  /** % de referências que mudam de classe entre meses consecutivos, sobre todas as transições; nula sem comparações. */
  valor: number | null;
  comparadas: number;
  mudaram: number;
  combinacoes: { comUnidades: number; excluidas: number; percentagemExcluidas: number | null };
  /** Referências do âmbito (classe global e referência do filtro), com a classe de cada mês. */
  referencias: { referencia: string; classeGlobal: ClasseAbc; meses: MesDaReferencia[] }[];
}

/**
 * Estabilidade do ABC (ticket 10; spec, "Estabilidade do ABC"): ABC mensal independente (mesma regra, sobre as
 * unidades de cada mês) e % de referências que mudam de classe entre meses consecutivos. As combinações
 * referência-mês com menos de 10 un. ficam fora do denominador. Como no ABC do período, a referência e a classe
 * global escolhem só que referências se mostram e contam: a classificação de cada mês usa todas as referências.
 */
@Injectable()
export class EstabilidadeService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async estabilidade(filtros: Filtros = SEM_FILTROS): Promise<EstabilidadeAbc> {
    const linhasDoMes = { ...filtros, referencia: null, classe: null };
    const { rows } = await this.db.execute<{ mes: string; referencia: string; unidades: number; classe: ClasseAbc }>(sql`
      with ${linhasFiltradas(linhasDoMes)}
      select mes, referencia, unidades, classe from (${abcMensalSobre(sql`${customerOrder}`)}) as mensal
      order by mes, referencia collate "C"
    `);
    const { rows: globais } = await this.db.execute<{ referencia: string; classe: ClasseAbc }>(sql`
      select referencia, classe from (${abcGlobal()}) as global
      where (${filtros.referencia}::text is null or referencia = ${filtros.referencia})
        and (${filtros.classe}::text is null or classe = ${filtros.classe})
      order by posicao
    `);

    const meses = [...new Set(rows.map((r) => r.mes))].sort();
    const porReferencia = new Map<string, Map<string, { unidades: number; classe: ClasseAbc }>>();
    for (const r of rows) {
      if (!porReferencia.has(r.referencia)) porReferencia.set(r.referencia, new Map());
      porReferencia.get(r.referencia)!.set(r.mes, { unidades: r.unidades, classe: r.classe });
    }

    const referencias = globais.map((g) => ({
      referencia: g.referencia,
      classeGlobal: g.classe,
      meses: meses.map((mes): MesDaReferencia => {
        const celula = porReferencia.get(g.referencia)?.get(mes);
        return celula
          ? { mes, classe: celula.classe, unidades: celula.unidades, excluida: celula.unidades < LIMIAR_UNIDADES }
          : { mes, classe: null, unidades: 0, excluida: false };
      }),
    }));

    const transicoes = meses.slice(1).map((para, i): TransicaoAbc => {
      const de = meses[i];
      let comparadas = 0;
      let mudaram = 0;
      for (const r of referencias) {
        const [antes, depois] = [r.meses[i], r.meses[i + 1]];
        if (antes.unidades < LIMIAR_UNIDADES || depois.unidades < LIMIAR_UNIDADES) continue;
        comparadas++;
        if (antes.classe !== depois.classe) mudaram++;
      }
      return { de, para, comparadas, mudaram, percentagem: comparadas === 0 ? null : (mudaram * 100) / comparadas };
    });

    const comparadas = transicoes.reduce((s, t) => s + t.comparadas, 0);
    const mudaram = transicoes.reduce((s, t) => s + t.mudaram, 0);
    const celulas = referencias.flatMap((r) => r.meses).filter((m) => m.unidades > 0);
    const excluidas = celulas.filter((m) => m.excluida).length;

    return {
      limiarUnidades: LIMIAR_UNIDADES,
      meses,
      transicoes,
      valor: comparadas === 0 ? null : (mudaram * 100) / comparadas,
      comparadas,
      mudaram,
      combinacoes: {
        comUnidades: celulas.length,
        excluidas,
        percentagemExcluidas: celulas.length === 0 ? null : (excluidas * 100) / celulas.length,
      },
      referencias,
      definicao:
        'ABC mensal independente (mesma regra do ABC, sobre as unidades de cada mês). % de referências que mudam de ' +
        `classe entre meses consecutivos, contando só as referências com ≥ ${LIMIAR_UNIDADES} un. nos dois meses. ` +
        'O valor do período junta todas as transições: mudanças ÷ comparações (não é a média das percentagens mensais).',
      natureza: 'rácio',
      nota: 'Janeiro e outubro de 2023 são meses parciais.',
      fonte: 'Customer_Order',
      filtrosNaoAplicaveis: naoAplicaveis(filtros, 'CO'),
      linhasConsideradas: celulas.length,
      exclusoes: [{ motivo: `combinações referência-mês com < ${LIMIAR_UNIDADES} un.`, quantidade: excluidas }],
    };
  }
}
