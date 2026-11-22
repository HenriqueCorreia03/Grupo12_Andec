"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CLASSES_ABC } from "@/lib/api";
import { consulta, descreverFiltros, filtrosDoUrl, zonasDoFiltro, type FiltrosUrl } from "@/lib/filtros";

/**
 * Painel de filtros comum às 4 páginas. O estado vive no URL (não aqui): mudar de página mantém a seleção
 * e o painel mostra sempre os filtros ativos. Não faz contas de datas: o mês vai tal como está para a API.
 */
/** Zonas do armazém mapeadas no Storage_Location (A a R). */
const ZONAS = "ABCDEFGHIJKLMNOPQR".split("");

export function PainelFiltros() {
  const filtros = filtrosDoUrl(useSearchParams());
  // A chave reinicia o formulário quando o URL muda (por exemplo, ao limpar ou ao navegar para trás).
  return <FormularioFiltros key={consulta(filtros)} filtros={filtros} />;
}

function FormularioFiltros({ filtros }: { filtros: FiltrosUrl }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mes, setMes] = useState(filtros.mes ?? "");
  const [inicio, setInicio] = useState(filtros.inicio ?? "");
  const [fim, setFim] = useState(filtros.fim ?? "");
  const [referencia, setReferencia] = useState(filtros.referencia ?? "");
  const [classe, setClasse] = useState(filtros.classe ?? "");
  const [zonas, setZonas] = useState<string[]>(zonasDoFiltro(filtros));
  const [operador, setOperador] = useState(filtros.operador ?? "");
  const [onda, setOnda] = useState(filtros.onda ?? "");
  const [pedido, setPedido] = useState(filtros.pedido ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const ativos = descreverFiltros(filtros);

  function aplicar(evento: FormEvent) {
    evento.preventDefault();
    if (mes === "" && (inicio === "") !== (fim === "")) {
      setErro("Indique o início e o fim do período (ou só o mês).");
      return;
    }
    if (mes === "" && inicio !== "" && inicio > fim) {
      setErro("O início do período é posterior ao fim.");
      return;
    }
    setErro(null);
    const novos: FiltrosUrl = {};
    if (mes !== "") novos.mes = mes;
    else if (inicio !== "") {
      novos.inicio = inicio;
      novos.fim = fim;
    }
    if (referencia.trim() !== "") novos.referencia = referencia.trim();
    if (classe !== "") novos.classe = classe;
    if (zonas.length > 0) novos.zona = ZONAS.filter((z) => zonas.includes(z)).join(",");
    if (operador.trim() !== "") novos.operador = operador.trim();
    if (onda.trim() !== "") novos.onda = onda.trim();
    if (pedido.trim() !== "") novos.pedido = pedido.trim();
    router.push(`${pathname}${consulta(novos)}`);
  }

  function limpar() {
    router.push(pathname);
  }

  const campo = "mt-1 rounded border border-stone-300 bg-white px-2 py-1 text-sm";
  return (
    <section aria-label="Filtros" className="border-t border-stone-200 bg-stone-50">
      <form onSubmit={aplicar} className="mx-auto flex max-w-6xl flex-wrap items-end gap-x-4 gap-y-2 px-6 py-3">
        <label className="text-xs text-stone-500">
          Mês
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className={`${campo} block`}
            aria-describedby="ajuda-periodo"
          />
        </label>
        <span className="pb-1.5 text-xs text-stone-400">ou</span>
        <label className="text-xs text-stone-500">
          De
          <input
            type="date"
            value={inicio}
            disabled={mes !== ""}
            onChange={(e) => setInicio(e.target.value)}
            className={`${campo} block disabled:opacity-40`}
          />
        </label>
        <label className="text-xs text-stone-500">
          Até
          <input
            type="date"
            value={fim}
            disabled={mes !== ""}
            onChange={(e) => setFim(e.target.value)}
            className={`${campo} block disabled:opacity-40`}
          />
        </label>
        <label className="text-xs text-stone-500">
          Referência
          <input
            type="text"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            className={`${campo} block w-32`}
          />
        </label>
        <label className="text-xs text-stone-500">
          Classe ABC (global)
          <select value={classe} onChange={(e) => setClasse(e.target.value)} className={`${campo} block`}>
            <option value="">Todas</option>
            {CLASSES_ABC.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <details className="relative text-xs text-stone-500">
          <summary className={`${campo} cursor-pointer list-none`}>
            Zonas: {zonas.length === 0 ? "todas" : ZONAS.filter((z) => zonas.includes(z)).join(", ")}
          </summary>
          <fieldset className="absolute z-20 mt-1 grid w-64 grid-cols-6 gap-1 rounded border border-stone-300 bg-white p-2 shadow">
            <legend className="sr-only">Zonas (pode escolher várias)</legend>
            {ZONAS.map((z) => (
              <label key={z} className="flex items-center gap-1 text-sm text-stone-800">
                <input
                  type="checkbox"
                  checked={zonas.includes(z)}
                  onChange={(e) => setZonas(e.target.checked ? [...zonas, z] : zonas.filter((x) => x !== z))}
                />
                {z}
              </label>
            ))}
          </fieldset>
        </details>
        <label className="text-xs text-stone-500">
          Operador (picking)
          <input type="text" value={operador} onChange={(e) => setOperador(e.target.value)} className={`${campo} block w-28`} />
        </label>
        <label className="text-xs text-stone-500">
          Onda
          <input type="text" value={onda} onChange={(e) => setOnda(e.target.value)} className={`${campo} block w-24`} />
        </label>
        <label className="text-xs text-stone-500">
          Pedido
          <input type="text" value={pedido} onChange={(e) => setPedido(e.target.value)} className={`${campo} block w-24`} />
        </label>
        <button type="submit" className="rounded bg-stone-900 px-3 py-1.5 text-sm text-white hover:bg-stone-700">
          Aplicar
        </button>
        <button
          type="button"
          onClick={limpar}
          disabled={ativos.length === 0}
          className="rounded border border-stone-300 px-3 py-1.5 text-sm hover:bg-white disabled:opacity-40"
        >
          Limpar
        </button>
      </form>
      <div className="mx-auto max-w-6xl px-6 pb-3 text-sm" aria-live="polite">
        <span id="ajuda-periodo" className="text-stone-500">
          Filtros ativos:{" "}
        </span>
        {ativos.length === 0 ? (
          <span className="text-stone-400">nenhum</span>
        ) : (
          ativos.map((descricao) => (
            <span key={descricao} className="mr-2 inline-block rounded-full bg-stone-900 px-2.5 py-0.5 text-xs text-white">
              {descricao}
            </span>
          ))
        )}
        {erro && (
          <span role="alert" className="ml-2 text-amber-700">
            {erro}
          </span>
        )}
      </div>
    </section>
  );
}
