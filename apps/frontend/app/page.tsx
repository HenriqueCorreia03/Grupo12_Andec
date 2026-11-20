import Link from "next/link";
import { Suspense } from "react";
import { CartaoIndicador, DetalhesIndicador, ValorIndicador } from "@/components/cartao-indicador";
import { ErroApi } from "@/components/erro-api";
import { obterVisaoGeral, type VisaoGeral } from "@/lib/api";
import {
  formatarNumero,
  formatarNumeroOuNulo,
  formatarPercentagem,
  formatarPercentagemOuNulo,
} from "@/lib/formatar";

export default function VisaoGeralPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Visão geral</h1>
      <p className="mt-1 text-sm text-stone-500">
        Indicadores calculados no servidor a partir dos CSV carregados pelo ETL. Passe o rato por um cartão para ver a
        definição.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<CartoesACarregar />}>
          <IndicadoresMinimos />
        </Suspense>
      </div>
    </section>
  );
}

async function IndicadoresMinimos() {
  let dados: VisaoGeral;
  try {
    dados = await obterVisaoGeral();
  } catch (e) {
    return <ErroApi mensagem={(e as Error).message} />;
  }
  const { tamanhoMedioEncomenda: tamanho, pedidosPorOnda, participacaoPorSetor, pedidosMultissetor, abc } = dados;
  const tamanhoMedio = formatarNumeroOuNulo(tamanho.valor);
  const porOnda = formatarNumeroOuNulo(pedidosPorOnda.valor);
  const multissetor = formatarPercentagemOuNulo(pedidosMultissetor.valor);
  const resumoAbc = abc.classes.map((c) => `${c.classe} ${formatarNumero(c.referencias)}`).join(" / ");
  const setores = participacaoPorSetor.setores
    .map((s) => `${s.setor} ${formatarPercentagem(s.percentagem)}`)
    .join("; ");

  return (
    <>
      <CartaoIndicador titulo="Tamanho médio da encomenda" metadados={tamanho} valorResumo={tamanhoMedio}>
        <ValorIndicador texto={tamanhoMedio} unidade="un./pedido" />
        <DetalhesIndicador
          detalhes={[
            { rotulo: "Mediana", texto: formatarNumeroOuNulo(tamanho.mediana) },
            { rotulo: "p90", texto: formatarNumeroOuNulo(tamanho.p90) },
          ]}
        />
      </CartaoIndicador>

      <CartaoIndicador titulo="Pedidos por onda" metadados={pedidosPorOnda} valorResumo={porOnda}>
        <ValorIndicador texto={porOnda} unidade="pedidos/onda" />
        <DetalhesIndicador
          detalhes={[
            { rotulo: "Mediana", texto: formatarNumeroOuNulo(pedidosPorOnda.mediana) },
            { rotulo: "Ondas com 1 pedido", texto: formatarNumero(pedidosPorOnda.ondasComUmPedido) },
            { rotulo: "Ondas", texto: formatarNumero(pedidosPorOnda.ondas) },
          ]}
        />
      </CartaoIndicador>

      <CartaoIndicador
        titulo="Participação por setor"
        metadados={participacaoPorSetor}
        valorResumo={setores || null}
        limitacao={participacaoPorSetor.limitacao}
      >
        {participacaoPorSetor.setores.length === 0 ? (
          <ValorIndicador texto={null} />
        ) : (
          <ul className="mt-2 space-y-1">
            {participacaoPorSetor.setores.map((s) => (
              <li key={s.setor} className="flex items-baseline justify-between gap-4">
                <span className="text-lg font-semibold">{s.setor}</span>
                <span className="text-lg font-semibold">{formatarPercentagem(s.percentagem)}</span>
              </li>
            ))}
          </ul>
        )}
      </CartaoIndicador>

      <CartaoIndicador
        titulo="Pedidos multissetor"
        metadados={pedidosMultissetor}
        valorResumo={multissetor}
        limitacao={pedidosMultissetor.limitacao}
      >
        <ValorIndicador texto={multissetor} />
        <DetalhesIndicador
          detalhes={[
            {
              rotulo: "Pedidos multissetor",
              texto: `${formatarNumero(pedidosMultissetor.pedidosMultissetor)} de ${formatarNumero(pedidosMultissetor.pedidosValidos)}`,
            },
          ]}
        />
      </CartaoIndicador>

      <CartaoIndicador titulo="Classificação ABC (classe global)" metadados={abc} valorResumo={`${resumoAbc} referências`}>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="text-left text-stone-500">
              <th className="font-normal">Classe</th>
              <th className="text-right font-normal">Referências</th>
              <th className="text-right font-normal">% unidades</th>
            </tr>
          </thead>
          <tbody>
            {abc.classes.map((c) => (
              <tr key={c.classe}>
                <td className="py-0.5">
                  <Link href={`/artigos?classe=${c.classe}`} className="font-semibold underline-offset-2 hover:underline">
                    {c.classe}
                  </Link>
                </td>
                <td className="text-right font-medium">{formatarNumero(c.referencias)}</td>
                <td className="text-right font-medium">{formatarPercentagem(c.percentagemUnidades)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CartaoIndicador>
    </>
  );
}

function CartoesACarregar() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-lg border border-stone-200 bg-white" />
      ))}
    </>
  );
}
