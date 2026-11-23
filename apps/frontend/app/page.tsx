import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CartaoIndicador, ValorIndicador } from "@/components/cartao-indicador";
import { OutrasDecisoes } from "@/components/decisoes";
import { Diagnostico } from "@/components/diagnostico";
import { ErroApi } from "@/components/erro-api";
import { FaixaKpi, FaixaKpiACarregar } from "@/components/faixa-kpi";
import { MatrizAlavancasView } from "@/components/matriz-alavancas";
import { GraficosSerieMensal } from "@/components/serie-mensal";
import {
  obterDividosPorPeriodo,
  obterEstabilidade,
  obterOndasIncompletas,
  obterSerieMensal,
  obterVisaoGeral,
  type Comparacao,
  type SerieMensal,
  type VisaoGeral,
} from "@/lib/api";
import { consulta, filtrosDeObjeto, type FiltrosUrl } from "@/lib/filtros";
import {
  formatarNumero,
  formatarNumeroOuNulo,
  formatarPercentagem,
  formatarPercentagemOuNulo,
  formatarVariacao,
} from "@/lib/formatar";

export const metadata: Metadata = { title: { absolute: "Visão geral · Armazém de calçado" } };

/**
 * Visão geral (tickets 19 e 20, "resumo primeiro, detalhe a pedido"): (1) diagnóstico com o que está bem, o que está
 * mal e o que fazer, e a faixa dos indicadores da operação; (2) matriz das alavancas; (3) evolução mensal.
 */
export default function VisaoGeralPage({ searchParams }: PageProps<"/">) {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Visão geral</h1>
      <p className="mt-1 text-sm text-stone-500">
        Primeiro o diagnóstico e os indicadores principais; o detalhe vem por baixo. Clique num cartão para ver a
        definição.
      </p>
      <div className="mt-4">
        <Suspense fallback={<FaixaKpiACarregar cartoes={4} />}>
          <DiagnosticoDaOperacao searchParams={searchParams} />
        </Suspense>
        <Suspense fallback={<div className="mt-8"><FaixaKpiACarregar cartoes={3} /></div>}>
          <OutrasDecisoesDaOperacao searchParams={searchParams} />
        </Suspense>
      </div>
      <h2 className="mt-8 text-lg font-semibold">Indicadores da operação</h2>
      <p className="mt-1 text-sm text-stone-500">
        Descritivos: não têm meta definida, por isso não têm cor de bom ou mau.
      </p>
      <div className="mt-3">
        <Suspense fallback={<FaixaKpiACarregar />}>
          <IndicadoresMinimos searchParams={searchParams} />
        </Suspense>
      </div>
      <div className="mt-8">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg border border-stone-200 bg-white" />}>
          <Matriz searchParams={searchParams} />
        </Suspense>
      </div>
      <h2 className="mt-10 text-lg font-semibold">Evolução mensal por dia com atividade</h2>
      <p className="mt-1 text-sm text-stone-500">
        Valores do mês divididos pelos dias com pelo menos um pedido criado (domingos incluídos), para comparar meses com
        números de dias diferentes.
      </p>
      <div className="mt-4">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg border border-stone-200 bg-white" />}>
          <EvolucaoMensal searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  );
}

