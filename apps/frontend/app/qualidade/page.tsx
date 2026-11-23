import type { Metadata } from "next";
import { Suspense, ViewTransition, type ReactNode } from "react";
import { ErroApi } from "@/components/erro-api";
import Link from "next/link";
import { CartaoResumo, FaixaKpi } from "@/components/faixa-kpi";
import { BarraParteTodo, BarraSegmentos } from "@/components/mini-graficos";
import { TabelaRecolhida } from "@/components/tabela-recolhida";
import { VerDetalhe } from "@/components/ver-detalhe";
import { obterQualidade, obterSensibilidadeDuplicados, type Qualidade } from "@/lib/api";
import { consulta, filtrosDeObjeto, type FiltrosUrl } from "@/lib/filtros";
import { formatarNumero, formatarPercentagemOuNulo } from "@/lib/formatar";

export const metadata: Metadata = { title: "Qualidade dos dados" };

export default function QualidadePage({ searchParams }: PageProps<"/qualidade">) {
  // Fade curto só ao entrar e sair da página (não a cada bloco de dados que carrega): ver globals.css.
  return (
    <ViewTransition enter="troca" exit="troca" default="none">
    <section>
      <h1 className="text-2xl font-semibold">Qualidade dos dados e limitações</h1>
      <p className="mt-1 text-sm text-stone-500">
        Até que ponto se pode confiar nos números: o que falta, o que foi excluído e porquê, sobre todo o histórico.
        Os números principais primeiro e o detalhe por baixo.
      </p>
      <Suspense fallback={<div className="mt-6 h-64 animate-pulse rounded-lg border border-stone-200 bg-white" />}>
        <ConteudoQualidade searchParams={searchParams} />
      </Suspense>
    </section>
    </ViewTransition>
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
            grafico={
              <BarraParteTodo
                parte={r.recolhido}
                todo={r.encomendado}
                classe="bg-[#2a78d6]"
                titulo={`${formatarNumero(r.encomendado)} unidades encomendadas`}
                rotuloParte="recolhidas"
                rotuloResto="nunca recolhidas"
              />
            }
          />
          <CartaoResumo
            titulo="Linhas de encomenda sem recolha correspondente"
            valor={formatarPercentagemOuNulo(c.percentagemSemCorrespondencia)}
            grafico={
              <BarraParteTodo
                parte={c.linhasCO - c.linhasSemCorrespondencia}
                todo={c.linhasCO}
                classe="bg-[#2a78d6]"
                titulo={`${formatarNumero(c.linhasCO)} linhas de encomenda`}
                rotuloParte="encontram a sua recolha"
                rotuloResto="sem recolha correspondente"
              />
            }
          />
          <CartaoResumo
            titulo="Recolhido em sítios fora do mapa"
            valor={formatarPercentagemOuNulo(naoMapeadas.percentagemRecolhido)}
            unidade="do recolhido"
            grafico={
              <BarraSegmentos
                titulo={`${formatarNumero(r.recolhido)} unidades recolhidas`}
                segmentos={[
                  { valor: r.recolhido - naoMapeadas.unidades, rotulo: "em sítios que estão no mapa", classe: "bg-stone-300" },
                  { valor: rc01?.unidades ?? 0, rotulo: "na área RC-01", classe: "bg-amber-500" },
                  { valor: naoMapeadas.unidades - (rc01?.unidades ?? 0), rotulo: `noutros ${formatarNumero(Math.max(0, naoMapeadas.localizacoes.length - 1))} sítios fora do mapa`, classe: "bg-amber-300" },
                ]}
              />
            }
          />
          <CartaoResumo
            titulo="Linhas duplicadas (contam como reais)"
            valor={formatarNumero(c.linhasDuplicadas)}
            unidade="linhas"
            grafico={
              <BarraParteTodo
                parte={c.linhasDuplicadas}
                todo={c.linhasCO}
                classe="bg-[#2a78d6]"
                titulo={`${formatarNumero(c.linhasCO)} linhas de encomenda`}
                rotuloParte="repetem outra linha"
                rotuloResto="únicas"
              />
            }
            leitura={`Têm ${formatarNumero(c.unidadesDuplicadas)} unidades e contam como encomendas reais.`}
          />
          <CartaoResumo
            titulo="Ligações repartidas por várias zonas"
            valor={formatarPercentagemOuNulo(ligacoesRepartidas.valor)}
            grafico={
              <BarraParteTodo
                parte={ligacoesRepartidas.linhasRepartidas}
                todo={ligacoesRepartidas.linhasLigadas}
                classe="bg-[#2a78d6]"
                titulo={`${formatarNumero(ligacoesRepartidas.linhasLigadas)} linhas de encomenda com recolha`}
                rotuloParte="recolhidas em 2 ou mais zonas"
                rotuloResto="recolhidas numa só zona"
              />
            }
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
