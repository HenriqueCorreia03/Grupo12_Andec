/**
 * Filtros globais (ticket 06a): vivem no URL, por isso persistem ao recarregar e ao mudar de página.
 * O frontend não faz contas de datas: o mês (`mes=aaaa-mm`) vai tal como está e a API converte-o em início e fim.
 */
export const CHAVES_FILTRO = ["mes", "inicio", "fim", "referencia", "classe", "zona", "operador", "onda", "pedido"] as const;
export type ChaveFiltro = (typeof CHAVES_FILTRO)[number];
export type FiltrosUrl = Partial<Record<ChaveFiltro, string>>;

/** `zona=K,O` → ["K", "O"]; sem zona, lista vazia. */
export function zonasDoFiltro(filtros: FiltrosUrl): string[] {
  return filtros.zona ? filtros.zona.split(",") : [];
}

/** Lê os filtros da prop `searchParams` de uma página (servidor); só guarda valores de texto não vazios. */
export function filtrosDeObjeto(params: Record<string, string | string[] | undefined>): FiltrosUrl {
  const filtros: FiltrosUrl = {};
  for (const chave of CHAVES_FILTRO) {
    const valor = params[chave];
    if (typeof valor === "string" && valor !== "") filtros[chave] = valor;
  }
  return filtros;
}

/** Lê os filtros de `useSearchParams()` (cliente). */
export function filtrosDoUrl(params: { get(nome: string): string | null }): FiltrosUrl {
  const filtros: FiltrosUrl = {};
  for (const chave of CHAVES_FILTRO) {
    const valor = params.get(chave);
    if (valor !== null && valor !== "") filtros[chave] = valor;
  }
  return filtros;
}

/** `?mes=2023-02&classe=A`, ou texto vazio sem filtros. `extra` junta outros parâmetros (por exemplo, o detalhe). */
export function consulta(filtros: FiltrosUrl, extra: Record<string, string | null | undefined> = {}): string {
  const params = new URLSearchParams();
  for (const chave of CHAVES_FILTRO) {
    const valor = filtros[chave];
    if (valor) params.set(chave, valor);
  }
  for (const [chave, valor] of Object.entries(extra)) {
    if (valor) params.set(chave, valor);
  }
  const texto = params.toString();
  return texto === "" ? "" : `?${texto}`;
}

/** Só o período (o painel de tamanhos de uma referência já tem a referência no caminho). */
export function soPeriodo(filtros: FiltrosUrl): FiltrosUrl {
  const periodo: FiltrosUrl = {};
  if (filtros.mes) periodo.mes = filtros.mes;
  if (filtros.inicio) periodo.inicio = filtros.inicio;
  if (filtros.fim) periodo.fim = filtros.fim;
  return periodo;
}

/** Um filtro ativo: o texto que o painel mostra e os parâmetros do URL a tirar para o retirar. */
export interface FiltroAtivo {
  descricao: string;
  chaves: ChaveFiltro[];
}

/** Os filtros ativos, pela ordem do painel, cada um com os parâmetros que o compõem (o período pode ser mês ou início/fim). */
export function filtrosAtivosDoUrl(filtros: FiltrosUrl): FiltroAtivo[] {
  const ativos: FiltroAtivo[] = [];
  if (filtros.mes) ativos.push({ descricao: `Mês ${filtros.mes}`, chaves: ["mes"] });
  else if (filtros.inicio || filtros.fim)
    ativos.push({ descricao: `Período ${filtros.inicio ?? "…"} a ${filtros.fim ?? "…"}`, chaves: ["inicio", "fim"] });
  if (filtros.referencia) ativos.push({ descricao: `Referência ${filtros.referencia}`, chaves: ["referencia"] });
  if (filtros.classe) ativos.push({ descricao: `Classe ${filtros.classe} (global)`, chaves: ["classe"] });
  if (filtros.zona) {
    const zonas = filtros.zona.split(",");
    ativos.push({ descricao: `${zonas.length > 1 ? "Zonas" : "Zona"} ${zonas.join(", ")}`, chaves: ["zona"] });
  }
  if (filtros.operador) ativos.push({ descricao: `Operador ${filtros.operador}`, chaves: ["operador"] });
  if (filtros.onda) ativos.push({ descricao: `Onda ${filtros.onda}`, chaves: ["onda"] });
  if (filtros.pedido) ativos.push({ descricao: `Pedido ${filtros.pedido}`, chaves: ["pedido"] });
  return ativos;
}

/** Descrição de cada filtro ativo, para o painel o mostrar sempre. */
export function descreverFiltros(filtros: FiltrosUrl): string[] {
  return filtrosAtivosDoUrl(filtros).map((f) => f.descricao);
}
