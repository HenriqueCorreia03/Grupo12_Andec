import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CartaoIndicador, ValorIndicador } from "@/components/cartao-indicador";
import { ErroApi } from "@/components/erro-api";
import { FaixaKpi, FaixaKpiACarregar } from "@/components/faixa-kpi";
import { CurvaAbc, type PontoAbc } from "@/components/graficos";
import { TabelaRecolhida } from "@/components/tabela-recolhida";
import {
  obterAbc,
  obterEstabilidade,
  obterPrioridade,
  obterTamanhos,
  obterZonas,
  type EstabilidadeAbc,
  type PrioridadeDosArtigos,
  type ReferenciasAbc,
  type ZonasDoPicking,
} from "@/lib/api";
import { LINHAS_VISIVEIS } from "@/lib/apresentacao";
import { consulta, filtrosDeObjeto, type FiltrosUrl } from "@/lib/filtros";
import { formatarNumero, formatarNumeroOuNulo, formatarPercentagemOuNulo } from "@/lib/formatar";
import { AbcVersusAbccod } from "./abccod";
import { EstabilidadeDoAbc } from "./estabilidade";
import { PrioridadeArtigos } from "./prioridade";
import { ParticipacaoZonas } from "./zonas";

const CARREGAR = <div className="mt-6 h-64 animate-pulse rounded-lg border border-stone-200 bg-white" />;

export const metadata: Metadata = { title: "Artigos, ABC e localizações" };

export default function ArtigosPage({ searchParams }: PageProps<"/artigos">) {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Artigos, ABC e localizações</h1>
      <p className="mt-1 text-sm text-stone-500">
        Ideia (a): reorganizar as localizações. Os números principais primeiro e o detalhe por baixo. Clique numa classe
        para ver os artigos, e num artigo para ver as unidades por tamanho. Os filtros aplicam-se a toda a página.
      </p>
      <div className="mt-6">
        <Suspense fallback={<FaixaKpiACarregar cartoes={5} />}>
          <IndicadoresDosArtigos searchParams={searchParams} />
        </Suspense>
      </div>
      <h2 className="mt-10 text-lg font-semibold">Classificação ABC e drill-down</h2>
      <Suspense fallback={CARREGAR}>
        <DrillDownAbc searchParams={searchParams} />
      </Suspense>
      <h2 id="prioridade" className="mt-10 scroll-mt-4 text-lg font-semibold">Prioridade dos artigos e dispersão</h2>
      <div className="mt-4">
        <Suspense fallback={CARREGAR}>
          <PrioridadeDoPeriodo searchParams={searchParams} />
        </Suspense>
      </div>
      <h2 id="estabilidade" className="mt-10 scroll-mt-4 text-lg font-semibold">Estabilidade do ABC mensal</h2>
      <div className="mt-4">
        <Suspense fallback={CARREGAR}>
          <EstabilidadeDoPeriodo searchParams={searchParams} />
        </Suspense>
      </div>
      <h2 className="mt-10 text-lg font-semibold">ABC calculado vs ABCCOD do ficheiro de produtos</h2>
      <div className="mt-4">
        <Suspense fallback={CARREGAR}>
          <ComparacaoAbccod searchParams={searchParams} />
        </Suspense>
      </div>
      <h2 className="mt-10 text-lg font-semibold">Zonas e localizações não mapeadas</h2>
      <div className="mt-4">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-lg border border-stone-200 bg-white" />}>
          <ZonasDoPeriodo searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  );
}

async function PrioridadeDoPeriodo({ searchParams }: { searchParams: PageProps<"/artigos">["searchParams"] }) {
  return <PrioridadeArtigos filtros={filtrosDeObjeto(await searchParams)} />;
}

async function EstabilidadeDoPeriodo({ searchParams }: { searchParams: PageProps<"/artigos">["searchParams"] }) {
  return <EstabilidadeDoAbc filtros={filtrosDeObjeto(await searchParams)} />;
}

async function ComparacaoAbccod({ searchParams }: { searchParams: PageProps<"/artigos">["searchParams"] }) {
  return <AbcVersusAbccod filtros={filtrosDeObjeto(await searchParams)} />;
}

async function ZonasDoPeriodo({ searchParams }: { searchParams: PageProps<"/artigos">["searchParams"] }) {
  return <ParticipacaoZonas filtros={filtrosDeObjeto(await searchParams)} />;
}

/**
 * Faixa de KPI da alavanca (a): artigos A, % das unidades na classe A, estabilidade do ABC, localizações não
 * mapeadas e pedidos multizona. Os pedidos à API são os mesmos das secções de baixo (o Next memoriza-os no pedido).
 */
