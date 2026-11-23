/**
 * Dados da história: pedidos ao mesmo backend do dashboard (só leitura), com os tipos mínimos de que a história precisa.
 * Esta aplicação não importa nada do dashboard (apps/frontend): pode apagar-se a pasta apps/historia sem afetar mais nada.
 */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function obter<T>(caminho: string): Promise<T> {
  const resposta = await fetch(new URL(caminho, BASE), { cache: "no-store" });
  if (!resposta.ok) {
    throw new Error(`A API respondeu ${resposta.status} em ${caminho}.`);
  }
  return (await resposta.json()) as T;
}

type Nota = 1 | 2 | 3 | null;

interface CriterioMatriz {
  nota: Nota;
  valor: number | null;
  numerador: number;
  denominador: number;
}

interface AlavancaMatriz {
  impacto: CriterioMatriz;
  robustez: CriterioMatriz;
  esforco: { nota: Nota; rotulo: string };
}

export interface VisaoGeral {
  volume: {
    pedidos: { valor: number | null; diasComAtividade: number };
    unidades: { valor: number | null };
  };
  abc: { totalReferencias: number; classes: { classe: string; referencias: number; percentagemUnidades: number | null }[] };
  matriz: { a: AlavancaMatriz & { impacto: { artigosA: number } }; b: AlavancaMatriz; nota: string };
}

export interface Picking {
  ocupacao: { valor: number | null; ondas: number; ondasCom24: number; percentagemCom24: number | null };
  paragens: { valor: number | null };
}

export interface OndasEPedidos {
  pedidosDivididos: {
    valor: number | null;
    pedidosDivididos: number;
    pedidosValidos: number;
    divididosMaisDe24: number;
    divididosAte24: number;
  };
}

export interface Zonas {
  participacaoPorZona: {
    zonas: { zona: string; percentagem: number }[];
    naoMapeadas: { percentagem: number | null; unidades: number; rc01Unidades: number };
  };
}

export interface Carga {
  porHora: { hora: number; pedidos: number; diasComAtividade: number; pedidosPorDia: number | null }[];
  porDiaDaSemana: { nome: string; domingo: boolean; pedidos: number; diasComAtividade: number }[];
}

export interface OndasIncompletas {
  ondasDoPicking: number;
  ondasIncompletas: number;
  percentagemIncompletas: number | null;
  ondasSimultaneas: number;
  gruposDiaHora: number;
  pedidosDivididosEnvolvidos: number;
}

export interface Qualidade {
  contagens: { linhasCO: number; percentagemSemCorrespondencia: number | null };
  recolhidoVsEncomendado: {
    encomendado: number;
    recolhido: number;
    diferenca: number;
    ondasSemPicking: number;
    referenciasNuncaRecolhidas: number;
    semCausaConhecida: number;
  };
  limitacoes: string[];
  perguntasAoDocente: string[];
}

export interface DadosHistoria {
  visao: VisaoGeral;
  picking: Picking;
  ondasEPedidos: OndasEPedidos;
  zonas: Zonas;
  carga: Carga;
  incompletas: OndasIncompletas;
  qualidade: Qualidade;
}

/** Todos os números da história, do dataset completo (sem filtros). */
export async function obterDadosHistoria(): Promise<DadosHistoria> {
  const [visao, picking, ondasEPedidos, zonas, carga, incompletas, qualidade] = await Promise.all([
    obter<VisaoGeral>("/api/visao-geral"),
    obter<Picking>("/api/ondas-e-pedidos/picking"),
    obter<OndasEPedidos>("/api/ondas-e-pedidos"),
    obter<Zonas>("/api/artigos/zonas"),
    obter<Carga>("/api/ondas-e-pedidos/carga"),
    obter<OndasIncompletas>("/api/ondas-e-pedidos/ondas-incompletas"),
    obter<Qualidade>("/api/qualidade"),
  ]);
  return { visao, picking, ondasEPedidos, zonas, carga, incompletas, qualidade };
}
