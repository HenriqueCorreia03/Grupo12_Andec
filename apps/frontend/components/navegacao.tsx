"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { consulta, filtrosDoUrl } from "@/lib/filtros";

const PAGINAS = [
  { href: "/", titulo: "Visão geral" },
  { href: "/artigos", titulo: "Artigos, ABC e localizações" },
  { href: "/ondas", titulo: "Ondas e pedidos" },
  { href: "/qualidade", titulo: "Qualidade dos dados" },
] as const;

/** Navegação entre as 4 páginas; os filtros ativos vão no URL de cada ligação, por isso mantêm-se. */
export function Navegacao() {
  const pathname = usePathname();
  const filtros = consulta(filtrosDoUrl(useSearchParams()));
  return (
    <nav aria-label="Páginas" className="mx-auto flex max-w-6xl flex-wrap gap-x-1 px-6">
      {PAGINAS.map(({ href, titulo }) => {
        const ativa = pathname === href;
        return (
          <Link
            key={href}
            href={`${href}${filtros}`}
            aria-current={ativa ? "page" : undefined}
            className={
              "border-b-2 px-3 py-2 text-sm " +
              (ativa
                ? "border-stone-900 font-medium text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-900")
            }
          >
            {titulo}
          </Link>
        );
      })}
    </nav>
  );
}
