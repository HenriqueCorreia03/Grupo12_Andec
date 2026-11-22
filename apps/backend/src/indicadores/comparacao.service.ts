import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../db/database.module';
import { customerOrder } from '../db/schema';
import { diasComAtividade, porDiaComAtividade } from './atividade';
import type { Filtros } from './filtros';
import type { NaturezaIndicador } from './metadados';
import { type MotivoSemPeriodoAnterior, type Periodo, periodoAnterior } from './periodo';

export interface SemPeriodoAnterior {
  disponivel: false;
  texto: 'sem período anterior';
  motivo: MotivoSemPeriodoAnterior;
}

export interface ComparacaoDisponivel {
  disponivel: true;
  periodoAnterior: Periodo;
  /** Volumes: por dia com atividade; rácios: diretamente (spec, "Comparação no tempo"). */
  modo: 'direto' | 'por dia com atividade';
  /** Valor comparado no período atual (por dia com atividade nos volumes); nulo = "sem dados". */
  valorAtual: number | null;
  valorAnterior: number | null;
  /** (atual − anterior) ÷ anterior × 100, sem arredondamento; 0 → 0 é 0 %; nulo sem dados num dos lados ou de 0 para outro valor. */
  variacao: number | null;
  diasComAtividade: { atual: number; anterior: number };
}

export type Comparacao = SemPeriodoAnterior | ComparacaoDisponivel;

/** Um indicador com valor único: o que se compara. `natureza` por omissão é rácio. */
interface IndicadorComValor {
  definicao: string;
  valor: number | null;
  natureza?: NaturezaIndicador;
  comparacao?: Comparacao;
}

/**
 * Junta a comparação com o período anterior a todos os indicadores de uma resposta da API.
 * O endpoint calcula-se duas vezes (período atual e anterior, com os mesmos outros filtros) e cada
 * indicador com `definicao` e `valor` recebe `comparacao`, emparelhado pelo mesmo caminho no JSON.
 * Indicadores sem valor único (listas de setores, classes ABC) não levam comparação.
 */
@Injectable()
export class ComparacaoService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async comparar<T extends object>(filtros: Filtros, calcular: (filtros: Filtros) => Promise<T>): Promise<T> {
    const atual = await calcular(filtros);
    const anterior = periodoAnterior(filtros, await this.dataMinima());
    if (typeof anterior === 'string') {
      const sem: SemPeriodoAnterior = { disponivel: false, texto: 'sem período anterior', motivo: anterior };
      anotar(atual, null, () => sem);
      return atual;
    }
    const valoresAnteriores = await calcular({ ...filtros, inicio: anterior.inicio, fim: anterior.fim });
    const dias = {
      atual: await diasComAtividade(this.db, filtros),
      anterior: await diasComAtividade(this.db, anterior),
    };
    anotar(atual, valoresAnteriores, (indicador, doAnterior) => {
      const volume = indicador.natureza === 'volume';
      const valorAtual = volume ? porDiaComAtividade(indicador.valor, dias.atual) : indicador.valor;
      const valorAnterior = volume ? porDiaComAtividade(doAnterior?.valor ?? null, dias.anterior) : (doAnterior?.valor ?? null);
      return {
        disponivel: true,
        periodoAnterior: anterior,
        modo: volume ? 'por dia com atividade' : 'direto',
        valorAtual,
        valorAnterior,
        variacao: variacao(valorAtual, valorAnterior),
        diasComAtividade: dias,
      };
    });
    return atual;
  }

  private async dataMinima(): Promise<string | null> {
    const { rows } = await this.db.execute<{ dia: string | null }>(sql`
      select to_char(min(${customerOrder.createdAt}), 'YYYY-MM-DD') as dia from ${customerOrder}
    `);
    return rows[0].dia;
  }
}

/** Variação relativa × 100; 0 → 0 é 0 %; sem dados de um dos lados, ou de 0 para outro valor, não há variação. */
function variacao(atual: number | null, anterior: number | null): number | null {
  if (atual === null || anterior === null) return null;
  if (anterior === 0) return atual === 0 ? 0 : null;
  return ((atual - anterior) / anterior) * 100;
}

function eIndicadorComValor(valor: unknown): valor is IndicadorComValor {
  return typeof valor === 'object' && valor !== null && 'definicao' in valor && 'valor' in valor;
}

/** Percorre o JSON e junta `comparacao` a cada indicador com valor (o par vem do mesmo caminho em `anterior`). */
function anotar(
  atual: unknown,
  anterior: unknown,
  comparar: (indicador: IndicadorComValor, doAnterior: IndicadorComValor | null) => Comparacao,
): void {
  if (typeof atual !== 'object' || atual === null || Array.isArray(atual)) return;
  if (eIndicadorComValor(atual)) {
    atual.comparacao = comparar(atual, eIndicadorComValor(anterior) ? anterior : null);
  }
  for (const [chave, filho] of Object.entries(atual)) {
    const par = typeof anterior === 'object' && anterior !== null ? (anterior as Record<string, unknown>)[chave] : null;
    anotar(filho, par, comparar);
  }
}
