import type { ReactNode } from "react";

/**
 * Bloco "Ver detalhe", fechado por omissão (ticket 19): grelhas e listas que servem para auditar ficam a um clique,
 * sem ocupar o ecrã.
 */
export function VerDetalhe({ titulo, children, className = "" }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <details className={`rounded-lg border border-stone-200 bg-white ${className}`}>
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-stone-700 hover:text-stone-900">
        Ver detalhe: {titulo}
      </summary>
      <div className="border-t border-stone-200">{children}</div>
    </details>
  );
}
