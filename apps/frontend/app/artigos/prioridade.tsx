import { CartaoIndicador, ValorIndicador } from "@/components/cartao-indicador";
import { ErroApi } from "@/components/erro-api";
import { obterPrioridade, type PrioridadeDosArtigos } from "@/lib/api";
import type { FiltrosUrl } from "@/lib/filtros";
import { formatarNumero, formatarNumeroOuNulo } from "@/lib/formatar";

/**
 * Prioridade da alavanca (a): referências por nº de paragens (pares onda × localização) e dispersão dos artigos A
 * por localizações distintas. Só apresenta: a ordem e os valores vêm da API.
 */
export async function PrioridadeArtigos({ filtros }: { filtros: FiltrosUrl }) {
  let corpo: PrioridadeDosArtigos;
  try {
    corpo = await obterPrioridade(filtros);
  } catch (e) {
    return <ErroApi mensagem={(e as Error).message} />;
  }
  const { resumoA, artigos } = corpo;
  const { localizacoes } = resumoA;
  const mediana = formatarNumeroOuNulo(localizacoes.mediana);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <CartaoIndicador
        titulo="Localizações distintas por artigo A"
        metadados={corpo}
        valorResumo={mediana && `mediana ${mediana}`}
        limitacao={corpo.limitacao}
      >
        <ValorIndicador texto={mediana} unidade="localizações (mediana)" />
        <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-stone-500">Média</dt>
            <dd className="font-medium">{formatarNumeroOuNulo(localizacoes.media) ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Mínimo</dt>
            <dd className="font-medium">{formatarNumeroOuNulo(localizacoes.minimo) ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Máximo</dt>
            <dd className="font-medium">{formatarNumeroOuNulo(localizacoes.maximo) ?? "—"}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-stone-600">
          {formatarNumero(resumoA.artigosAComPicking)} de {formatarNumero(resumoA.artigosA)} artigos A (classe global) com
          picking.
        </p>
      </CartaoIndicador>

      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        {artigos.length === 0 ? (
          <p className="p-5 text-sm text-stone-500">sem dados</p>
        ) : (
          <div className="max-h-[28rem] overflow-y-auto">
            <table className="w-full text-sm">
              <caption className="px-4 py-3 text-left text-sm font-medium text-stone-500">
                Prioridade de reposicionamento ({formatarNumero(artigos.length)} referências com picking): por paragens,
                depois localizações distintas, depois código
              </caption>
              <thead className="sticky top-0 border-y border-stone-200 bg-stone-50 text-left text-stone-500">
                <tr>
                  <th className="px-4 py-2 font-normal">#</th>
                  <th className="px-4 py-2 font-normal">Referência</th>
                  <th className="px-4 py-2 text-center font-normal">Classe global</th>
                  <th className="px-4 py-2 text-right font-normal">Paragens</th>
                  <th className="px-4 py-2 text-right font-normal">Localizações</th>
                  <th className="px-4 py-2 text-right font-normal">Un. recolhidas</th>
                </tr>
              </thead>
              <tbody>
                {artigos.map((a) => (
                  <tr key={a.referencia} className="border-t border-stone-100">
                    <td className="px-4 py-1.5 text-stone-500">{a.posicao}</td>
                    <td className="px-4 py-1.5 font-medium">{a.referencia}</td>
                    <td className="px-4 py-1.5 text-center font-semibold">{a.classe ?? "—"}</td>
                    <td className="px-4 py-1.5 text-right">{formatarNumero(a.paragens)}</td>
                    <td className="px-4 py-1.5 text-right">
                      {formatarNumero(a.localizacoesDistintas)}
                      {a.passaPeloRc01 && <span title="Inclui o RC-01, contado como 1 localização"> †</span>}
                    </td>
                    <td className="px-4 py-1.5 text-right">{formatarNumero(a.unidadesRecolhidas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-stone-200 px-4 py-2 text-xs text-stone-500">
          † Passa pelo RC-01, contado como 1 localização. Fonte: {corpo.fonte}.
        </p>
      </div>
    </div>
  );
}
