/** Contrato de GET /api/visao-geral (backend NestJS). */
export interface TamanhoMedioEncomenda {
  valor: number | null;
  mediana: number | null;
  p90: number | null;
  pedidosConsiderados: number;
  pedidosExcluidos: number;
  definicao: string;
  fonte: string;
}

export interface VisaoGeral {
  tamanhoMedioEncomenda: TamanhoMedioEncomenda;
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
