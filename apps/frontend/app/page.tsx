import { Suspense } from "react";
import { CartaoIndicador } from "@/components/cartao-indicador";
import { obterVisaoGeral } from "@/lib/api";

export default function VisaoGeralPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Visão geral</h1>
      <p className="mt-1 text-sm text-stone-500">Indicadores calculados no servidor a partir dos CSV carregados pelo ETL.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<CartaoACarregar />}>
          <CartaoTamanhoMedio />
        </Suspense>
      </div>
    </section>
  );
}

async function CartaoTamanhoMedio() {
  let dados;
  try {
    dados = (await obterVisaoGeral()).tamanhoMedioEncomenda;
  } catch (e) {
    return <ErroApi mensagem={(e as Error).message} />;
  }
  const excluidos = dados.pedidosExcluidos;
  return (
    <CartaoIndicador
      titulo="Tamanho médio da encomenda"
      valor={dados.valor}
      unidade="un./pedido"
      detalhes={[
        { rotulo: "Mediana", valor: dados.mediana },
        { rotulo: "p90", valor: dados.p90 },
      ]}
      definicao={dados.definicao}
      fonte={dados.fonte}
      exclusoes={`${excluidos} ${excluidos === 1 ? "pedido" : "pedidos"} com 0 un. ${excluidos === 1 ? "excluído" : "excluídos"}`}
    />
  );
}

function CartaoACarregar() {
  return <div className="h-40 animate-pulse rounded-lg border border-stone-200 bg-white" />;
}

function ErroApi({ mensagem }: { mensagem: string }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">
      <p className="font-medium">Não foi possível obter os dados da API.</p>
      <p className="mt-1">{mensagem}</p>
    </div>
  );
}
