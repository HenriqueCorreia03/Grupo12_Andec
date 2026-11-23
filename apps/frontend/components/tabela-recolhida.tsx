"use client";

import { useState, type ReactNode } from "react";
import { LINHAS_VISIVEIS } from "@/lib/apresentacao";
import { formatarNumero } from "@/lib/formatar";

interface Props {
  /** Texto da legenda (`<caption>`) da tabela. */
  legenda?: ReactNode;
  /** Conteúdo do `<thead>` (uma ou mais `<tr>`). */
  cabecalho: ReactNode;
  /** Uma `<tr>` por linha, já pela ordem do indicador (com `key`). */
  linhas: ReactNode[];
  /** Abre já com todas as linhas (por exemplo, quando a linha escolhida está fora das primeiras). */
  abertaInicial?: boolean;
  /**
   * Mostra sempre todas as linhas, sem botão: para tabelas que já estão dentro de um "Ver detalhe" fechado, para o
   * detalhe ficar a um só clique.
   */
  semLimite?: boolean;
  classeTabela?: string;
  classeLegenda?: string;
  classeCabecalho?: string;
}

/**
 * Tabela que mostra só as primeiras 10 linhas e um botão "Ver todas (N)" que a abre por inteiro (ticket 19).
 * Só apresenta: as linhas chegam já montadas e ordenadas pelo servidor.
 */
export function TabelaRecolhida({
  legenda,
  cabecalho,
  linhas,
  abertaInicial = false,
  semLimite = false,
  classeTabela = "w-full text-sm",
  classeLegenda = "px-4 py-3 text-left text-sm font-medium text-stone-500",
  classeCabecalho = "border-y border-stone-200 bg-stone-50 text-left text-stone-500",
}: Props) {
  const [aberta, setAberta] = useState(abertaInicial);
  const recolhivel = !semLimite && linhas.length > LINHAS_VISIVEIS;
  const visiveis = aberta || !recolhivel ? linhas : linhas.slice(0, LINHAS_VISIVEIS);

  return (
    <>
      <table className={classeTabela}>
        {legenda && <caption className={classeLegenda}>{legenda}</caption>}
        <thead className={classeCabecalho}>{cabecalho}</thead>
        <tbody>{visiveis}</tbody>
      </table>
      {recolhivel && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-stone-200 px-4 py-2 text-sm text-stone-600">
          <span>
            A mostrar {formatarNumero(visiveis.length)} de {formatarNumero(linhas.length)}.
          </span>
          <button
            type="button"
            onClick={() => setAberta((valor) => !valor)}
            aria-expanded={aberta}
            className="font-medium text-stone-900 underline underline-offset-2"
          >
            {aberta ? `Mostrar só as primeiras ${LINHAS_VISIVEIS}` : `Ver todas (${formatarNumero(linhas.length)})`}
          </button>
        </p>
      )}
    </>
  );
}
