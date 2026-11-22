import { CartaoIndicador, ValorIndicador } from "@/components/cartao-indicador";
import { ErroApi } from "@/components/erro-api";
import { obterZonas, type ParticipacaoPorZona } from "@/lib/api";
import { formatarNumero, formatarPercentagem, formatarPercentagemOuNulo } from "@/lib/formatar";

/** Participação por zona e localizações não mapeadas (ticket 04): só apresenta, os valores vêm da API. */
export async function ParticipacaoZonas() {
  let zonas: ParticipacaoPorZona;
  try {
    zonas = (await obterZonas()).participacaoPorZona;
  } catch (e) {
    return <ErroApi mensagem={(e as Error).message} />;
  }
  const { naoMapeadas } = zonas;
  const percentagemNaoMapeadas = formatarPercentagemOuNulo(naoMapeadas.percentagem);
  const maximo = Math.max(1, ...zonas.zonas.map((z) => z.percentagem));

  return (
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
              <li key={z.zona} className="grid grid-cols-[2.5rem_1fr_6rem] items-center gap-2">
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
  );
}
