import { CartaoIndicador, ValorIndicador } from "@/components/cartao-indicador";
import { ErroApi } from "@/components/erro-api";
import Link from "next/link";
import { obterPicking, type OcupacaoDasOndas, type OndaPicking, type PickingDasOndas } from "@/lib/api";
import { LINHAS_VISIVEIS } from "@/lib/apresentacao";
import { consulta, type FiltrosUrl } from "@/lib/filtros";
import { formatarNumero, formatarNumeroOuNulo, formatarPercentagemOuNulo } from "@/lib/formatar";

/**
 * Cartões de picking da faixa de KPI (ticket 04; ticket 19): ocupação, paragens e localizações por onda.
 * Só apresenta, os valores vêm calculados pela API.
 */
export async function CartoesDePicking({ filtros }: { filtros: FiltrosUrl }) {
  let dados: PickingDasOndas;
  try {
    dados = await obterPicking(filtros);
  } catch (e) {
    return <ErroApi mensagem={(e as Error).message} />;
  }
  const { ocupacao, paragens, localizacoesPorOnda: localizacoes } = dados;
  const valorOcupacao = formatarPercentagemOuNulo(ocupacao.valor);
  const mediaLocalizacoes = formatarNumeroOuNulo(localizacoes.media);
  const valorParagens = formatarNumeroOuNulo(paragens.valor);

  return (
    <>
      <CartaoIndicador
        titulo="Ocupação média das ondas"
        metadados={ocupacao}
        valorResumo={valorOcupacao}
        leitura={
          `${formatarNumero(ocupacao.ondasCom24)} de ${formatarNumero(ocupacao.ondas)} ondas com 24 un. ` +
          `(${formatarPercentagemOuNulo(ocupacao.percentagemCom24) ?? "sem dados"}); ` +
          `${formatarNumero(ocupacao.ondasMaisDe24)} com > 24 un.; mín./máx. ` +
          `${formatarNumeroOuNulo(ocupacao.minimo) ?? "-"} / ${formatarNumeroOuNulo(ocupacao.maximo) ?? "-"} un.`
        }
      >
        <ValorIndicador texto={valorOcupacao} unidade="de 24 un." />
      </CartaoIndicador>

      <CartaoIndicador titulo="Paragens" metadados={paragens} valorResumo={valorParagens}>
        <ValorIndicador texto={valorParagens} unidade="pares (onda, localização)" />
      </CartaoIndicador>

      <CartaoIndicador
        titulo="Localizações distintas por onda"
        metadados={localizacoes}
        valorResumo={mediaLocalizacoes}
        leitura={
          `Mediana ${formatarNumeroOuNulo(localizacoes.mediana) ?? "sem dados"}; ` +
          `máximo ${formatarNumeroOuNulo(localizacoes.maximo) ?? "sem dados"} localizações numa onda.`
        }
      >
        <ValorIndicador texto={mediaLocalizacoes} unidade="localizações/onda" />
      </CartaoIndicador>
    </>
  );
}

/**
 * Resumo visual (gráfico de ocupação) e detalhe (lista de ondas, só sem filtro de onda) da página Ondas e pedidos.
 * Usa o mesmo pedido à API que os cartões (o Next memoriza-o no pedido).
 */
export async function OcupacaoEListaDeOndas({
  filtros,
  lista,
  listaAberta,
}: {
  filtros: FiltrosUrl;
  /** Que ondas a lista mostra: só as incompletas (< 24 un., por omissão) ou todas. */
  lista: "incompletas" | "todas";
  /** Mostra a lista inteira em vez das primeiras 10. */
  listaAberta: boolean;
}) {
  let dados: PickingDasOndas;
  try {
    dados = await obterPicking(filtros);
  } catch (e) {
    return <ErroApi mensagem={(e as Error).message} />;
  }
  return (
    <>
      <GraficoOcupacao ocupacao={dados.ocupacao} />
      {filtros.onda === undefined && (
        <ListaDeOndas ondas={dados.ondas} filtros={filtros} lista={lista} aberta={listaAberta} />
      )}
    </>
  );
}

