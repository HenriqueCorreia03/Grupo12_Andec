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
      <h1 className="text-2xl font-semibold">Qualidade dos dados</h1>
      <p className="mt-1 text-sm text-stone-500">
        Podemos confiar nos números? Primeiro a resposta; depois o que falta, o que fizemos aos dados e o que eles não
        dizem.
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

  // Percentagens das três verificações do topo (complementos dos valores da API, só para mostrar a parte "boa").
  const ligadas = c.linhasCO === 0 ? null : ((c.linhasCO - c.linhasSemCorrespondencia) * 100) / c.linhasCO;
  const recolhidas = r.encomendado === 0 ? null : (r.recolhido * 100) / r.encomendado;
  const noMapa = naoMapeadas.percentagemRecolhido === null ? null : 100 - naoMapeadas.percentagemRecolhido;

  return (
    <>
      {q.filtrosNaoAplicaveis.length > 0 && (
        <p className="mt-4 rounded border border-stone-300 bg-stone-100 px-2 py-1 text-xs text-stone-700">
          Filtro não aplicável a esta página: {q.filtrosNaoAplicaveis.join(", ")}. Os valores usam sempre o dataset
          completo.
        </p>
      )}

      {/* 1. A resposta: três verificações sobre todo o histórico. */}
      <section className="mt-6" aria-labelledby="titulo-resposta">
        <h2 id="titulo-resposta" className="text-lg font-semibold">
          Na maior parte, sim.
        </h2>
        <p className="mt-1 text-sm text-stone-600">Três verificações, sobre todo o histórico:</p>
        <div className="mt-3">
          <FaixaKpi rotulo="Três verificações da qualidade dos dados">
            <CartaoResumo
              titulo="As encomendas ligam ao que foi recolhido"
              valor={formatarPercentagemOuNulo(ligadas)}
              unidade="das linhas"
              grafico={
                <BarraParteTodo
                  parte={c.linhasCO - c.linhasSemCorrespondencia}
                  todo={c.linhasCO}
                  classe="bg-emerald-500"
                  titulo={`${formatarNumero(c.linhasCO)} linhas de encomenda`}
                  rotuloParte="encontram a sua recolha"
                  rotuloResto="sem recolha correspondente"
                />
              }
              leitura="É esta ligação que permite contar os pedidos divididos entre ondas."
            />
            <CartaoResumo
              titulo="Quase tudo o que se encomendou foi recolhido"
              valor={formatarPercentagemOuNulo(recolhidas)}
              unidade="das unidades"
              grafico={
                <BarraParteTodo
                  parte={r.recolhido}
                  todo={r.encomendado}
                  classe="bg-emerald-500"
                  titulo={`${formatarNumero(r.encomendado)} unidades encomendadas`}
                  rotuloParte="recolhidas"
                  rotuloResto="nunca recolhidas"
                />
              }
              leitura={`As ${formatarNumero(r.diferenca)} que faltam estão explicadas logo abaixo.`}
            />
            <CartaoResumo
              titulo="Sabemos de onde sai quase tudo"
              valor={formatarPercentagemOuNulo(noMapa)}
              unidade="do recolhido"
              grafico={
                <BarraSegmentos
                  titulo={`${formatarNumero(r.recolhido)} unidades recolhidas`}
                  segmentos={[
                    { valor: r.recolhido - naoMapeadas.unidades, rotulo: "em sítios que estão no mapa", classe: "bg-emerald-500" },
                    { valor: rc01?.unidades ?? 0, rotulo: "na área RC-01 (fora do mapa)", classe: "bg-amber-500" },
                    {
                      valor: naoMapeadas.unidades - (rc01?.unidades ?? 0),
                      rotulo: `noutros ${formatarNumero(Math.max(0, naoMapeadas.localizacoes.length - 1))} sítios fora do mapa`,
                      classe: "bg-amber-300",
                    },
                  ]}
                />
              }
              leitura="Fora do mapa não se vê quão espalhados estão os artigos."
            />
          </FaixaKpi>
        </div>
      </section>

      {/* 2. O que falta, explicado. */}
      <section className="mt-10" aria-labelledby="titulo-faltam">
        <h2 id="titulo-faltam" className="text-lg font-semibold">
          Porque faltam {formatarNumero(r.diferenca)} unidades?
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          São unidades encomendadas que nunca aparecem no registo de recolha. Explicamos cada parte, por esta ordem:
        </p>
        <div className="mt-3">
          <DecomposicaoDiferenca recolhido={r} ondasSemRecolha={c.ondasSemPicking} />
        </div>
      </section>

      {/* 3. As regras aplicadas aos dados. */}
      <section className="mt-10" aria-labelledby="titulo-regras">
        <h2 id="titulo-regras" className="text-lg font-semibold">
          O que fizemos aos dados
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Regras aplicadas antes de calcular qualquer indicador. Os ficheiros originais nunca são alterados.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Seccao titulo="Regras de limpeza">
            <Tabela
              linhas={[
                [
                  "Linhas de encomenda iguais a outra",
                  `${formatarNumero(c.linhasDuplicadas)} (${formatarNumero(c.unidadesDuplicadas)} un.): contam como reais`,
                ],
                ["Linhas com 0 unidades", `${formatarNumero(c.linhasZero)}: ficam de fora`],
                ["Pedidos sem nenhuma unidade", `${formatarNumero(c.pedidosZero)}: ficam de fora`],
                ["Linhas sem tamanho", `${formatarNumero(c.linhasTamanhoVazio)}: contam, sem tamanho`],
                [
                  "Tamanhos entre 215 e 305 (outra escala)",
                  `${formatarNumero(escalaPorConfirmar.linhasCO)} linhas de encomenda e ${formatarNumero(escalaPorConfirmar.linhasPW)} recolhas: ficam como estão`,
                ],
                [
                  "Linhas recolhidas em 2 ou mais zonas",
                  `${formatarNumero(ligacoesRepartidas.linhasRepartidas)} (${pct(ligacoesRepartidas.valor)}): as unidades repartem-se pelas zonas`,
                ],
              ]}
            />
          </Seccao>

          <Seccao titulo="Sítios fora do mapa">
            <p className="text-sm text-stone-700">
              {formatarNumero(naoMapeadas.unidades)} unidades saíram de {formatarNumero(naoMapeadas.localizacoes.length)}{" "}
              sítios que não estão no mapa do armazém; {formatarNumero(rc01?.unidades ?? 0)} delas da área RC-01. Contam
              para os totais, mas não para a análise por zona.
            </p>
            {naoMapeadas.localizacoes.length > 0 && (
              <VerDetalhe
                titulo={`lista dos ${formatarNumero(naoMapeadas.localizacoes.length)} sítios (RC-01 primeiro)`}
                className="mt-3"
              >
                <TabelaRecolhida
                  semLimite
                  classeCabecalho="text-left text-stone-500"
                  cabecalho={
                    <tr>
                      <th className="px-4 py-1 font-normal">Localização</th>
                      <th className="px-4 py-1 text-right font-normal">Unidades</th>
                      <th className="px-4 py-1 text-right font-normal">Artigos</th>
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

          <Suspense fallback={<div className="h-48 animate-pulse rounded-lg border border-stone-200 bg-white lg:col-span-2" />}>
            <SensibilidadeDuplicados semDuplicados={semDuplicados} filtros={filtros} />
          </Suspense>
        </div>
      </section>

      {/* 4. O que não sabemos. */}
      <section className="mt-10" aria-labelledby="titulo-nao-sabemos">
        <h2 id="titulo-nao-sabemos" className="text-lg font-semibold">
          O que os dados não dizem
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Seccao titulo="Dúvidas a confirmar com quem conhece o armazém">
            <p className="mb-2 text-sm text-stone-600">
              Não inventámos respostas: até lá, os números tratam estes casos como estão nos ficheiros.
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-stone-700">
              {q.perguntasAoDocente.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
          </Seccao>

          <Seccao titulo="Limitações conhecidas">
            <p className="text-sm text-stone-600">
              O que os dados não permitem medir ou só permitem medir em parte. Estão todas tidas em conta nos números.
            </p>
            <VerDetalhe titulo={`as ${formatarNumero(q.limitacoes.length)} limitações`} className="mt-3">
              <ol className="list-decimal space-y-1 py-3 pl-9 pr-4 text-sm text-stone-700">
                {q.limitacoes.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ol>
            </VerDetalhe>
          </Seccao>
        </div>
      </section>
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
          ? "Sem as linhas de encomenda iguais a outra. Só esta secção muda: o resto do dashboard usa sempre a regra principal, com as repetidas."
          : "As linhas de encomenda iguais a outra contam como encomendas reais. É a regra usada em todo o dashboard. Mude para ver se as conclusões dependem dela."}
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
          <caption className="text-left text-xs text-stone-500">Classificação ABC (todo o histórico)</caption>
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
function DecomposicaoDiferenca({
  recolhido: r,
  ondasSemRecolha,
}: {
  recolhido: Qualidade["recolhidoVsEncomendado"];
  ondasSemRecolha: number;
}) {
  const parcelas = [
    {
      rotulo: "Ondas sem registo de recolha",
      explicacao: `Estão em ${formatarNumero(ondasSemRecolha)} ondas que aparecem nas encomendas mas não têm nenhuma recolha registada.`,
      unidades: r.ondasSemPicking,
      cor: "bg-stone-700",
    },
    {
      rotulo: "Artigos nunca recolhidos",
      explicacao: `São de ${formatarNumero(r.nReferenciasNuncaRecolhidas)} artigos encomendados que nunca aparecem no registo de recolha.`,
      unidades: r.referenciasNuncaRecolhidas,
      cor: "bg-stone-400",
    },
    {
      rotulo: "Sem explicação nos dados",
      explicacao: "Recolheu-se menos do que se encomendou e os ficheiros não dizem porquê.",
      unidades: r.semCausaConhecida,
      cor: "bg-amber-400",
    },
  ];
  return (
    <figure className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <figcaption className="text-sm text-stone-600">
        {formatarNumero(r.diferenca)} unidades = {parcelas.map((p) => formatarNumero(p.unidades)).join(" + ")}
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
      <ul className="mt-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
        {parcelas.map((p) => (
          <li key={p.rotulo}>
            <p className="flex items-center gap-2 font-medium text-stone-900">
              <span className={`inline-block h-3 w-3 shrink-0 rounded-sm ${p.cor}`} />
              {p.rotulo}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {formatarNumero(p.unidades)} <span className="text-sm font-normal text-stone-500">un.</span>
            </p>
            <p className="mt-1 text-stone-600">{p.explicacao}</p>
          </li>
        ))}
      </ul>
    </figure>
  );
}
