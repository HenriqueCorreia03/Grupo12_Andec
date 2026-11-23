import type { ReactNode } from "react";

/**
 * Faixa de KPI no topo de cada página (ticket 19): 3 a 6 cartões com o valor principal de cada indicador.
 * A ordem das secções é sempre (1) KPI, (2) resumo visual, (3) detalhe.
 */
export function FaixaKpi({ children, rotulo = "Indicadores principais" }: { children: ReactNode; rotulo?: string }) {
  return (
    <div role="group" aria-label={rotulo} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

/** Esqueleto da faixa enquanto a API responde. */
export function FaixaKpiACarregar({ cartoes = 6 }: { cartoes?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: cartoes }, (_, i) => (
        <div key={i} className="h-32 animate-pulse rounded-lg border border-stone-200 bg-white" />
      ))}
    </div>
  );
}

/**
 * Cartão de resumo sem tooltip, para valores que a API não acompanha de metadados de indicador (página de qualidade).
 * Só apresenta: o valor e a frase de leitura chegam já formatados.
 */
export function CartaoResumo({
  titulo,
  valor,
  unidade,
  leitura,
  grafico,
}: {
  titulo: string;
  valor: string | null;
  unidade?: string;
  leitura?: string | null;
  /** Mini-gráfico do cartão (parte de um todo). */
  grafico?: ReactNode;
}) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-medium text-stone-500">{titulo}</h2>
      {valor === null ? (
        <p className="mt-2 text-2xl font-semibold text-stone-500">sem dados</p>
      ) : (
        <p className="mt-2 text-3xl font-semibold">
          {valor}
          {unidade && <span className="ml-1 text-base font-normal text-stone-500">{unidade}</span>}
        </p>
      )}
      {grafico}
      {leitura && <p className="mt-1 text-sm text-stone-600">{leitura}</p>}
    </article>
  );
}
