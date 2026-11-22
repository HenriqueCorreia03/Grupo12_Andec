/** Contrato de GET /api/visao-geral (backend NestJS). */
export interface Exclusao {
  motivo: string;
  quantidade: number;
}

/** O que todos os indicadores trazem para o tooltip. */
export interface MetadadosIndicador {
  definicao: string;
  fonte: "Customer_Order" | "Customer_Order + Product" | "Picking_Wave" | "Picking_Wave + Storage_Location";
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

/** Contrato de GET /api/ondas-e-pedidos/picking (ticket 04). */
export interface OcupacaoDasOndas extends MetadadosIndicador {
  valor: number | null;
  ondas: number;
  ondasCom24: number;
  ondasMaisDe24: number;
  percentagemCom24: number | null;
  minimo: number | null;
  maximo: number | null;
  distribuicao: { unidades: number; ondas: number }[];
}

export interface Paragens extends MetadadosIndicador {
  valor: number;
}

export interface LocalizacoesPorOnda extends MetadadosIndicador {
  media: number | null;
  mediana: number | null;
  maximo: number | null;
  distribuicao: { localizacoes: number; ondas: number }[];
}

export interface OndaPicking {
  onda: string;
  data: string | null;
  hora: string | null;
  unidades: number;
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

/** Contrato de GET /api/artigos/zonas (ticket 04). */
export interface ParticipacaoPorZona extends MetadadosIndicador {
  zonas: { zona: string; unidades: number; percentagem: number }[];
  naoMapeadas: {
    unidades: number;
    percentagem: number | null;
    rc01Unidades: number;
    localizacoes: { localizacao: string; unidades: number }[];
  };
}

export interface ZonasDoPicking {
  participacaoPorZona: ParticipacaoPorZona;
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

/** Ocupação, paragens e localizações por onda (PW), com a lista de ondas. */
export function obterPicking(): Promise<PickingDasOndas> {
  return obter("/api/ondas-e-pedidos/picking");
}

/** Participação por zona e localizações não mapeadas (PW + Storage_Location). */
export function obterZonas(): Promise<ZonasDoPicking> {
  return obter("/api/artigos/zonas");
}

/** ABC global; com `classe`, só as referências dessa classe. */
export function obterAbc(classe: ClasseAbc | null): Promise<ReferenciasAbc> {
  return obter(classe ? `/api/artigos/abc?classe=${classe}` : "/api/artigos/abc");
}

/** Unidades por tamanho normalizado de uma referência; nulo se a referência não tiver procura. */
export function obterTamanhos(referencia: string): Promise<TamanhosReferencia | null> {
  return obter(`/api/artigos/referencias/${encodeURIComponent(referencia)}/tamanhos`, { nuloSe404: true });
}
