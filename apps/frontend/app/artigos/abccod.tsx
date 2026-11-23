import { CartaoIndicador, ValorIndicador } from "@/components/cartao-indicador";
import { ErroApi } from "@/components/erro-api";
import { type AbcVsAbccod, CLASSES_ABC, obterAbcVsAbccod } from "@/lib/api";
import type { FiltrosUrl } from "@/lib/filtros";
import { formatarNumero, formatarPercentagemOuNulo } from "@/lib/formatar";

/**
 * Comparação ABC calculado ↔ ABCCOD do Product (ticket 16): matriz de coincidência e % de coincidência.
 * É contraste, não verificação. Só apresenta: os valores vêm da API, sempre sobre o dataset completo.
 */
export async function AbcVersusAbccod({ filtros }: { filtros: FiltrosUrl }) {
  let corpo: AbcVsAbccod;
  try {
    corpo = await obterAbcVsAbccod(filtros);
  } catch (e) {
    return <ErroApi mensagem={(e as Error).message} />;
  }
  const valor = formatarPercentagemOuNulo(corpo.valor);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <CartaoIndicador titulo="Coincidência ABC calculado ↔ ABCCOD" metadados={corpo} valorResumo={valor}>
        <ValorIndicador texto={valor} />
        <p className="mt-1 text-sm text-stone-600">
          {formatarNumero(corpo.coincidem)} de {formatarNumero(corpo.comparadas)} referências têm a mesma classe nos dois.
        </p>
        <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900">{corpo.nota}</p>
      </CartaoIndicador>

      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <table className="w-full text-sm">
          <caption className="pb-3 text-left text-sm font-medium text-stone-500">
            Nº de referências: linhas = ABC calculado (global), colunas = ABCCOD do Product. A diagonal coincide.
          </caption>
          <thead className="text-stone-500">
            <tr>
              <th className="py-1 text-left font-normal">ABC ↓ · ABCCOD →</th>
              {CLASSES_ABC.map((c) => (
                <th key={c} className="py-1 text-right font-normal">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {corpo.matriz.map((linha) => (
              <tr key={linha.classe} className="border-t border-stone-100">
                <th scope="row" className="py-1.5 text-left font-semibold">
                  {linha.classe}
                </th>
                {CLASSES_ABC.map((c) => (
                  <td
                    key={c}
                    className={"py-1.5 text-right " + (c === linha.classe ? "bg-stone-100 font-semibold" : "")}
                  >
                    {formatarNumero(linha.abccod[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
