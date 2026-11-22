import Link from "next/link";
import { Suspense } from "react";
import { ErroApi } from "@/components/erro-api";
import { obterAbc, obterTamanhos, type ReferenciasAbc } from "@/lib/api";
import { consulta, filtrosDeObjeto, type FiltrosUrl } from "@/lib/filtros";
import { formatarNumero, formatarPercentagemOuNulo } from "@/lib/formatar";
import { ParticipacaoZonas } from "./zonas";

const CARREGAR = <div className="mt-6 h-64 animate-pulse rounded-lg border border-stone-200 bg-white" />;

export default function ArtigosPage({ searchParams }: PageProps<"/artigos">) {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Artigos, ABC e localizações</h1>
      <p className="mt-1 text-sm text-stone-500">
        Alavanca (a). Clique numa classe para ver as referências e numa referência para ver as unidades por tamanho.
        Os filtros do painel aplicam-se a tudo nesta página.
      </p>
      <Suspense fallback={CARREGAR}>
        <DrillDownAbc searchParams={searchParams} />
      </Suspense>
      <h2 className="mt-10 text-lg font-semibold">Zonas e localizações não mapeadas</h2>
      <div className="mt-4">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-lg border border-stone-200 bg-white" />}>
          <ZonasDoPeriodo searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  );
}

async function ZonasDoPeriodo({ searchParams }: { searchParams: PageProps<"/artigos">["searchParams"] }) {
  return <ParticipacaoZonas filtros={filtrosDeObjeto(await searchParams)} />;
}

