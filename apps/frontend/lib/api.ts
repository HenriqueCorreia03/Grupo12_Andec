/** Contrato de GET /api/visao-geral (backend NestJS). */
export interface Exclusao {
  motivo: string;
  quantidade: number;
}

/** O que todos os indicadores trazem para o tooltip. */
export interface MetadadosIndicador {
  definicao: string;
  fonte: "Customer_Order" | "Customer_Order + Product";
  linhasConsideradas: number;
  exclusoes: Exclusao[];
  nota?: string;
}

export interface TamanhoMedioEncomenda extends MetadadosIndicador {
  valor: number | null;
  mediana: number | null;
  p90: number | null;
  pedidosConsiderados: number;
  pedidosExcluidos: number;
}

export interface PedidosPorOnda extends MetadadosIndicador {
  valor: number | null;
  mediana: number | null;
  ondas: number;
  ondasComUmPedido: number;
}

export interface ParticipacaoPorSetor extends MetadadosIndicador {
  setores: { setor: string; unidades: number; percentagem: number }[];
  limitacao: string | null;
}

export interface PedidosMultissetor extends MetadadosIndicador {
  valor: number | null;
  pedidosMultissetor: number;
  pedidosValidos: number;
  limitacao: string | null;
}

export type ClasseAbc = "A" | "B" | "C";
export const CLASSES_ABC: ClasseAbc[] = ["A", "B", "C"];

export interface ResumoAbc extends MetadadosIndicador {
  classes: { classe: ClasseAbc; referencias: number; unidades: number; percentagemUnidades: number }[];
  totalReferencias: number;
}

export interface ReferenciasAbc extends ResumoAbc {
  classeSelecionada: ClasseAbc | null;
  referencias: { referencia: string; posicao: number; unidades: number; acumuladoAntes: number; classe: ClasseAbc }[];
}

export interface TamanhosReferencia {
  referencia: string;
  classe: ClasseAbc;
  unidades: number;
  tamanhos: { tamanho: number | null; unidades: number; escalaPorConfirmar: boolean }[];
}

export interface VisaoGeral {
  tamanhoMedioEncomenda: TamanhoMedioEncomenda;
  pedidosPorOnda: PedidosPorOnda;
  participacaoPorSetor: ParticipacaoPorSetor;
  pedidosMultissetor: PedidosMultissetor;
  abc: ResumoAbc;
}

function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw new Error("Falta NEXT_PUBLIC_API_URL em apps/frontend/.env.local (ver .env.local.example).");
  }
  return new URL(path, base).toString();
}

/** GET à API; com `nuloSe404`, uma resposta 404 dá nulo em vez de erro. */
async function obter<T>(path: string): Promise<T>;
async function obter<T>(path: string, opcoes: { nuloSe404: true }): Promise<T | null>;
async function obter<T>(path: string, opcoes?: { nuloSe404: true }): Promise<T | null> {
  const res = await fetch(apiUrl(path));
  if (opcoes?.nuloSe404 && res.status === 404) return null;
  if (!res.ok) throw new Error(`A API respondeu ${res.status} em ${path}.`);
  return res.json();
}

/** O frontend só obtém valores através da API do backend. */
export function obterVisaoGeral(): Promise<VisaoGeral> {
  return obter("/api/visao-geral");
}

/** ABC global; com `classe`, só as referências dessa classe. */
export function obterAbc(classe: ClasseAbc | null): Promise<ReferenciasAbc> {
  return obter(classe ? `/api/artigos/abc?classe=${classe}` : "/api/artigos/abc");
}

/** Unidades por tamanho normalizado de uma referência; nulo se a referência não tiver procura. */
export function obterTamanhos(referencia: string): Promise<TamanhosReferencia | null> {
  return obter(`/api/artigos/referencias/${encodeURIComponent(referencia)}/tamanhos`, { nuloSe404: true });
}
