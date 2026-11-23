import type { NotaMatriz } from "./api";

/**
 * Estado de negócio de uma nota da matriz (ticket 20): uma só regra de cores em todo o dashboard.
 * Vermelho = precisa de ação; amarelo = atenção; verde = está bem. A nota (1–3) vem da API, pelos limiares da spec;
 * aqui só se traduz a nota numa palavra e numa cor. Módulo sem "use client": serve servidor e cliente.
 */
export type Estado = "mal" | "atencao" | "bem";

/** Critério da matriz. No impacto, nota 3 = muito espaço de melhoria = problema grande; nos outros, 3 = está bem. */
export type Criterio = "impacto" | "robustez" | "esforco";

const PALAVRAS: Record<Criterio, Record<NotaMatriz, string>> = {
  impacto: { 3: "muito a melhorar", 2: "algo a melhorar", 1: "pouco a melhorar" },
  robustez: { 3: "fiável", 2: "razoável", 1: "pouco fiável" },
  esforco: { 3: "esforço baixo", 2: "esforço médio", 1: "esforço alto" },
};

/** Estado de uma nota: no impacto a escala inverte-se (muito a melhorar = vermelho). */
export function estadoDaNota(criterio: Criterio, nota: NotaMatriz): Estado {
  const boa = criterio === "impacto" ? 1 : 3;
  const ma = criterio === "impacto" ? 3 : 1;
  if (nota === boa) return "bem";
  if (nota === ma) return "mal";
  return "atencao";
}

/** Palavra curta que acompanha sempre a cor (a cor nunca vai sozinha). */
export function palavraDaNota(criterio: Criterio, nota: NotaMatriz): string {
  return PALAVRAS[criterio][nota];
}

/** Classes Tailwind de cada estado; "sem dados" fica cinzento. */
export const COR_DO_ESTADO: Record<Estado | "semDados", { fundo: string; texto: string; marca: string }> = {
  mal: { fundo: "border-rose-300 bg-rose-50", texto: "text-rose-800", marca: "bg-rose-500" },
  atencao: { fundo: "border-amber-300 bg-amber-50", texto: "text-amber-800", marca: "bg-amber-400" },
  bem: { fundo: "border-emerald-300 bg-emerald-50", texto: "text-emerald-800", marca: "bg-emerald-500" },
  semDados: { fundo: "border-stone-200 bg-white", texto: "text-stone-500", marca: "bg-stone-300" },
};

/** Legenda comum: o que cada cor quer dizer. */
export const LEGENDA_DAS_CORES: { estado: Estado; texto: string }[] = [
  { estado: "mal", texto: "precisa de ação" },
  { estado: "atencao", texto: "atenção" },
  { estado: "bem", texto: "está bem" },
];
