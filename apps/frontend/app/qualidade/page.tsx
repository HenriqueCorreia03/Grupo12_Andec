import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { ErroApi } from "@/components/erro-api";
import Link from "next/link";
import { obterQualidade, obterSensibilidadeDuplicados, type Qualidade } from "@/lib/api";
import { consulta, filtrosDeObjeto, type FiltrosUrl } from "@/lib/filtros";
import { formatarNumero, formatarPercentagemOuNulo } from "@/lib/formatar";

export const metadata: Metadata = { title: "Qualidade dos dados" };

export default function QualidadePage({ searchParams }: PageProps<"/qualidade">) {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Qualidade dos dados e limitações</h1>
      <p className="mt-1 text-sm text-stone-500">
        Exclusões, decomposições e limitações do dataset completo, calculadas no servidor a partir dos CSV carregados
        pelo ETL.
      </p>
      <Suspense fallback={<div className="mt-6 h-64 animate-pulse rounded-lg border border-stone-200 bg-white" />}>
        <ConteudoQualidade searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function ConteudoQualidade({ searchParams }: { searchParams: PageProps<"/qualidade">["searchParams"] }) {
  const params = await searchParams;
  const filtros = filtrosDeObjeto(params);
  // O alternador do ticket 17 é só desta página: não é um filtro global e não passa para as outras.
  const semDuplicados = params.duplicados === "sem";
  let q: Qualidade;
  try {
    q = await obterQualidade(filtros);
  } catch (e) {
    return (
      <div className="mt-6">
        <ErroApi mensagem={(e as Error).message} />
      </div>
    );
  }
  const { contagens: c, recolhidoVsEncomendado: r, naoMapeadas, ligacoesRepartidas, escalaPorConfirmar } = q;
  const pct = (valor: number | null) => formatarPercentagemOuNulo(valor) ?? "sem dados";

  return (
    <>
      {q.filtrosNaoAplicaveis.length > 0 && (
        <p className="mt-4 rounded border border-stone-300 bg-stone-100 px-2 py-1 text-xs text-stone-700">
          Filtro não aplicável a esta página: {q.filtrosNaoAplicaveis.join(", ")}. Os valores usam sempre o dataset
          completo.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Seccao titulo="Exclusões e contagens">
          <Tabela
            linhas={[
              ["Linhas do Customer_Order", formatarNumero(c.linhasCO)],
              ["Linhas duplicadas (contam como reais)", `${formatarNumero(c.linhasDuplicadas)} (${formatarNumero(c.unidadesDuplicadas)} un.)`],
              ["Linhas com 0 un.", formatarNumero(c.linhasZero)],
              ["Pedidos com 0 un. (excluídos dos pedidos)", formatarNumero(c.pedidosZero)],
              ["Linhas com tamanho vazio", formatarNumero(c.linhasTamanhoVazio)],
              ["Linhas com tamanho fora das escalas conhecidas", formatarNumero(c.linhasForaDasEscalas)],
              [
                "Linhas do CO sem correspondência no PW",
                `${formatarNumero(c.linhasSemCorrespondencia)} (${pct(c.percentagemSemCorrespondencia)})`,
              ],
              ["Ondas sem picking", `${formatarNumero(c.ondasSemPicking)} (${formatarNumero(c.unidadesOndasSemPicking)} un.)`],
            ]}
          />
        </Seccao>

        <Seccao titulo="Recolhido vs encomendado">
          <p className="text-sm text-stone-700">
            Encomendado {formatarNumero(r.encomendado)} un. − recolhido {formatarNumero(r.recolhido)} un. ={" "}
            <strong>{formatarNumero(r.diferenca)} un.</strong>, decompostas por esta ordem:
          </p>
          <Tabela
            linhas={[
              ["1. Unidades em ondas sem picking", formatarNumero(r.ondasSemPicking)],
              [
                `2. Referências nunca recolhidas (${formatarNumero(r.nReferenciasNuncaRecolhidas)}), em ondas com picking`,
                formatarNumero(r.referenciasNuncaRecolhidas),
              ],
              ["3. Sem causa conhecida", formatarNumero(r.semCausaConhecida)],
            ]}
          />
          <p className="mt-2 text-xs text-stone-500">
            {formatarNumero(r.diferenca)} = {formatarNumero(r.ondasSemPicking)} + {formatarNumero(r.referenciasNuncaRecolhidas)} +{" "}
            {formatarNumero(r.semCausaConhecida)}
          </p>
        </Seccao>

        <Seccao titulo="Localizações não mapeadas">
          <p className="text-sm text-stone-700">
            {formatarNumero(naoMapeadas.unidades)} un. recolhidas em {formatarNumero(naoMapeadas.localizacoes.length)}{" "}
            localizações que não existem no Storage_Location ({pct(naoMapeadas.percentagemRecolhido)} do recolhido).
          </p>
          <div className="mt-2 max-h-72 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-stone-500">
                  <th className="font-normal">Localização</th>
                  <th className="text-right font-normal">Unidades</th>
                  <th className="text-right font-normal">Referências</th>
                </tr>
              </thead>
              <tbody>
                {naoMapeadas.localizacoes.map((l) => (
                  <tr key={l.localizacao} className={l.localizacao === "RC-01" ? "font-semibold" : undefined}>
                    <td className="py-0.5">{l.localizacao}</td>
                    <td className="text-right">{formatarNumero(l.unidades)}</td>
                    <td className="text-right">{formatarNumero(l.referencias)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Seccao>

        <Seccao titulo="Ligação CO ↔ PW e tamanhos">
          <Tabela
            linhas={[
              [
                "Ligações repartidas por várias zonas",
                `${pct(ligacoesRepartidas.valor)} (${formatarNumero(ligacoesRepartidas.linhasRepartidas)} de ${formatarNumero(ligacoesRepartidas.linhasLigadas)} linhas ligadas)`,
              ],
              [
                "Escala de tamanhos 215–305",
                `${formatarNumero(escalaPorConfirmar.linhasCO)} linhas no CO; ${formatarNumero(escalaPorConfirmar.linhasPW)} no PW (${escalaPorConfirmar.estado})`,
              ],
            ]}
          />
          <p className="mt-2 text-xs text-stone-500">
            Uma ligação repartida é uma linha do CO cujas unidades recolhidas ficam em 2 ou mais zonas mapeadas; &quot;não
            mapeada&quot; não conta como zona.
          </p>
        </Seccao>

        <Suspense fallback={<div className="h-48 animate-pulse rounded-lg border border-stone-200 bg-white lg:col-span-2" />}>
          <SensibilidadeDuplicados semDuplicados={semDuplicados} filtros={filtros} />
        </Suspense>

        <Seccao titulo="Limitações conhecidas">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-stone-700">
            {q.limitacoes.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ol>
        </Seccao>

        <Seccao titulo="Perguntas ao docente">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-stone-700">
            {q.perguntasAoDocente.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
        </Seccao>
      </div>
    </>
  );
}

/**
 * Sensibilidade aos duplicados (ticket 17): o alternador mostra o tamanho médio e o ABC com a regra escolhida e,
 * ao lado, a diferença para a regra principal. O resto da aplicação usa sempre "com duplicados".
 */
async function SensibilidadeDuplicados({ semDuplicados, filtros }: { semDuplicados: boolean; filtros: FiltrosUrl }) {
  let dados: Awaited<ReturnType<typeof obterSensibilidadeDuplicados>>;
  try {
    dados = await obterSensibilidadeDuplicados();
  } catch (e) {
    return (
      <div className="lg:col-span-2">
        <ErroApi mensagem={(e as Error).message} />
      </div>
    );
  }
  const atual = semDuplicados ? dados.sem : dados.com;
  const t = atual.tamanhoMedioEncomenda;
  const tCom = dados.com.tamanhoMedioEncomenda;
  const classeCom = (classe: string) => dados.com.abc.classes.find((c) => c.classe === classe);
  const opcao = (sem: boolean, rotulo: string) => {
    const ativa = sem === semDuplicados;
    return (
      <Link
        href={`/qualidade${consulta(filtros, { duplicados: sem ? "sem" : null })}`}
        aria-current={ativa ? "true" : undefined}
        scroll={false}
        className={`rounded px-3 py-1.5 text-sm ${ativa ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100"}`}
      >
        {rotulo}
      </Link>
    );
  };

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-stone-500">Sensibilidade aos duplicados</h2>
        <nav aria-label="Regra dos duplicados" className="inline-flex gap-1 rounded-md border border-stone-300 p-0.5">
          {opcao(false, "Com duplicados (regra principal)")}
          {opcao(true, "Sem duplicados")}
        </nav>
      </div>
      <p className="mt-2 text-sm text-stone-700">
        {semDuplicados
          ? "Sem as linhas do Customer_Order idênticas a outra. Só esta secção muda: o resto da aplicação usa sempre a regra principal, com duplicados."
          : "As linhas idênticas do Customer_Order contam como reais. É a regra usada em toda a aplicação."}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[1fr_2fr]">
        <div>
          <p className="text-xs text-stone-500">Tamanho médio da encomenda</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{t.valor === null ? "sem dados" : `${formatarNumero(t.valor)} un.`}</p>
          <p className="mt-1 text-xs text-stone-500">
            {formatarNumero(t.pedidosConsiderados)} pedidos
            {semDuplicados && tCom.valor !== null && <> · com duplicados: {formatarNumero(tCom.valor)} un.</>}
          </p>
        </div>
        <table className="w-full text-sm">
          <caption className="text-left text-xs text-stone-500">Classificação ABC (dataset completo)</caption>
          <thead>
            <tr className="text-left text-stone-500">
              <th className="py-1 font-normal">Classe</th>
              <th className="py-1 text-right font-normal">Referências</th>
              <th className="py-1 text-right font-normal">Unidades</th>
              <th className="py-1 text-right font-normal">% das unidades</th>
              {semDuplicados && <th className="py-1 text-right font-normal">Com duplicados</th>}
            </tr>
          </thead>
          <tbody>
            {atual.abc.classes.map((c) => {
              const com = classeCom(c.classe);
              return (
                <tr key={c.classe} className="border-t border-stone-100">
                  <td className="py-1 font-medium">{c.classe}</td>
                  <td className="py-1 text-right tabular-nums">{formatarNumero(c.referencias)}</td>
                  <td className="py-1 text-right tabular-nums">{formatarNumero(c.unidades)}</td>
                  <td className="py-1 text-right tabular-nums">{formatarPercentagemOuNulo(c.percentagemUnidades) ?? "sem dados"}</td>
                  {semDuplicados && (
                    <td className="py-1 text-right tabular-nums text-stone-500">
                      {com ? `${formatarNumero(com.referencias)} ref. · ${formatarPercentagemOuNulo(com.percentagemUnidades) ?? "sem dados"}` : "—"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function Seccao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="mb-2 text-sm font-medium text-stone-500">{titulo}</h2>
      {children}
    </article>
  );
}

function Tabela({ linhas }: { linhas: [string, string][] }) {
  return (
    <table className="mt-1 w-full text-sm">
      <tbody>
        {linhas.map(([rotulo, valor]) => (
          <tr key={rotulo} className="border-t border-stone-100 first:border-t-0">
            <td className="py-1 pr-4 text-stone-700">{rotulo}</td>
            <td className="py-1 text-right font-medium">{valor}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
