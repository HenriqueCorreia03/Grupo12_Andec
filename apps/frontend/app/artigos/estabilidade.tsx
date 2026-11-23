import { CartaoIndicador, ValorIndicador } from "@/components/cartao-indicador";
import { ErroApi } from "@/components/erro-api";
import { type ClasseAbc, type EstabilidadeAbc, obterEstabilidade } from "@/lib/api";
import type { FiltrosUrl } from "@/lib/filtros";
import { formatarMes, formatarMesCurto, formatarNumero, formatarPercentagemOuNulo } from "@/lib/formatar";

/** Fundo da célula por classe do mês: um só tom, mais escuro para A. */
const FUNDO: Record<ClasseAbc, string> = { A: "bg-stone-300", B: "bg-stone-200", C: "bg-stone-100" };

/**
 * Estabilidade do ABC mensal (alavanca a): % de referências que mudam de classe entre meses consecutivos, com as
 * combinações referência-mês abaixo do limiar fora das comparações. Só apresenta: os valores vêm da API.
 */
export async function EstabilidadeDoAbc({ filtros }: { filtros: FiltrosUrl }) {
  let corpo: EstabilidadeAbc;
  try {
    corpo = await obterEstabilidade(filtros);
  } catch (e) {
    return <ErroApi mensagem={(e as Error).message} />;
  }
  const { combinacoes, limiarUnidades: limiar } = corpo;
  const valor = formatarPercentagemOuNulo(corpo.valor);
  const percentagemExcluidas = formatarPercentagemOuNulo(combinacoes.percentagemExcluidas);
  const maximo = Math.max(1, ...corpo.transicoes.map((t) => t.percentagem ?? 0));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <CartaoIndicador titulo="Referências que mudam de classe (mês a mês)" metadados={corpo} valorResumo={valor}>
          <ValorIndicador texto={valor} />
          <p className="mt-1 text-sm text-stone-600">
            {formatarNumero(corpo.mudaram)} mudanças em {formatarNumero(corpo.comparadas)} comparações (referências com ≥{" "}
            {limiar} un. nos dois meses).
          </p>
          <p className="mt-3 rounded border border-stone-200 bg-stone-50 px-2 py-1 text-sm">
            Combinações referência-mês excluídas (&lt; {limiar} un.):{" "}
            <span className="font-semibold">{formatarNumero(combinacoes.excluidas)}</span> de{" "}
            {formatarNumero(combinacoes.comUnidades)} ({percentagemExcluidas ?? "sem dados"}).
          </p>
        </CartaoIndicador>

        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <h3 className="text-sm font-medium text-stone-500">Por transição entre meses consecutivos</h3>
          {corpo.transicoes.length === 0 ? (
            <p className="mt-2 text-sm text-stone-400">sem dados: o período tem menos de dois meses.</p>
          ) : (
            <ul className="mt-3 space-y-1 text-sm">
              {corpo.transicoes.map((t) => (
                <li key={t.de} className="grid grid-cols-[9rem_1fr_9rem] items-center gap-2">
                  <span>
                    {formatarMesCurto(t.de)} → {formatarMesCurto(t.para)}
                  </span>
                  <span
                    className="h-3 rounded bg-stone-300"
                    style={{ width: `${((t.percentagem ?? 0) / maximo) * 100}%` }}
                  />
                  <span className="text-right">
                    <span className="font-medium">{formatarPercentagemOuNulo(t.percentagem) ?? "sem dados"}</span>{" "}
                    <span className="text-stone-500">
                      ({t.mudaram}/{t.comparadas})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        {corpo.referencias.length === 0 ? (
          <p className="p-5 text-sm text-stone-400">sem dados</p>
        ) : (
          <div className="max-h-[28rem] overflow-auto">
            <table className="w-full text-sm">
              <caption className="px-4 py-3 text-left text-sm font-medium text-stone-500">
                Classe de cada referência em cada mês ({formatarNumero(corpo.referencias.length)} referências, pela ordem
                do ABC global)
              </caption>
              <thead className="sticky top-0 border-y border-stone-200 bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-3 py-2 text-left font-normal">Referência</th>
                  <th className="px-3 py-2 font-normal">Global</th>
                  {corpo.meses.map((m) => (
                    <th key={m} className="px-2 py-2 font-normal" title={formatarMes(m)}>
                      {formatarMesCurto(m)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {corpo.referencias.map((r) => (
                  <tr key={r.referencia} className="border-t border-stone-100">
                    <td className="px-3 py-1 font-medium">{r.referencia}</td>
                    <td className="px-3 py-1 text-center font-semibold">{r.classeGlobal}</td>
                    {r.meses.map((m) => (
                      <td
                        key={m.mes}
                        title={`${formatarMes(m.mes)}: ${formatarNumero(m.unidades)} un.`}
                        className={
                          "px-2 py-1 text-center " +
                          (m.classe === null
                            ? "text-stone-300"
                            : m.excluida
                              ? "text-stone-400"
                              : `${FUNDO[m.classe]} font-semibold`)
                        }
                      >
                        {m.classe === null ? "·" : m.excluida ? `${m.classe}*` : m.classe}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-stone-200 px-4 py-2 text-xs text-stone-500">
          * Menos de {limiar} un. no mês: fora das comparações. · Sem procura no mês. ABC de cada mês sobre todas as
          referências.
        </p>
      </div>
    </div>
  );
}
