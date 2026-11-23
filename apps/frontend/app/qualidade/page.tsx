import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { ErroApi } from "@/components/erro-api";
import { obterQualidade, type Qualidade } from "@/lib/api";
import { filtrosDeObjeto } from "@/lib/filtros";
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
  const filtros = filtrosDeObjeto(await searchParams);
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
