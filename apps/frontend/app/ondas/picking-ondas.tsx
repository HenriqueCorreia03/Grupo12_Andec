import { CartaoIndicador, DetalhesIndicador, ValorIndicador } from "@/components/cartao-indicador";
import { ErroApi } from "@/components/erro-api";
import Link from "next/link";
import { obterPicking, type OcupacaoDasOndas, type OndaPicking, type PickingDasOndas } from "@/lib/api";
import { consulta, type FiltrosUrl } from "@/lib/filtros";
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
      {filtros.onda === undefined && <ListaDeOndas ondas={dados.ondas} filtros={filtros} />}
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

const ONDAS_NA_LISTA = 25;

/** As primeiras ondas do filtro atual; cada uma abre o detalhe (drill-through), mantendo os filtros globais. */
function ListaDeOndas({ ondas, filtros }: { ondas: OndaPicking[]; filtros: FiltrosUrl }) {
  if (ondas.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm sm:col-span-2 lg:col-span-3">
      <table className="w-full text-sm">
        <caption className="px-4 py-3 text-left text-sm font-medium text-stone-500">
          Ondas (primeiras {formatarNumero(Math.min(ONDAS_NA_LISTA, ondas.length))} de {formatarNumero(ondas.length)}):
          clique numa onda para ver o detalhe. Use os filtros (mês, zona, operador…) para chegar a outras.
        </caption>
        <thead className="border-y border-stone-200 bg-stone-50 text-left text-stone-500">
          <tr>
            <th className="px-4 py-2 font-normal">Onda</th>
            <th className="px-4 py-2 font-normal">Data</th>
            <th className="px-4 py-2 text-right font-normal">Unidades</th>
            <th className="px-4 py-2 text-right font-normal">Ocupação</th>
            <th className="px-4 py-2 text-right font-normal">Localizações</th>
          </tr>
        </thead>
        <tbody>
          {ondas.slice(0, ONDAS_NA_LISTA).map((o) => (
            <tr key={o.onda} className="border-t border-stone-100">
              <td className="px-4 py-1.5">
                <Link
                  href={`/ondas${consulta({ ...filtros, onda: o.onda })}`}
                  className="font-medium underline-offset-2 hover:underline"
                >
                  {o.onda}
                </Link>
              </td>
              <td className="px-4 py-1.5 text-stone-500">{o.data ? `${o.data} ${o.hora ?? ""}` : "—"}</td>
              <td className="px-4 py-1.5 text-right">{formatarNumero(o.unidades)}</td>
              <td className="px-4 py-1.5 text-right">{formatarPercentagemOuNulo(o.ocupacao)}</td>
              <td className="px-4 py-1.5 text-right">{formatarNumero(o.localizacoes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
