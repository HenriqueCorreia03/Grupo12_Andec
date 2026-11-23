import type { Metadata } from "next";
import { Suspense } from "react";
import { Navegacao } from "@/components/navegacao";
import { PainelFiltros } from "@/components/painel-filtros";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Armazém de calçado: prioridades de operação",
    template: "%s · Armazém de calçado",
  },
  description:
    "Dashboard para comparar as alavancas de melhoria do armazém: localizações e ondas de picking.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-PT" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {/* O cabeçalho e os filtros ficam parados durante as transições (ver globals.css). */}
        <header className="border-b border-stone-200 bg-white" style={{ viewTransitionName: "cabecalho" }}>
          <div className="mx-auto max-w-6xl px-6 py-4">
            <p className="text-sm text-stone-500">Armazém de calçado</p>
            <p className="text-lg font-semibold">Prioridades de operação</p>
          </div>
          {/* Os dois leem o URL (useSearchParams): precisam de um limite de Suspense. */}
          <Suspense fallback={<div className="h-10" />}>
            <Navegacao />
          </Suspense>
          <Suspense fallback={<div className="h-24 border-t border-stone-200 bg-stone-50" />}>
            <PainelFiltros />
          </Suspense>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