async function IndicadoresDosArtigos({ searchParams }: { searchParams: PageProps<"/artigos">["searchParams"] }) {
  const filtros = filtrosDeObjeto(await searchParams);
  let abc: ReferenciasAbc;
  let prioridade: PrioridadeDosArtigos;
  let estabilidade: EstabilidadeAbc;
  let zonas: ZonasDoPicking;
  try {
    [abc, prioridade, estabilidade, zonas] = await Promise.all([
      obterAbc(filtros),
      obterPrioridade(filtros),
      obterEstabilidade(filtros),
      obterZonas(filtros),
    ]);
  } catch (e) {
    return <ErroApi mensagem={(e as Error).message} />;
  }
  const { resumoA } = prioridade;
  const classeA = abc.classes.find((c) => c.classe === "A");
  const percentagemA = formatarPercentagemOuNulo(classeA?.percentagemUnidades ?? null);
  const mudam = formatarPercentagemOuNulo(estabilidade.valor);
  const { naoMapeadas } = zonas.participacaoPorZona;
  const percentagemNaoMapeadas = formatarPercentagemOuNulo(naoMapeadas.percentagem);
  const multizona = zonas.pedidosMultizona;
  const percentagemMultizona = formatarPercentagemOuNulo(multizona.valor);
  const medianaLocalizacoes = formatarNumeroOuNulo(resumoA.localizacoes.mediana);

  return (
    <FaixaKpi rotulo="Indicadores principais dos artigos">
      <CartaoIndicador
        titulo="Artigos A (classe global)"
        metadados={prioridade}
        valorResumo={formatarNumero(resumoA.artigosA)}
        leitura={
          `${formatarNumero(resumoA.artigosAComPicking)} deles foram recolhidos` +
          (medianaLocalizacoes ? `; cada um sai, em mediana, de ${medianaLocalizacoes} sítios diferentes.` : ".")
        }
      >
        <ValorIndicador texto={formatarNumero(resumoA.artigosA)} unidade="artigos" />
      </CartaoIndicador>

      <CartaoIndicador
        titulo="Unidades na classe A (no período)"
        metadados={abc}
        valorResumo={percentagemA}
        leitura={
          classeA
            ? `${formatarNumero(classeA.referencias)} dos ${formatarNumero(abc.totalReferencias)} artigos encomendados no período são A.`
            : null
        }
      >
        <ValorIndicador texto={percentagemA} unidade="das unidades" />
      </CartaoIndicador>

      <CartaoIndicador
        titulo="Referências que mudam de classe (mês a mês)"
        metadados={estabilidade}
        valorResumo={mudam}
        leitura={
          `${formatarNumero(estabilidade.mudaram)} mudanças em ${formatarNumero(estabilidade.comparadas)} comparações de um mês para o seguinte ` +
          `(só artigos com ${estabilidade.limiarUnidades} ou mais unidades nos dois meses).`
        }
      >
        <ValorIndicador texto={mudam} />
      </CartaoIndicador>

      <CartaoIndicador
        titulo="Localizações não mapeadas"
        metadados={zonas.participacaoPorZona}
        valorResumo={percentagemNaoMapeadas}
        leitura={`${formatarNumero(naoMapeadas.unidades)} unidades saíram de sítios fora do mapa; ${formatarNumero(naoMapeadas.rc01Unidades)} delas da área RC-01.`}
      >
        <ValorIndicador texto={percentagemNaoMapeadas} unidade="do recolhido" />
      </CartaoIndicador>

      <CartaoIndicador
        titulo="Pedidos multizona"
        metadados={multizona}
        valorResumo={percentagemMultizona}
        leitura={`${formatarNumero(multizona.pedidosMultizona)} de ${formatarNumero(multizona.pedidosValidos)} pedidos obrigam a ir a 2 ou mais zonas do armazém.`}
      >
        <ValorIndicador texto={percentagemMultizona} unidade="dos pedidos" />
      </CartaoIndicador>
    </FaixaKpi>
  );
}