/** Distribuição do nº de ondas por unidades recolhidas; a barra dos 24 un. (capacidade de referência) fica destacada. */
function GraficoOcupacao({ ocupacao }: { ocupacao: OcupacaoDasOndas }) {
  const { distribuicao } = ocupacao;
  if (distribuicao.length === 0) {
    return <div className="rounded-lg border border-stone-200 bg-white p-5 text-sm text-stone-500">sem dados</div>;
  }
  const maximo = Math.max(...distribuicao.map((d) => d.ondas));
  return (
    <figure className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
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

/**
 * Ondas do filtro atual, por ordem de data: as primeiras 10 e "Ver todas (N)" (ticket 19). A lista inteira só é
 * montada quando se pede (`ondas=todas`), porque pode ter milhares de ondas. Cada onda abre o detalhe
 * (drill-through), mantendo os filtros globais.
 */
function ListaDeOndas({
  ondas: todasAsOndas,
  filtros,
  lista,
  aberta,
}: {
  ondas: OndaPicking[];
  filtros: FiltrosUrl;
  lista: "incompletas" | "todas";
  aberta: boolean;
}) {
  if (todasAsOndas.length === 0) return null;
  const incompletas = todasAsOndas.filter((o) => o.unidadesDaOnda < 24);
  const ondas = lista === "incompletas" ? incompletas : todasAsOndas;
  const visiveis = aberta ? ondas : ondas.slice(0, LINHAS_VISIVEIS);
  const parametroLista = lista === "todas" ? "todas" : null;
  const hrefLista = (valor: "incompletas" | "todas") => `/ondas${consulta(filtros, { lista: valor === "todas" ? "todas" : null })}`;
  const hrefAbrir = `/ondas${consulta(filtros, { lista: parametroLista, ondas: aberta ? null : "todas" })}`;
  return (
    <div className="rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="px-4 pt-4">
        <h3 id="lista-ondas" className="scroll-mt-4 text-sm font-semibold">Lista de ondas</h3>
        <p className="mt-1 max-w-3xl text-sm text-stone-700">
          Cada linha é uma onda de picking, um conjunto de pedidos recolhido de uma vez. Clique no número de uma onda para ver os seus
          pedidos, as linhas e as localizações. Uma onda está <strong>incompleta</strong> quando recolhe menos de 24 unidades (a capacidade de referência).
        </p>
        <div role="group" aria-label="Que ondas mostrar" className="mt-3 inline-flex overflow-hidden rounded border border-stone-300 text-sm">
          <Link
            href={hrefLista("incompletas")}
            aria-current={lista === "incompletas" ? "true" : undefined}
            className={`px-3 py-1.5 ${lista === "incompletas" ? "bg-stone-900 text-white" : "bg-white hover:bg-stone-100"}`}
          >
            Só incompletas ({formatarNumero(incompletas.length)})
          </Link>
          <Link
            href={hrefLista("todas")}
            aria-current={lista === "todas" ? "true" : undefined}
            className={`border-l border-stone-300 px-3 py-1.5 ${lista === "todas" ? "bg-stone-900 text-white" : "bg-white hover:bg-stone-100"}`}
          >
            Todas ({formatarNumero(todasAsOndas.length)})
          </Link>
        </div>
      </div>
      <div className={`mt-3 overflow-x-auto ${aberta ? "max-h-[32rem] overflow-y-auto" : ""}`}>
        <table className="w-full min-w-[32rem] text-sm">
          <caption className="sr-only">
            {lista === "incompletas" ? "Ondas incompletas" : "Todas as ondas"}, por ordem de data
          </caption>
          <thead className="sticky top-0 border-y border-stone-200 bg-stone-50 text-left text-stone-500">
            <tr>
              <th className="px-4 py-2 font-normal">Onda</th>
              <th className="px-4 py-2 font-normal">Data</th>
              <th className="px-4 py-2 text-right font-normal">Unidades</th>
              <th className="px-4 py-2 text-right font-normal">Ocupação</th>
              <th className="px-4 py-2 text-right font-normal">Localizações</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((o) => (
              <tr key={o.onda} className="border-t border-stone-100">
                <td className="px-4 py-1.5">
                  <Link
                    href={`/ondas${consulta({ ...filtros, onda: o.onda })}`}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {o.onda}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-1.5 text-stone-500">{o.data ? `${o.data} ${o.hora ?? ""}` : "—"}</td>
                <td className="px-4 py-1.5 text-right">{formatarNumero(o.unidades)}</td>
                <td className="px-4 py-1.5 text-right">{formatarPercentagemOuNulo(o.ocupacao)}</td>
                <td className="px-4 py-1.5 text-right">{formatarNumero(o.localizacoes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {ondas.length > LINHAS_VISIVEIS && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-stone-200 px-4 py-2 text-sm text-stone-600">
          <span>
            A mostrar {formatarNumero(visiveis.length)} de {formatarNumero(ondas.length)}, por ordem de data.
          </span>
          <Link href={hrefAbrir} scroll={false} className="font-medium text-stone-900 underline underline-offset-2">
            {aberta ? `Mostrar só as primeiras ${LINHAS_VISIVEIS}` : `Ver todas (${formatarNumero(ondas.length)})`}
          </Link>
        </p>
      )}
    </div>
  );
}
