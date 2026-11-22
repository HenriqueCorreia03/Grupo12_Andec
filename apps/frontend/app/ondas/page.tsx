import { Suspense } from "react";
import { CartaoIndicador, DetalhesIndicador, ValorIndicador } from "@/components/cartao-indicador";
import { ErroApi } from "@/components/erro-api";
import { obterOndasEPedidos, type OndasEPedidos } from "@/lib/api";
import { formatarNumero, formatarPercentagemOuNulo } from "@/lib/formatar";

export default function OndasPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Ondas e pedidos</h1>
      <p className="mt-1 text-sm text-stone-500">
        Alavanca (b). Indicadores calculados no servidor. Passe o rato por um cartão para ver a definição.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-lg border border-stone-200 bg-white" />}>
          <PedidosDivididosCartao />
        </Suspense>
      </div>
    </section>
  );
}

async function PedidosDivididosCartao() {
  let dados: OndasEPedidos;
  try {
    dados = await obterOndasEPedidos();
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
