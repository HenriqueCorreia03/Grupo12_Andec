import type { Filtros } from './filtros';

/** Intervalo de dias, aaaa-mm-dd inclusivos. */
export interface Periodo {
  inicio: string;
  fim: string;
}

export type MotivoSemPeriodoAnterior = 'sem filtro de período' | 'período anterior antes do início dos dados';

/**
 * Período anterior (ticket 08; spec, "Comparação no tempo"):
 * - com um mês selecionado (do dia 1 ao último dia do mesmo mês), é o mês anterior;
 * - com outro intervalo, é o intervalo com a mesma duração imediatamente antes.
 *
 * "Sem período anterior" quando não há filtro de período, ou quando o anterior começa antes dos dados.
 * Regra combinada pela equipa (22/11/2026): com um mês selecionado, o mês conta como unidade, por isso o
 * mês anterior só falha se for anterior ao mês da data mínima; com um intervalo, compara-se dia a dia.
 */
export function periodoAnterior(
  filtros: Pick<Filtros, 'inicio' | 'fim'>,
  dataMinima: string | null,
): Periodo | MotivoSemPeriodoAnterior {
  if (filtros.inicio === null || filtros.fim === null) return 'sem filtro de período';
  if (dataMinima === null) return 'período anterior antes do início dos dados';

  if (eMesCompleto(filtros.inicio, filtros.fim)) {
    const inicio = primeiroDiaDoMesAnterior(filtros.inicio);
    if (inicio < `${dataMinima.slice(0, 7)}-01`) return 'período anterior antes do início dos dados';
    return { inicio, fim: somarDias(filtros.inicio, -1) };
  }

  const duracao = diasEntre(filtros.inicio, filtros.fim) + 1;
  const anterior = { inicio: somarDias(filtros.inicio, -duracao), fim: somarDias(filtros.inicio, -1) };
  if (anterior.inicio < dataMinima) return 'período anterior antes do início dos dados';
  return anterior;
}

function eMesCompleto(inicio: string, fim: string): boolean {
  return inicio.endsWith('-01') && inicio.slice(0, 7) === fim.slice(0, 7) && somarDias(fim, 1).endsWith('-01');
}

function primeiroDiaDoMesAnterior(dia: string): string {
  const data = paraData(dia);
  return paraTexto(new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth() - 1, 1)));
}

function somarDias(dia: string, dias: number): string {
  const data = paraData(dia);
  data.setUTCDate(data.getUTCDate() + dias);
  return paraTexto(data);
}

function diasEntre(inicio: string, fim: string): number {
  return Math.round((paraData(fim).getTime() - paraData(inicio).getTime()) / 86_400_000);
}

function paraData(dia: string): Date {
  const [ano, mes, d] = dia.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, d));
}

function paraTexto(data: Date): string {
  return data.toISOString().slice(0, 10);
}