async function DrillDownAbc({ searchParams }: { searchParams: PageProps<"/artigos">["searchParams"] }) {
  const params = await searchParams;
  const filtros = filtrosDeObjeto(params);
  // `detalhe` é a referência escolhida na tabela (painel de tamanhos); `referencia` é o filtro global.
  const detalhe = typeof params.detalhe === "string" && params.detalhe !== "" ? params.detalhe : null;

  let abc: ReferenciasAbc;
  try {
    abc = await obterAbc(filtros);
  } catch (e) {
    return (
      <div className="mt-6">
        <ErroApi mensagem={(e as Error).message} />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <SeletorClasse abc={abc} filtros={filtros} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <TabelaReferencias abc={abc} filtros={filtros} detalhe={detalhe} />
        {detalhe && (
          <Suspense fallback={<div className="h-64 animate-pulse rounded-lg border border-stone-200 bg-white" />}>
            <PainelTamanhos referencia={detalhe} filtros={filtros} />
          </Suspense>
        )}
      </div>
    </div>
  );
}

/** Mantém os outros filtros e troca só a classe global (ou tira-a). */
function hrefClasse(filtros: FiltrosUrl, classe: string | null): string {
  return `/artigos${consulta({ ...filtros, classe: classe ?? undefined })}`;
}

function SeletorClasse({ abc, filtros }: { abc: ReferenciasAbc; filtros: FiltrosUrl }) {
  const classe = abc.classeSelecionada;
  const opcao = (ativa: boolean) =>
    "rounded-lg border px-4 py-3 text-left " +
    (ativa ? "border-stone-900 bg-white shadow-sm" : "border-stone-200 bg-white/60 hover:border-stone-400");
  return (
    <nav aria-label="Classes ABC" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Link href={hrefClasse(filtros, null)} aria-current={classe === null ? "page" : undefined} className={opcao(classe === null)}>
        <span className="block text-sm text-stone-500">Todas</span>
        <span className="text-lg font-semibold">{formatarNumero(abc.totalReferencias)} refs</span>
      </Link>
      {abc.classes.map((c) => (
        <Link
          key={c.classe}
          href={hrefClasse(filtros, c.classe)}
          aria-current={classe === c.classe ? "page" : undefined}
          className={opcao(classe === c.classe)}
        >
          <span className="block text-sm text-stone-500">Classe {c.classe} no período</span>
          <span className="text-lg font-semibold">{formatarNumero(c.referencias)} refs</span>
          <span className="ml-2 text-sm text-stone-500">
            {formatarPercentagemOuNulo(c.percentagemUnidades) ?? "sem dados"} das un.
          </span>
        </Link>
      ))}
    </nav>
  );
}

function TabelaReferencias({ abc, filtros, detalhe }: { abc: ReferenciasAbc; filtros: FiltrosUrl; detalhe: string | null }) {
  const classe = abc.classeSelecionada;
  if (abc.referencias.length === 0) {
    return <p className="rounded-lg border border-stone-200 bg-white p-5 text-sm text-stone-400">sem dados</p>;
  }
  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      <table className="w-full text-sm">
        <caption className="px-4 py-3 text-left text-sm font-medium text-stone-500">
          {classe ? `Referências da classe global ${classe}` : "Todas as referências"} ({formatarNumero(abc.referencias.length)}),
          por unidades encomendadas no período
        </caption>
        <thead className="border-y border-stone-200 bg-stone-50 text-left text-stone-500">
          <tr>
            <th className="px-4 py-2 font-normal">#</th>
            <th className="px-4 py-2 font-normal">Referência</th>
            <th className="px-4 py-2 text-right font-normal">Unidades</th>
            <th className="px-4 py-2 text-right font-normal">Acumulado antes</th>
            <th className="px-4 py-2 text-center font-normal">Classe no período</th>
            <th className="px-4 py-2 text-center font-normal">Classe global</th>
          </tr>
        </thead>
        <tbody>
          {abc.referencias.map((r) => {
            const ativa = r.referencia === detalhe;
            return (
              <tr key={r.referencia} className={ativa ? "bg-amber-50" : "border-t border-stone-100"}>
                <td className="px-4 py-1.5 text-stone-500">{r.posicao ?? "—"}</td>
                <td className="px-4 py-1.5">
                  <Link
                    href={`/artigos${consulta(filtros, { detalhe: r.referencia })}`}
                    aria-current={ativa ? "true" : undefined}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {r.referencia}
                  </Link>
                </td>
                <td className="px-4 py-1.5 text-right">{formatarNumero(r.unidades)}</td>
                <td className="px-4 py-1.5 text-right">{formatarPercentagemOuNulo(r.acumuladoAntes) ?? "—"}</td>
                <td className="px-4 py-1.5 text-center font-semibold">{r.classePeriodo ?? "—"}</td>
                <td className="px-4 py-1.5 text-center font-semibold">{r.classe}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

async function PainelTamanhos({ referencia, filtros }: { referencia: string; filtros: FiltrosUrl }) {
  let tamanhos;
  try {
    tamanhos = await obterTamanhos(referencia, filtros);
  } catch (e) {
    return <ErroApi mensagem={(e as Error).message} />;
  }
  if (tamanhos === null) {
    return (
      <aside className="h-fit rounded-lg border border-stone-200 bg-white p-5 text-sm">
        <p className="font-medium">{referencia}</p>
        <p className="mt-2 text-stone-400">sem procura: a referência não tem unidades encomendadas.</p>
      </aside>
    );
  }
  if (tamanhos.tamanhos.length === 0) {
    return (
      <aside className="h-fit rounded-lg border border-stone-200 bg-white p-5 text-sm">
        <p className="font-medium">{tamanhos.referencia}</p>
        <p className="mt-2 text-stone-400">sem dados: a referência não tem unidades encomendadas no período.</p>
      </aside>
    );
  }
  const maximo = Math.max(...tamanhos.tamanhos.map((t) => t.unidades));
  return (
    <aside className="h-fit rounded-lg border border-stone-200 bg-white p-5">
      <h2 className="text-sm font-medium text-stone-500">Unidades por tamanho</h2>
      <p className="mt-1 text-lg font-semibold">
        {tamanhos.referencia}{" "}
        <span className="text-sm font-normal text-stone-500">
          · classe global {tamanhos.classe} · {formatarNumero(tamanhos.unidades)} un. no período
        </span>
      </p>
      <ul className="mt-3 space-y-1 text-sm">
        {tamanhos.tamanhos.map((t) => (
          <li key={t.tamanho ?? "vazio"} className="grid grid-cols-[5rem_1fr_4rem] items-center gap-2">
            <span>
              {t.tamanho === null ? "sem tamanho" : formatarNumero(t.tamanho)}
              {t.escalaPorConfirmar && <span title="Escala 215–305 por confirmar"> *</span>}
            </span>
            <span className="h-3 rounded bg-stone-300" style={{ width: `${(t.unidades / maximo) * 100}%` }} />
            <span className="text-right font-medium">{formatarNumero(t.unidades)}</span>
          </li>
        ))}
      </ul>
      {tamanhos.tamanhos.some((t) => t.escalaPorConfirmar) && (
        <p className="mt-3 text-xs text-stone-500">* Escala de tamanhos 215–305 mantida sem interpretação (por confirmar).</p>
      )}
      <p className="mt-3 text-xs text-stone-500">Tamanhos normalizados (por exemplo, 95 → 9,5). Fonte: Customer_Order.</p>
    </aside>
  );
}
