"use client";

import { useEffect, useState } from "react";

/**
 * Alterna entre modo claro e modo escuro. O modo vive na classe `escuro` do <html> (as cores estão em globals.css)
 * e a escolha fica guardada no browser; sem escolha, segue o sistema (ver o script em app/layout.tsx).
 */
export function BotaoTema() {
  const [escuro, setEscuro] = useState<boolean | null>(null);

  useEffect(() => {
    setEscuro(document.documentElement.classList.contains("escuro"));
  }, []);

  function alternar() {
    const novo = !document.documentElement.classList.contains("escuro");
    document.documentElement.classList.toggle("escuro", novo);
    try {
      localStorage.setItem("tema", novo ? "escuro" : "claro");
    } catch {
      // Sem acesso ao armazenamento (modo privado): o modo muda na mesma, só não fica guardado.
    }
    setEscuro(novo);
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={escuro ?? undefined}
      className="inline-flex min-h-9 items-center gap-2 rounded-full border border-stone-300 bg-white px-3 text-sm text-stone-700 hover:border-stone-500 hover:text-stone-900"
    >
      <span aria-hidden="true">{escuro ? "☀" : "☾"}</span>
      {escuro === null ? "Tema" : escuro ? "Modo claro" : "Modo escuro"}
    </button>
  );
}
