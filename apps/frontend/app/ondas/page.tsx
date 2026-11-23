import type { Metadata } from "next";
import { Suspense, ViewTransition } from "react";
import { CartaoIndicador, ValorIndicador } from "@/components/cartao-indicador";
import { ErroApi } from "@/components/erro-api";
import { BarraSegmentos } from "@/components/mini-graficos";
import { FaixaKpi, FaixaKpiACarregar } from "@/components/faixa-kpi";
import { obterOndasEPedidos, type OndasEPedidos } from "@/lib/api";
import { filtrosDeObjeto, type FiltrosUrl } from "@/lib/filtros";
import { formatarNumero, formatarPercentagemOuNulo } from "@/lib/formatar";
import { DetalheDaOnda } from "./detalhe-onda";
import { OndasIncompletasCartao } from "./ondas-incompletas";
import { PeriodosDaAlavancaB } from "./periodos";
import { CartoesDePicking, OcupacaoEListaDeOndas } from "./picking-ondas";

export const metadata: Metadata = { title: "Ondas e pedidos" };

/**
 * Ondas e pedidos (ticket 19, "resumo primeiro, detalhe a pedido"): (1) faixa de KPI, (2) detalhe da onda do filtro
 * e gráfico de ocupação, (3) lista de ondas e rankings por período.
 */
export default function OndasPage({ searchParams }: PageProps<"/ondas">) {
  // Fade curto só ao entrar e sair da página (não a cada bloco de dados que carrega): ver globals.css.
  return (
    <ViewTransition enter="troca" exit="troca" default="none">
    <section>
      <h1 className="text-2xl font-semibold">Ondas e pedidos</h1>
      <p className="mt-1 text-sm text-stone-500">
        Ideia (b): mudar a forma como as ondas são constituídas. Os números principais primeiro e o detalhe por baixo.
        Clique num cartão para ver a definição.
      </p>
      <Suspense fallback={<div className="mt-6"><FaixaKpiACarregar cartoes={5} /></div>}>
        <ConteudoDasOndas searchParams={searchParams} />
      </Suspense>
    </section>
    </ViewTransition>
  );
}

async function ConteudoDasOndas({ searchParams }: { searchParams: PageProps<"/ondas">["searchParams"] }) {
  const params = await searchParams;
  const filtros = filtrosDeObjeto(params);
  // A lista de ondas mostra só as incompletas por omissão (`lista=todas` mostra todas) e só as primeiras 10
  // (`ondas=todas` abre a lista inteira, carregada só quando se pede).
  const lista = params.lista === "todas" ? "todas" : "incompletas";
  const listaAberta = params.ondas === "todas";
  const { onda } = filtros;
  const semOnda = onda === undefined;
  return (
    <>
      <div className="mt-6">
        <FaixaKpi rotulo="Indicadores principais das ondas">
          <PedidosDivididosCartao filtros={filtros} />
          <CartoesDePicking filtros={filtros} />
          {semOnda && <OndasIncompletasCartao filtros={filtros} />}
        </FaixaKpi>
      </div>
      {onda !== undefined && (
        <div className="mt-8">
          <DetalheDaOnda onda={onda} filtros={filtros} />
        </div>
      )}
      <div className="mt-8 space-y-4">
        <OcupacaoEListaDeOndas filtros={filtros} lista={lista} listaAberta={listaAberta} />
      </div>
      {semOnda && (
        <div className="mt-10">
          <PeriodosDaAlavancaB filtros={filtros} />
        </div>
      )}
    </>
  );
}

async function PedidosDivididosCartao({ filtros }: { filtros: FiltrosUrl }) {
  let dados: OndasEPedidos;
  try {
    dados = await obterOndasEPedidos(filtros);
  } catch (e) {
    return <ErroApi mensagem={(e as Error).message} />;
  }
  const d = dados.pedidosDivididos;
  const percentagem = formatarPercentagemOuNulo(d.valor);
  return (
    <CartaoIndicador
      titulo="Pedidos divididos entre ondas"
      metadados={d}
      valorResumo={percentagem}
      grafico={
        <BarraSegmentos
          titulo={`${formatarNumero(d.pedidosValidos)} pedidos`}
          segmentos={[
            { valor: d.pedidosValidos - d.pedidosDivididos, rotulo: "saíram numa só onda", classe: "bg-stone-300" },
            { valor: d.divididosMaisDe24, rotulo: "partidos, mas tinham mais de 24 un. (não cabiam)", classe: "bg-[#86b6ef]" },
            { valor: d.divididosAte24, rotulo: "partidos quando cabiam numa onda", classe: "bg-amber-500" },
          ]}
        />
      }
    >
      <ValorIndicador texto={percentagem} />
    </CartaoIndicador>
  );
}
