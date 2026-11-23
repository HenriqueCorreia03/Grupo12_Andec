"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { CLASSES_ABC } from "@/lib/api";
import { consulta, descreverFiltros, filtrosDoUrl, zonasDoFiltro, type FiltrosUrl } from "@/lib/filtros";

/** Zonas do armazém mapeadas no Storage_Location (A a R). */
const ZONAS = "ABCDEFGHIJKLMNOPQR".split("");

/**
 * Painel de filtros comum às 4 páginas. O estado vive no URL (não aqui): mudar de página mantém a seleção
 * e o painel mostra sempre os filtros ativos. Não faz contas de datas: o mês vai tal como está para a API.
 * Fica recolhido por omissão (os filtros ativos continuam visíveis ao lado) para não tapar os indicadores.
 */
export function PainelFiltros() {
  const filtros = filtrosDoUrl(useSearchParams());
  // A chave reinicia o formulário quando o URL muda (ao aplicar, limpar ou navegar para trás): fica recolhido outra vez.
  return <FormularioFiltros key={consulta(filtros)} filtros={filtros} />;
}

function FormularioFiltros({ filtros }: { filtros: FiltrosUrl }) {
  const router = useRouter();
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
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

  const campo = "mt-1 block rounded border border-stone-300 bg-white px-2 py-1.5 text-sm";
  return (
    <section aria-label="Filtros" className="border-t border-stone-200 bg-stone-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-6 py-2.5">
        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          aria-expanded={aberto}
          aria-controls="corpo-filtros"
          className="inline-flex items-center gap-2 rounded border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium hover:border-stone-500"
        >
          <span aria-hidden="true">{aberto ? "▾" : "▸"}</span>
          Filtros
          {ativos.length > 0 && (
            <span className="rounded-full bg-stone-900 px-1.5 text-xs font-normal text-white" aria-label={`${ativos.length} ativos`}>
              {ativos.length}
            </span>
          )}
        </button>
        <div className="flex flex-wrap items-center gap-1.5 text-sm" aria-live="polite">
          <span id="ajuda-periodo" className="text-stone-600">
            Filtros ativos:
          </span>
          {ativos.length === 0 ? (
            <span className="text-stone-600">nenhum (todo o histórico)</span>
          ) : (
            ativos.map((descricao) => (
              <span key={descricao} className="rounded-full bg-stone-900 px-2.5 py-0.5 text-xs text-white">
                {descricao}
              </span>
            ))
          )}
        </div>
        {ativos.length > 0 && (
          <button type="button" onClick={limpar} className="text-sm text-stone-700 underline underline-offset-2 hover:text-stone-900">
            Limpar tudo
          </button>
        )}
        {erro && (
          <span role="alert" className="text-sm text-amber-800">
            {erro}
          </span>
        )}
      </div>

      <form
        id="corpo-filtros"
        hidden={!aberto}
        onSubmit={aplicar}
        className="mx-auto max-w-6xl border-t border-stone-200 px-6 py-4"
      >
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-3">
          <Grupo titulo="Período">
            <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
              <label className="text-xs text-stone-600">
                Mês
                <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className={campo} aria-describedby="ajuda-periodo" />
              </label>
              <span className="pb-2 text-xs text-stone-600">ou</span>
              <label className="text-xs text-stone-600">
                De
                <input type="date" value={inicio} disabled={mes !== ""} onChange={(e) => setInicio(e.target.value)} className={`${campo} disabled:opacity-40`} />
              </label>
              <label className="text-xs text-stone-600">
                Até
                <input type="date" value={fim} disabled={mes !== ""} onChange={(e) => setFim(e.target.value)} className={`${campo} disabled:opacity-40`} />
              </label>
            </div>
          </Grupo>

          <Grupo titulo="Artigo">
            <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
              <label className="text-xs text-stone-600">
                Referência
                <input type="text" value={referencia} onChange={(e) => setReferencia(e.target.value)} className={`${campo} w-32`} />
              </label>
              <label className="text-xs text-stone-600">
                Classe ABC (global)
                <select value={classe} onChange={(e) => setClasse(e.target.value)} className={campo}>
                  <option value="">Todas</option>
                  {CLASSES_ABC.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <div className="text-xs text-stone-600">
                Zonas
                <details className="relative">
                  <summary className={`${campo} min-w-28 cursor-pointer list-none`}>
                    {zonas.length === 0 ? "Todas" : ZONAS.filter((z) => zonas.includes(z)).join(", ")}
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
              </div>
            </div>
          </Grupo>

          <Grupo titulo="Operação">
            <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
              <label className="text-xs text-stone-600">
                Operador (picking)
                <input type="text" value={operador} onChange={(e) => setOperador(e.target.value)} className={`${campo} w-32`} placeholder="Operator_1" />
              </label>
              <label className="text-xs text-stone-600">
                Onda
                <input type="text" value={onda} onChange={(e) => setOnda(e.target.value)} className={`${campo} w-24`} />
              </label>
              <label className="text-xs text-stone-600">
                Pedido
                <input type="text" value={pedido} onChange={(e) => setPedido(e.target.value)} className={`${campo} w-24`} />
              </label>
            </div>
          </Grupo>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button type="submit" className="rounded bg-stone-900 px-4 py-1.5 text-sm text-white hover:bg-stone-700">
            Aplicar
          </button>
          <button type="button" onClick={() => setAberto(false)} className="rounded border border-stone-300 px-3 py-1.5 text-sm hover:bg-white">
            Fechar
          </button>
        </div>
      </form>
    </section>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold uppercase tracking-wide text-stone-700">{titulo}</legend>
      <div className="mt-2">{children}</div>
    </fieldset>
  );
}