async function DiagnosticoDaOperacao({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const filtros = filtrosDeObjeto(await searchParams);
  let matriz: VisaoGeral["matriz"];
  try {
    ({ matriz } = await obterVisaoGeral(filtros));
  } catch (e) {
    return <ErroApi mensagem={(e as Error).message} />;
  }
  return <Diagnostico matriz={matriz} filtros={filtros} />;
}

/** As decisões das perguntas P2, P3 e P6 (quando rever, onde testar, o que agrupar), além das duas alavancas. */
async function OutrasDecisoesDaOperacao({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const filtros = filtrosDeObjeto(await searchParams);
  try {
    const [estabilidade, divididos, incompletas] = await Promise.all([
      obterEstabilidade(filtros),
      obterDividosPorPeriodo(filtros),
      obterOndasIncompletas(filtros),
    ]);
    return <OutrasDecisoes estabilidade={estabilidade} divididos={divididos} incompletas={incompletas} filtros={filtros} />;
  } catch (e) {
    return (
      <div className="mt-8">
        <ErroApi mensagem={(e as Error).message} />
      </div>
    );
  }
}

async function Matriz({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const filtros = filtrosDeObjeto(await searchParams);
  let matriz: VisaoGeral["matriz"];
  try {
    ({ matriz } = await obterVisaoGeral(filtros));
  } catch (e) {
    return <ErroApi mensagem={(e as Error).message} />;
  }
  return <MatrizAlavancasView matriz={matriz} />;
}

/** " (variação +3 %)" quando há período anterior com variação; texto vazio nos outros casos. */
function variacaoEntreParenteses(comparacao: Comparacao | undefined): string {
  if (!comparacao?.disponivel || comparacao.variacao === null) return "";
  return ` (variação ${formatarVariacao(comparacao.variacao)})`;
}

async function IndicadoresMinimos({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const filtros = filtrosDeObjeto(await searchParams);
  let dados: VisaoGeral;
  try {
    dados = await obterVisaoGeral(filtros);
  } catch (e) {
    return <ErroApi mensagem={(e as Error).message} />;
  }
  const { tamanhoMedioEncomenda: tamanho, pedidosPorOnda, participacaoPorSetor, pedidosMultissetor, abc, volume } = dados;
  const temPeriodo = Boolean(filtros.mes || filtros.inicio);
  const tamanhoMedio = formatarNumeroOuNulo(tamanho.valor);
  const porOnda = formatarNumeroOuNulo(pedidosPorOnda.valor);
  const pedidosDia = formatarNumeroOuNulo(volume.pedidos.porDiaComAtividade);
  const unidadesDia = formatarNumeroOuNulo(volume.unidades.porDiaComAtividade);
  const multissetor = formatarPercentagemOuNulo(pedidosMultissetor.valor);
  const limitacaoSetor = participacaoPorSetor.limitacao ?? pedidosMultissetor.limitacao;
  const setores = participacaoPorSetor.setores.map((s) => `${s.setor} ${formatarPercentagem(s.percentagem)}`).join(" · ");
  const resumoAbc = abc.classes.map((c) => `${c.classe} ${formatarNumero(c.referencias)}`).join(" / ");
  const mediana = formatarNumeroOuNulo(tamanho.mediana);
  const p90 = formatarNumeroOuNulo(tamanho.p90);

  return (
    <div className="space-y-3">
      <FaixaKpi>
        <CartaoIndicador
          titulo="Tamanho médio da encomenda"
          metadados={tamanho}
          valorResumo={tamanhoMedio}
          leitura={`Mediana ${mediana ?? "sem dados"} un.; p90 ${p90 ?? "sem dados"} un.`}
        >
          <ValorIndicador texto={tamanhoMedio} unidade="un./pedido" />
        </CartaoIndicador>

        <CartaoIndicador
          titulo="Pedidos por onda"
          metadados={pedidosPorOnda}
          valorResumo={porOnda}
          leitura={
            `${formatarNumero(pedidosPorOnda.ondasComUmPedido)} de ${formatarNumero(pedidosPorOnda.ondas)} ondas com 1 só ` +
            `pedido; mediana ${formatarNumeroOuNulo(pedidosPorOnda.mediana) ?? "sem dados"}.`
          }
        >
          <ValorIndicador texto={porOnda} unidade="pedidos/onda" />
        </CartaoIndicador>

        <CartaoIndicador
          titulo="Volume por dia com atividade"
          metadados={volume.pedidos}
          valorResumo={pedidosDia}
          leitura={
            `${formatarNumeroOuNulo(volume.pedidos.valor) ?? "sem dados"} pedidos e ` +
            `${formatarNumeroOuNulo(volume.unidades.valor) ?? "sem dados"} un. em ` +
            `${formatarNumero(volume.pedidos.diasComAtividade)} dias; ${unidadesDia ?? "sem dados"} un./dia` +
            `${variacaoEntreParenteses(volume.unidades.comparacao)}.`
          }
        >
          <ValorIndicador texto={pedidosDia} unidade="pedidos/dia" />
        </CartaoIndicador>

        <CartaoIndicador titulo="Participação por setor" metadados={participacaoPorSetor} valorResumo={setores || null}>
          <ValorIndicador texto={setores || null} />
        </CartaoIndicador>

        <CartaoIndicador
          titulo="Pedidos multissetor"
          metadados={pedidosMultissetor}
          valorResumo={multissetor}
          leitura={`${formatarNumero(pedidosMultissetor.pedidosMultissetor)} de ${formatarNumero(pedidosMultissetor.pedidosValidos)} pedidos têm unidades em 2 ou mais setores.`}
        >
          <ValorIndicador texto={multissetor} />
        </CartaoIndicador>

        <CartaoIndicador
          titulo={temPeriodo ? "Classificação ABC (classe no período)" : "Classificação ABC (classe global)"}
          metadados={abc}
          valorResumo={`${resumoAbc} referências`}
          leitura={
            abc.totalReferencias === 0
              ? null
              : `Unidades: ${abc.classes.map((c) => `${c.classe} ${formatarPercentagemOuNulo(c.percentagemUnidades) ?? "sem dados"}`).join(" · ")}. Clique numa classe para ver as referências.`
          }
        >
          <p className="mt-2 flex flex-wrap gap-x-4 text-3xl font-semibold">
            {abc.classes.map((c) => (
              <Link
                key={c.classe}
                href={`/artigos${consulta({ ...filtros, classe: c.classe })}`}
                title={`${formatarPercentagemOuNulo(c.percentagemUnidades) ?? "sem dados"} das unidades`}
                className="underline-offset-4 hover:underline"
              >
                {c.classe} <span className="text-xl">{formatarNumero(c.referencias)}</span>
              </Link>
            ))}
          </p>
        </CartaoIndicador>
      </FaixaKpi>
      {limitacaoSetor && (
        <p className="rounded border border-amber-300 bg-amber-50 px-3 py-1 text-xs text-amber-900">{limitacaoSetor}</p>
      )}
    </div>
  );
}

async function EvolucaoMensal({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const filtros: FiltrosUrl = filtrosDeObjeto(await searchParams);
  let serie: SerieMensal;
  try {
    serie = await obterSerieMensal(filtros);
  } catch (e) {
    return <ErroApi mensagem={(e as Error).message} />;
  }
  return <GraficosSerieMensal serie={serie} mesSelecionado={filtros.mes ?? null} />;
}
