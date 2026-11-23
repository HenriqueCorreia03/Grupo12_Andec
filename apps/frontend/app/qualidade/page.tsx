import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { ErroApi } from "@/components/erro-api";
import { CartaoResumo, FaixaKpi } from "@/components/faixa-kpi";
import { TabelaRecolhida } from "@/components/tabela-recolhida";
import { VerDetalhe } from "@/components/ver-detalhe";
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
        pelo ETL. Os números principais primeiro; o detalhe vem por baixo.
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
  const rc01 = naoMapeadas.localizacoes.find((l) => l.localizacao === "RC-01");

  return (
    <>
      {q.filtrosNaoAplicaveis.length > 0 && (
        <p className="mt-4 rounded border border-stone-300 bg-stone-100 px-2 py-1 text-xs text-stone-700">
          Filtro não aplicável a esta página: {q.filtrosNaoAplicaveis.join(", ")}. Os valores usam sempre o dataset
          completo.
        </p>
      )}

      <div className="mt-6">
        <FaixaKpi rotulo="Números principais da qualidade dos dados">
          <CartaoResumo
            titulo="Encomendado que não foi recolhido"
            valor={formatarNumero(r.diferenca)}
            unidade="un."
            leitura={`Encomendado ${formatarNumero(r.encomendado)} un.; recolhido ${formatarNumero(r.recolhido)} un.`}
          />
          <CartaoResumo
            titulo="Linhas do CO sem correspondência no PW"
            valor={formatarPercentagemOuNulo(c.percentagemSemCorrespondencia)}
            leitura={`${formatarNumero(c.linhasSemCorrespondencia)} de ${formatarNumero(c.linhasCO)} linhas do Customer_Order.`}
          />
          <CartaoResumo
            titulo="Recolhido em localizações não mapeadas"
            valor={formatarPercentagemOuNulo(naoMapeadas.percentagemRecolhido)}
            unidade="do recolhido"
            leitura={
              `${formatarNumero(naoMapeadas.unidades)} un. em ${formatarNumero(naoMapeadas.localizacoes.length)} localizações` +
              (rc01 ? `; RC-01: ${formatarNumero(rc01.unidades)} un.` : ".")
            }
          />
          <CartaoResumo
            titulo="Linhas duplicadas (contam como reais)"
            valor={formatarNumero(c.linhasDuplicadas)}
            unidade="linhas"
            leitura={`${formatarNumero(c.unidadesDuplicadas)} un. nessas linhas.`}
          />
          <CartaoResumo
            titulo="Ligações repartidas por várias zonas"
            valor={formatarPercentagemOuNulo(ligacoesRepartidas.valor)}
            leitura={`${formatarNumero(ligacoesRepartidas.linhasRepartidas)} de ${formatarNumero(ligacoesRepartidas.linhasLigadas)} linhas ligadas.`}
          />
        </FaixaKpi>
      </div>

      <div className="mt-8">
        <DecomposicaoDiferenca recolhido={r} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
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
          {naoMapeadas.localizacoes.length > 0 && (
            <VerDetalhe
              titulo={`lista das ${formatarNumero(naoMapeadas.localizacoes.length)} localizações (RC-01 primeiro)`}
              className="mt-3"
            >
              <TabelaRecolhida
                semLimite
                classeCabecalho="text-left text-stone-500"
                cabecalho={
                  <tr>
                    <th className="px-4 py-1 font-normal">Localização</th>
                    <th className="px-4 py-1 text-right font-normal">Unidades</th>
                    <th className="px-4 py-1 text-right font-normal">Referências</th>
                  </tr>
                }
                linhas={naoMapeadas.localizacoes.map((l) => (
                  <tr
                    key={l.localizacao}
                    className={`border-t border-stone-100 ${l.localizacao === "RC-01" ? "font-semibold" : ""}`}
                  >
                    <td className="px-4 py-0.5">{l.localizacao}</td>
                    <td className="px-4 py-0.5 text-right">{formatarNumero(l.unidades)}</td>
                    <td className="px-4 py-0.5 text-right">{formatarNumero(l.referencias)}</td>
                  </tr>
                ))}
              />
            </VerDetalhe>
          )}
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

/**
 * Resumo visual da página: a diferença entre encomendado e recolhido, numa barra com as três parcelas pela ordem da
 * decomposição. As parcelas vêm da API; aqui só se calcula a largura de cada uma.
 */
function DecomposicaoDiferenca({ recolhido: r }: { recolhido: Qualidade["recolhidoVsEncomendado"] }) {
  const parcelas = [
    { rotulo: "Ondas sem picking", unidades: r.ondasSemPicking, cor: "bg-stone-700" },
    {
      rotulo: `Referências nunca recolhidas (${formatarNumero(r.nReferenciasNuncaRecolhidas)})`,
      unidades: r.referenciasNuncaRecolhidas,
      cor: "bg-stone-400",
    },
    { rotulo: "Sem causa conhecida", unidades: r.semCausaConhecida, cor: "bg-amber-400" },
  ];
  return (
    <figure className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <figcaption className="text-sm font-medium text-stone-500">
        Encomendado que não foi recolhido: {formatarNumero(r.diferenca)} un. ={" "}
        {parcelas.map((p) => formatarNumero(p.unidades)).join(" + ")}
      </figcaption>
      {r.diferenca > 0 ? (
        <div className="mt-3 flex h-6 overflow-hidden rounded" aria-hidden="true">
          {parcelas.map((p) => (
            <span key={p.rotulo} className={p.cor} style={{ width: `${(p.unidades / r.diferenca) * 100}%` }} />
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-stone-500">sem diferença</p>
      )}
      <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {parcelas.map((p) => (
          <li key={p.rotulo} className="flex items-center gap-2">
            <span className={`inline-block h-3 w-3 rounded-sm ${p.cor}`} />
            {p.rotulo}: <span className="font-medium">{formatarNumero(p.unidades)} un.</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
