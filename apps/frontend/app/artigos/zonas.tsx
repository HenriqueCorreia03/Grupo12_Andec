import { CartaoIndicador, ValorIndicador } from "@/components/cartao-indicador";
import { ErroApi } from "@/components/erro-api";
import { obterZonas, type ZonasDoPicking } from "@/lib/api";
import type { FiltrosUrl } from "@/lib/filtros";
import { formatarNumero, formatarPercentagem, formatarPercentagemOuNulo } from "@/lib/formatar";

/** Classe da linha de uma zona: a zona do filtro fica em destaque, as outras mantêm-se visíveis. */
function linhaZona(zona: string, selecionadas: string[]): string {
  return selecionadas.includes(zona) ? "rounded bg-amber-50 font-semibold" : "";
}

/**
 * Participação por zona (picking), não mapeadas, unidades encomendadas por zona (ligação CO ↔ PW) e pedidos
 * multizona. Só apresenta: os valores vêm da API e as repartições mostram sempre todas as zonas.
 */
export async function ParticipacaoZonas({ filtros }: { filtros: FiltrosUrl }) {
  let corpo: ZonasDoPicking;
  try {
    corpo = await obterZonas(filtros);
  } catch (e) {
    return <ErroApi mensagem={(e as Error).message} />;
  }
  const { participacaoPorZona: zonas, unidadesEncomendadasPorZona: encomenda, pedidosMultizona: multizona } = corpo;
  const selecionada = corpo.zonasSelecionadas;
  const { naoMapeadas } = zonas;
  const percentagemNaoMapeadas = formatarPercentagemOuNulo(naoMapeadas.percentagem);
  const maximo = Math.max(1, ...zonas.zonas.map((z) => z.percentagem));
  const maximoEncomenda = Math.max(1, ...encomenda.zonas.map((z) => z.unidades), encomenda.naoMapeada, encomenda.semZona);
  const percentagemMultizona = formatarPercentagemOuNulo(multizona.valor);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <CartaoIndicador
          titulo="Participação por zona"
          metadados={zonas}
          valorResumo={zonas.zonas.map((z) => `${z.zona} ${formatarPercentagem(z.percentagem)}`).join("; ") || null}
        >
          {zonas.zonas.length === 0 ? (
            <ValorIndicador texto={null} />
          ) : (
            <ul className="mt-3 space-y-1 text-sm">
              {zonas.zonas.map((z) => (
                <li
                  key={z.zona}
                  className={`grid grid-cols-[2.5rem_1fr_6rem] items-center gap-2 ${linhaZona(z.zona, selecionada)}`}
                >
                  <span className="font-semibold">{z.zona}</span>
                  <span className="h-3 rounded bg-stone-300" style={{ width: `${(z.percentagem / maximo) * 100}%` }} />
                  <span className="text-right font-medium">
                    {formatarPercentagem(z.percentagem)} <span className="text-stone-500">({formatarNumero(z.unidades)})</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-stone-500">Percentagem sobre as unidades recolhidas em localizações mapeadas.</p>
        </CartaoIndicador>

        <CartaoIndicador titulo="Localizações não mapeadas" metadados={zonas} valorResumo={percentagemNaoMapeadas}>
          <ValorIndicador texto={percentagemNaoMapeadas} unidade="do total recolhido" />
          <p className="mt-2 text-sm">
            {formatarNumero(naoMapeadas.unidades)} un. no total, das quais{" "}
            <span className="font-semibold">RC-01: {formatarNumero(naoMapeadas.rc01Unidades)} un.</span> (em separado).
          </p>
          {naoMapeadas.localizacoes.length > 0 && (
            <ul className="mt-3 max-h-48 space-y-0.5 overflow-auto text-sm">
              {naoMapeadas.localizacoes.map((l) => (
                <li key={l.localizacao} className="flex justify-between gap-4">
                  <span className={l.localizacao === "RC-01" ? "font-semibold" : ""}>{l.localizacao}</span>
                  <span className="font-medium">{formatarNumero(l.unidades)}</span>
                </li>
              ))}
            </ul>
          )}
        </CartaoIndicador>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <CartaoIndicador
          titulo="Unidades encomendadas por zona"
          metadados={encomenda}
          valorResumo={encomenda.total === 0 ? null : `${formatarNumero(encomenda.total)} un.`}
        >
          {encomenda.total === 0 ? (
            <ValorIndicador texto={null} />
          ) : (
            <ul className="mt-3 space-y-1 text-sm">
              {encomenda.zonas.map((z) => (
                <li
                  key={z.zona}
                  className={`grid grid-cols-[5.5rem_1fr_5rem] items-center gap-2 ${linhaZona(z.zona, selecionada)}`}
                >
                  <span className="font-semibold">{z.zona}</span>
                  <span className="h-3 rounded bg-stone-300" style={{ width: `${(z.unidades / maximoEncomenda) * 100}%` }} />
                  <span className="text-right font-medium">{formatarNumero(z.unidades)}</span>
                </li>
              ))}
              <li className="grid grid-cols-[5.5rem_1fr_5rem] items-center gap-2 text-stone-600">
                <span>não mapeada</span>
                <span className="h-3 rounded bg-stone-200" style={{ width: `${(encomenda.naoMapeada / maximoEncomenda) * 100}%` }} />
                <span className="text-right font-medium">{formatarNumero(encomenda.naoMapeada)}</span>
              </li>
              <li className="grid grid-cols-[5.5rem_1fr_5rem] items-center gap-2 text-stone-600">
                <span>sem zona</span>
                <span className="h-3 rounded bg-stone-200" style={{ width: `${(encomenda.semZona / maximoEncomenda) * 100}%` }} />
                <span className="text-right font-medium">{formatarNumero(encomenda.semZona)}</span>
              </li>
            </ul>
          )}
          <p className="mt-3 text-xs text-stone-500">
            Repartição proporcional do recolhido pelos pedidos (onda + referência + tamanho). &quot;Sem zona&quot; =
            falta de picking e linhas sem correspondência no picking.
          </p>
        </CartaoIndicador>

        <CartaoIndicador titulo="Pedidos multizona" metadados={multizona} valorResumo={percentagemMultizona}>
          <ValorIndicador texto={percentagemMultizona} unidade="dos pedidos" />
          <p className="mt-2 text-sm">
            {formatarNumero(multizona.pedidosMultizona)} de {formatarNumero(multizona.pedidosValidos)} pedidos válidos
            têm unidades em 2 ou mais zonas.
          </p>
        </CartaoIndicador>
      </div>
    </div>
  );
}