async function DrillDownAbc({ searchParams }: { searchParams: PageProps<"/artigos">["searchParams"] }) {
  const params = await searchParams;
  const filtros = filtrosDeObjeto(params);
  // `detalhe` é a referência escolhida na tabela (painel de tamanhos); `referencia` é o filtro global.
  const detalhe = typeof params.detalhe === "string" && params.detalhe !== "" ? params.detalhe : null;
  // A tabela mostra só as primeiras 10 referências; `todas=1` abre-a já com todas.
  const todas = params.todas === "1";

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

  // Curva do ABC: só as referências com procura no período, pela posição do ranking. O acumulado depois de cada
  // referência é o "acumulado antes" da seguinte (da API); a última fecha nos 100 %.
  const ordenadas = abc.referencias
    .filter((r) => r.posicao !== null && r.classePeriodo !== null && r.acumuladoAntes !== null)
    .sort((x, y) => (x.posicao ?? 0) - (y.posicao ?? 0));
  const pontos: PontoAbc[] = ordenadas.map((r, i) => ({
    posicao: r.posicao ?? i + 1,
    referencia: r.referencia,
    unidades: r.unidades,
    classe: r.classePeriodo ?? "C",
    acumulado: ordenadas[i + 1]?.acumuladoAntes ?? 100,
  }));
  const classeA = abc.classes.find((c) => c.classe === "A");

  return (
    <div className="mt-4 space-y-6">
      {pontos.length > 0 && (
        <figure className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <figcaption className="text-sm font-medium text-stone-500">
            Concentração da procura: % das unidades acumulada, da referência que mais vende à que menos
          </figcaption>
          {classeA && (
            <p className="mt-1 text-sm text-stone-700">
              Só <strong>{formatarNumero(classeA.referencias)}</strong> de {formatarNumero(pontos.length)} referências
              fazem <strong>{formatarPercentagemOuNulo(classeA.percentagemUnidades) ?? "sem dados"}</strong> das unidades:
              reorganizar poucos artigos chega a quase tudo o que sai.
            </p>
          )}
          <div className="mt-3">
            <CurvaAbc pontos={pontos} />
          </div>
        </figure>
      )}
      <SeletorClasse abc={abc} filtros={filtros} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <TabelaReferencias abc={abc} filtros={filtros} detalhe={detalhe} todas={todas} />
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

/** Referências do âmbito, pela ordem do ABC do período: as primeiras 10 e "Ver todas (N)" (ticket 19). */
function TabelaReferencias({
  abc,
  filtros,
  detalhe,
  todas,
}: {
  abc: ReferenciasAbc;
  filtros: FiltrosUrl;
  detalhe: string | null;
  todas: boolean;
}) {
  const classe = abc.classeSelecionada;
  if (abc.referencias.length === 0) {
    return <p className="rounded-lg border border-stone-200 bg-white p-5 text-sm text-stone-500">sem dados</p>;
  }
  // Se a referência aberta no painel não está entre as primeiras, a tabela abre inteira para ela não desaparecer.
  const posicaoDetalhe = detalhe === null ? -1 : abc.referencias.findIndex((r) => r.referencia === detalhe);
  const abertaInicial = todas || posicaoDetalhe >= LINHAS_VISIVEIS;
  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
      <TabelaRecolhida
        key={abertaInicial ? "aberta" : "recolhida"}
        abertaInicial={abertaInicial}
        classeTabela="w-full min-w-[34rem] text-sm"
        legenda={
          <>
            {classe ? `Referências da classe global ${classe}` : "Todas as referências"} ({formatarNumero(abc.referencias.length)}),
            por unidades encomendadas no período
          </>
        }
        cabecalho={
          <tr>
            <th className="px-4 py-2 font-normal">#</th>
            <th className="px-4 py-2 font-normal">Referência</th>
            <th className="px-4 py-2 text-right font-normal">Unidades</th>
            <th className="px-4 py-2 text-right font-normal">Acumulado antes</th>
            <th className="px-4 py-2 text-center font-normal">Classe no período</th>
            <th className="px-4 py-2 text-center font-normal">Classe global</th>
          </tr>
        }
        linhas={abc.referencias.map((r) => {
          const ativa = r.referencia === detalhe;
          return (
            <tr key={r.referencia} className={ativa ? "bg-amber-50" : "border-t border-stone-100"}>
              <td className="px-4 py-1.5 text-stone-500">{r.posicao ?? "—"}</td>
              <td className="px-4 py-1.5">
                <Link
                  href={`/artigos${consulta(filtros, { detalhe: r.referencia, todas: todas ? "1" : null })}`}
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
      />
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
        <p className="mt-2 text-stone-500">sem procura: a referência não tem unidades encomendadas.</p>
      </aside>
    );
  }
  if (tamanhos.tamanhos.length === 0) {
    return (
      <aside className="h-fit rounded-lg border border-stone-200 bg-white p-5 text-sm">
        <p className="font-medium">{tamanhos.referencia}</p>
        <p className="mt-2 text-stone-500">sem dados: a referência não tem unidades encomendadas no período.</p>
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
