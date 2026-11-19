import type { Metadata } from "next";
import { Navegacao } from "@/components/navegacao";
import "./globals.css";

export const metadata: Metadata = {
  title: "Armazém de calçado: prioridades de operação",
  description:
    "Dashboard para comparar as alavancas de melhoria do armazém: localizações e ondas de picking.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-PT" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-4">
            <p className="text-sm text-stone-500">Armazém de calçado</p>
            <p className="text-lg font-semibold">Prioridades de operação</p>
          </div>
          <Navegacao />
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
