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

export interface VisaoGeral {
  tamanhoMedioEncomenda: TamanhoMedioEncomenda;
  pedidosPorOnda: PedidosPorOnda;
  participacaoPorSetor: ParticipacaoPorSetor;
  pedidosMultissetor: PedidosMultissetor;
}

function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw new Error("Falta NEXT_PUBLIC_API_URL em apps/frontend/.env.local (ver .env.local.example).");
  }
  return new URL(path, base).toString();
}

/** O frontend só obtém valores através da API do backend. */
export async function obterVisaoGeral(): Promise<VisaoGeral> {
  const res = await fetch(apiUrl("/api/visao-geral"));
  if (!res.ok) throw new Error(`A API respondeu ${res.status} em /api/visao-geral.`);
  return res.json();
}
