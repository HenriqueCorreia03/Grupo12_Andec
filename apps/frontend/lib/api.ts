import { consulta, soPeriodo, type FiltrosUrl } from "./filtros";

/** Contrato de GET /api/visao-geral (backend NestJS). */
export interface Exclusao {
  motivo: string;
  quantidade: number;
}

/** O que todos os indicadores trazem para o tooltip. */
export interface MetadadosIndicador {
  definicao: string;
  fonte:
    | "Customer_Order"
    | "Customer_Order + Product"
    | "Picking_Wave"
    | "Picking_Wave + Storage_Location"
    | "Customer_Order + Picking_Wave + Storage_Location";
  linhasConsideradas: number;
  exclusoes: Exclusao[];
  /** Filtros pedidos que este indicador não consegue aplicar (por exemplo, "operador" num indicador de encomenda). */
  filtrosNaoAplicaveis: string[];
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
  /** Classes no período, só com as referências com movimento; a % é nula quando não há unidades ("sem dados"). */
  classes: { classe: ClasseAbc; referencias: number; unidades: number; percentagemUnidades: number | null }[];
  totalReferencias: number;
}

export interface ReferenciasAbc extends ResumoAbc {
  classeSelecionada: ClasseAbc | null;
  /** `classe` é a global (fixa, a do filtro); `classePeriodo` é a do período, nula sem movimento. */
  referencias: {
    referencia: string;
    posicao: number | null;
    unidades: number;
    acumuladoAntes: number | null;
    classe: ClasseAbc;
    classePeriodo: ClasseAbc | null;
  }[];
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

/** Contrato de GET /api/ondas-e-pedidos. */
export interface PedidosDivididos extends MetadadosIndicador {
  valor: number | null;
  pedidosDivididos: number;
  pedidosValidos: number;
  divididosMaisDe24: number;
  divididosAte24: number;
  percentagemAte24: number | null;
}

export interface OndasEPedidos {
  pedidosDivididos: PedidosDivididos;
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
  valor: number | null;
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
  unidadesDaOnda: number;
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

/** Unidades encomendadas repartidas por zona (ligação CO ↔ PW); fracionárias, arredondadas só ao mostrar. */
export interface UnidadesEncomendadasPorZona extends MetadadosIndicador {
  zonas: { zona: string; unidades: number }[];
  naoMapeada: number;
  semZona: number;
  total: number;
}

export interface PedidosMultizona extends MetadadosIndicador {
  valor: number | null;
  pedidosMultizona: number;
  pedidosValidos: number;
}

export interface ZonasDoPicking {
  /** Zonas do filtro, a destacar; as repartições mostram sempre todas as zonas. */
  zonasSelecionadas: string[];
  participacaoPorZona: ParticipacaoPorZona;
  unidadesEncomendadasPorZona: UnidadesEncomendadasPorZona;
  pedidosMultizona: PedidosMultizona;
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
export function obterVisaoGeral(filtros: FiltrosUrl = {}): Promise<VisaoGeral> {
  return obter(`/api/visao-geral${consulta(filtros)}`);
}

/** Indicadores da página Ondas e pedidos (pedidos divididos). */
export function obterOndasEPedidos(filtros: FiltrosUrl = {}): Promise<OndasEPedidos> {
  return obter(`/api/ondas-e-pedidos${consulta(filtros)}`);
}

/** Ocupação, paragens e localizações por onda (PW), com a lista de ondas. */
export function obterPicking(filtros: FiltrosUrl = {}): Promise<PickingDasOndas> {
  return obter(`/api/ondas-e-pedidos/picking${consulta(filtros)}`);
}

/** Participação por zona e localizações não mapeadas (PW + Storage_Location). */
export function obterZonas(filtros: FiltrosUrl = {}): Promise<ZonasDoPicking> {
  return obter(`/api/artigos/zonas${consulta(filtros)}`);
}

/** ABC no período, com as referências do âmbito dos filtros (a classe do filtro é a global). */
export function obterAbc(filtros: FiltrosUrl = {}): Promise<ReferenciasAbc> {
  return obter(`/api/artigos/abc${consulta(filtros)}`);
}

/** Unidades por tamanho normalizado de uma referência no período; nulo se a referência não tiver procura. */
export function obterTamanhos(referencia: string, filtros: FiltrosUrl = {}): Promise<TamanhosReferencia | null> {
  return obter(
    `/api/artigos/referencias/${encodeURIComponent(referencia)}/tamanhos${consulta(soPeriodo(filtros))}`,
    { nuloSe404: true },
  );
}
