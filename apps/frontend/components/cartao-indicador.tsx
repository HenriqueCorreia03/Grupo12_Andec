"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import type { Comparacao, MetadadosIndicador } from "@/lib/api";
import { formatarData, formatarNumero, formatarVariacao } from "@/lib/formatar";

interface Props {
  titulo: string;
  metadados: MetadadosIndicador;
  /** Valor principal já formatado, repetido no tooltip; nulo = "sem dados". */
  valorResumo: string | null;
  /** Limitação conhecida dos dados, mostrada sempre no cartão. */
  limitacao?: string | null;
  children: ReactNode;
}

/**
 * Cartão de um indicador. Só apresenta: os valores vêm calculados pela API.
 * Ao clicar no cartão (ou no botão "ⓘ", para o teclado) abre a definição, o valor, a variação face ao período
 * anterior, a fonte, a nota e as linhas excluídas com o motivo. Fecha com um novo clique, com Esc ou ao clicar fora.
 * Não depende do rato: funciona igual num ecrã tátil.
 */
export function CartaoIndicador({ titulo, metadados, valorResumo, limitacao, children }: Props) {
  const tooltipId = useId();
  const [aberto, setAberto] = useState(false);
  const cartao = useRef<HTMLElement>(null);

  // Com o cartão aberto, um clique fora ou a tecla Esc fecham-no.
  useEffect(() => {
    if (!aberto) return;
    const fora = (evento: globalThis.MouseEvent) => {
      if (cartao.current && !cartao.current.contains(evento.target as Node)) setAberto(false);
    };
    const escape = (evento: globalThis.KeyboardEvent) => {
      if (evento.key === "Escape") setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", escape);
    };
  }, [aberto]);

  // Um clique numa ligação, botão ou campo dentro do cartão faz o que tem de fazer e não abre a definição.
  function aoClicar(evento: MouseEvent<HTMLElement>) {
    if ((evento.target as HTMLElement).closest("a, button, input, select, textarea, summary")) return;
    setAberto((valor) => !valor);
  }

  function aoCarregar(evento: KeyboardEvent<HTMLElement>) {
    if (evento.key === "Escape") setAberto(false);
  }

  return (
    <article
      ref={cartao}
      onClick={aoClicar}
      onKeyDown={aoCarregar}
      className={`relative cursor-pointer rounded-lg border bg-white p-5 shadow-sm transition-colors ${
        aberto ? "border-stone-900" : "border-stone-200 hover:border-stone-400"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-medium text-stone-500">{titulo}</h2>
        <button
          type="button"
          onClick={() => setAberto((valor) => !valor)}
          aria-expanded={aberto}
          aria-controls={tooltipId}
          aria-label={`Definição de ${titulo}`}
          title="Ver a definição"
          className="-mr-1 -mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-stone-300 text-xs text-stone-600 hover:border-stone-500 hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-stone-400"
        >
          i
        </button>
      </div>
      {children}
      <p className="mt-3 text-xs text-stone-500">Fonte: {metadados.fonte}</p>
      {metadados.filtrosNaoAplicaveis.length > 0 && (
        <p className="mt-2 rounded border border-stone-300 bg-stone-100 px-2 py-1 text-xs text-stone-700">
          Filtro não aplicável a este indicador: {metadados.filtrosNaoAplicaveis.join(", ")}. O valor não o usa.
        </p>
      )}
      {limitacao && (
        <p className="mt-2 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900">{limitacao}</p>
      )}
      <TooltipIndicador id={tooltipId} aberto={aberto} metadados={metadados} valorResumo={valorResumo} />
    </article>
  );
}

function TooltipIndicador({
  id,
  aberto,
  metadados,
  valorResumo,
}: {
  id: string;
  aberto: boolean;
  metadados: MetadadosIndicador;
  valorResumo: string | null;
}) {
  const exclusoes = metadados.exclusoes.filter((e) => e.quantidade > 0);
  return (
    <div
      id={id}
      role="region"
      aria-label="Definição do indicador"
      hidden={!aberto}
      className="absolute left-0 right-0 top-full z-10 mt-2 cursor-default rounded-md bg-stone-900 p-3 text-xs leading-relaxed text-stone-100 shadow-lg"
    >
      <p>{metadados.definicao}</p>
      <p className="mt-1">Valor: {valorResumo ?? "sem dados"}</p>
      <p className="mt-1">{textoComparacao(metadados.comparacao)}</p>
      <p className="mt-1">Fonte: {metadados.fonte}</p>
      {metadados.nota && <p className="mt-1">{metadados.nota}</p>}
      <p className="mt-1">Linhas consideradas: {formatarNumero(metadados.linhasConsideradas)}</p>
      <p className="mt-1">
        Excluídos:{" "}
        {exclusoes.length === 0
          ? "nenhum"
          : exclusoes.map((e) => `${formatarNumero(e.quantidade)} ${e.motivo}`).join("; ")}
      </p>
    </div>
  );
}

/** Linha do tooltip com a variação face ao período anterior (ticket 08). */
function textoComparacao(comparacao: Comparacao | undefined): string {
  if (comparacao === undefined) return "Variação face ao período anterior: não se aplica (o indicador não tem um valor único).";
  if (!comparacao.disponivel) {
    const explicacao =
      comparacao.motivo === "sem filtro de período"
        ? "escolha um período para comparar"
        : "o período anterior fica antes do início dos dados";
    return `Variação: ${comparacao.texto} (${explicacao}).`;
  }
  const { periodoAnterior, modo, valorAtual, valorAnterior, variacao, diasComAtividade } = comparacao;
  const intervalo = `${formatarData(periodoAnterior.inicio)} a ${formatarData(periodoAnterior.fim)}`;
  const comoCompara =
    modo === "por dia com atividade"
      ? `por dia com atividade: ${diasComAtividade.atual} dias vs ${diasComAtividade.anterior}`
      : "comparação direta";
  const valores =
    valorAtual === null || valorAnterior === null
      ? "sem dados para comparar"
      : `${formatarNumero(valorAnterior)} → ${formatarNumero(valorAtual)}`;
  const percentagem = variacao === null ? "" : `${formatarVariacao(variacao)} `;
  return `Variação face a ${intervalo} (${comoCompara}): ${percentagem}(${valores}).`;
}

/** Valor principal de um cartão; "sem dados" quando a API devolve nulo. */
export function ValorIndicador({ texto, unidade }: { texto: string | null; unidade?: string }) {
  if (texto === null) {
    return <p className="mt-2 text-2xl font-semibold text-stone-500">sem dados</p>;
  }
  return (
    <p className="mt-2 text-3xl font-semibold">
      {texto}
      {unidade && <span className="ml-1 text-base font-normal text-stone-500">{unidade}</span>}
    </p>
  );
}

/** Linha de valores secundários (por exemplo, mediana e p90). */
export function DetalhesIndicador({ detalhes }: { detalhes: { rotulo: string; texto: string | null }[] }) {
  return (
    <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {detalhes.map((d) => (
        <div key={d.rotulo} className="flex gap-1">
          <dt className="text-stone-500">{d.rotulo}</dt>
          <dd className="font-medium">{d.texto ?? "sem dados"}</dd>
        </div>
      ))}
    </dl>
  );
}
