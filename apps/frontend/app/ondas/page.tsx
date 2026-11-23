import { Suspense } from "react";
import { CartaoIndicador, DetalhesIndicador, ValorIndicador } from "@/components/cartao-indicador";
import { ErroApi } from "@/components/erro-api";
import { obterOndasEPedidos, type OndasEPedidos } from "@/lib/api";
import { filtrosDeObjeto, type FiltrosUrl } from "@/lib/filtros";
import { formatarNumero, formatarPercentagemOuNulo } from "@/lib/formatar";
import { DetalheDaOnda } from "./detalhe-onda";
import { PeriodosDaAlavancaB } from "./periodos";
import { PickingOndas } from "./picking-ondas";

export default function OndasPage({ searchParams }: PageProps<"/ondas">) {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Ondas e pedidos</h1>
      <p className="mt-1 text-sm text-stone-500">
        Alavanca (b). Indicadores calculados no servidor. Passe o rato por um cartão para ver a definição.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-lg border border-stone-200 bg-white" />}>
          <IndicadoresDasOndas searchParams={searchParams} />
        </Suspense>
      </div>
    </section>
  );
}

async function IndicadoresDasOndas({ searchParams }: { searchParams: PageProps<"/ondas">["searchParams"] }) {
  const filtros = filtrosDeObjeto(await searchParams);
  return (
    <>
      {filtros.onda !== undefined && (
        <div className="sm:col-span-2 lg:col-span-3">
          <DetalheDaOnda onda={filtros.onda} filtros={filtros} />
        </div>
      )}
      <PedidosDivididosCartao filtros={filtros} />
      <PickingOndas filtros={filtros} />
      {filtros.onda === undefined && <PeriodosDaAlavancaB filtros={filtros} />}
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
    <CartaoIndicador titulo="Pedidos divididos entre ondas" metadados={d} valorResumo={percentagem}>
      <ValorIndicador texto={percentagem} />
      <DetalhesIndicador
        detalhes={[
          {
            rotulo: "Pedidos divididos",
            texto: `${formatarNumero(d.pedidosDivididos)} de ${formatarNumero(d.pedidosValidos)}`,
          },
          { rotulo: "Com > 24 un. (inevitáveis)", texto: formatarNumero(d.divididosMaisDe24) },
          {
            rotulo: "Com ≤ 24 un. (evitáveis)",
            texto:
              d.percentagemAte24 === null
                ? null
                : `${formatarNumero(d.divididosAte24)} (${formatarPercentagemOuNulo(d.percentagemAte24)} dos pedidos)`,
          },
        ]}
      />
    </CartaoIndicador>
  );
}
