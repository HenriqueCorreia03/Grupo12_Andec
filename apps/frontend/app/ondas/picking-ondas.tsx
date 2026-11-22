import { CartaoIndicador, DetalhesIndicador, ValorIndicador } from "@/components/cartao-indicador";
import { ErroApi } from "@/components/erro-api";
import { obterPicking, type OcupacaoDasOndas, type PickingDasOndas } from "@/lib/api";
import type { FiltrosUrl } from "@/lib/filtros";
import { formatarNumero, formatarNumeroOuNulo, formatarPercentagemOuNulo } from "@/lib/formatar";

/** Indicadores de picking por onda (ticket 04): só apresenta, os valores vêm calculados pela API. */
export async function PickingOndas({ filtros }: { filtros: FiltrosUrl }) {
  let dados: PickingDasOndas;
  try {
    dados = await obterPicking(filtros);
  } catch (e) {
    return <ErroApi mensagem={(e as Error).message} />;
  }
  const { ocupacao, paragens, localizacoesPorOnda: localizacoes } = dados;
  const valorOcupacao = formatarPercentagemOuNulo(ocupacao.valor);
  const mediaLocalizacoes = formatarNumeroOuNulo(localizacoes.media);

  return (
    <>
      <CartaoIndicador titulo="Ocupação média das ondas" metadados={ocupacao} valorResumo={valorOcupacao}>
        <ValorIndicador texto={valorOcupacao} unidade="de 24 un." />
        <DetalhesIndicador
          detalhes={[
            { rotulo: "Ondas", texto: formatarNumero(ocupacao.ondas) },
            { rotulo: "Com 24 un.", texto: `${formatarNumero(ocupacao.ondasCom24)} (${formatarPercentagemOuNulo(ocupacao.percentagemCom24) ?? "sem dados"})` },
            { rotulo: "Com > 24 un.", texto: formatarNumero(ocupacao.ondasMaisDe24) },
            { rotulo: "Mín. / máx.", texto: `${formatarNumeroOuNulo(ocupacao.minimo) ?? "-"} / ${formatarNumeroOuNulo(ocupacao.maximo) ?? "-"} un.` },
          ]}
        />
      </CartaoIndicador>

      <CartaoIndicador titulo="Paragens" metadados={paragens} valorResumo={formatarNumeroOuNulo(paragens.valor)}>
        <ValorIndicador texto={formatarNumeroOuNulo(paragens.valor)} unidade="(onda, localização)" />
      </CartaoIndicador>

      <CartaoIndicador titulo="Localizações distintas por onda" metadados={localizacoes} valorResumo={mediaLocalizacoes}>
        <ValorIndicador texto={mediaLocalizacoes} unidade="localizações/onda" />
        <DetalhesIndicador
          detalhes={[
            { rotulo: "Mediana", texto: formatarNumeroOuNulo(localizacoes.mediana) },
            { rotulo: "Máximo", texto: formatarNumeroOuNulo(localizacoes.maximo) },
          ]}
        />
      </CartaoIndicador>

      <GraficoOcupacao ocupacao={ocupacao} />
    </>
  );
}

/** Distribuição do nº de ondas por unidades recolhidas; a barra dos 24 un. (capacidade de referência) fica destacada. */
function GraficoOcupacao({ ocupacao }: { ocupacao: OcupacaoDasOndas }) {
  const { distribuicao } = ocupacao;
  if (distribuicao.length === 0) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-5 text-sm text-stone-400 sm:col-span-2 lg:col-span-3">
        sem dados
      </div>
    );
  }
  const maximo = Math.max(...distribuicao.map((d) => d.ondas));
  return (
    <figure className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-3">
      <figcaption className="text-sm font-medium text-stone-500">
        Ondas por unidades recolhidas (capacidade de referência: 24 un.)
      </figcaption>
      <ol
        aria-label="Número de ondas por unidades recolhidas"
        className="mt-4 flex h-40 items-end gap-0.5"
      >
        {distribuicao.map((d) => (
          <li
            key={d.unidades}
            title={`${formatarNumero(d.ondas)} ondas com ${d.unidades} un.`}
            className="flex h-full flex-1 flex-col justify-end"
          >
            <span
              className={`block rounded-t ${d.unidades === 24 ? "bg-amber-500" : d.unidades > 24 ? "bg-stone-500" : "bg-stone-300"}`}
              style={{ height: `${(d.ondas / maximo) * 100}%` }}
            />
          </li>
        ))}
      </ol>
      <div className="mt-1 flex justify-between text-xs text-stone-500">
        <span>{distribuicao[0].unidades} un.</span>
        <span>{distribuicao[distribuicao.length - 1].unidades} un.</span>
      </div>
      <p className="mt-2 text-xs text-stone-500">
        Laranja = 24 un. (a capacidade); cinzento-escuro = mais de 24 un. Fonte: Picking_Wave.
      </p>
    </figure>
  );
}
