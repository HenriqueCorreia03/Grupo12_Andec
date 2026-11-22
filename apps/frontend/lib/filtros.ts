/**
 * Filtros globais (ticket 06a): vivem no URL, por isso persistem ao recarregar e ao mudar de página.
 * O frontend não faz contas de datas: o mês (`mes=aaaa-mm`) vai tal como está e a API converte-o em início e fim.
 */
export const CHAVES_FILTRO = ["mes", "inicio", "fim", "referencia", "classe", "operador", "onda", "pedido"] as const;
export type ChaveFiltro = (typeof CHAVES_FILTRO)[number];
export type FiltrosUrl = Partial<Record<ChaveFiltro, string>>;

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

/** Descrição de cada filtro ativo, para o painel o mostrar sempre. */
export function descreverFiltros(filtros: FiltrosUrl): string[] {
  const descricoes: string[] = [];
  if (filtros.mes) descricoes.push(`Mês ${filtros.mes}`);
  else if (filtros.inicio && filtros.fim) descricoes.push(`Período ${filtros.inicio} a ${filtros.fim}`);
  else if (filtros.inicio || filtros.fim) descricoes.push(`Período ${filtros.inicio ?? "…"} a ${filtros.fim ?? "…"}`);
  if (filtros.referencia) descricoes.push(`Referência ${filtros.referencia}`);
  if (filtros.classe) descricoes.push(`Classe ${filtros.classe} (global)`);
  if (filtros.operador) descricoes.push(`Operador ${filtros.operador}`);
  if (filtros.onda) descricoes.push(`Onda ${filtros.onda}`);
  if (filtros.pedido) descricoes.push(`Pedido ${filtros.pedido}`);
  return descricoes;
}
