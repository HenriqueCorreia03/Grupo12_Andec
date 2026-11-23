import { CartaoIndicador, ValorIndicador } from "@/components/cartao-indicador";
import { ErroApi } from "@/components/erro-api";
import { obterOndasIncompletas, type OndasIncompletas } from "@/lib/api";
import type { FiltrosUrl } from "@/lib/filtros";
import { formatarNumero, formatarPercentagemOuNulo } from "@/lib/formatar";

/** Ondas incompletas simultâneas (extra, P6): só apresenta, os números vêm da API. */
export async function OndasIncompletasCartao({ filtros }: { filtros: FiltrosUrl }) {
  let dados: OndasIncompletas;
  try {
    dados = await obterOndasIncompletas(filtros);
  } catch (e) {
    return <ErroApi mensagem={(e as Error).message} />;
  }
  const semDados = dados.ondasDoPicking === 0;
  const valor = semDados ? null : formatarNumero(dados.ondasSimultaneas);
  return (
    <CartaoIndicador
      titulo="Ondas incompletas simultâneas"
      metadados={dados}
      valorResumo={valor}
      leitura={
        semDados
          ? null
          : `De ${formatarNumero(dados.ondasIncompletas)} ondas com menos de 24 un. (${formatarPercentagemOuNulo(dados.percentagemIncompletas)} das ondas), ` +
            `em ${formatarNumero(dados.gruposDiaHora)} combinações de dia e hora; envolvem ${formatarNumero(dados.pedidosDivididosEnvolvidos)} pedidos partidos.`
      }
    >
      <ValorIndicador texto={valor} unidade="ondas" />
      <p className="mt-3 rounded border border-stone-300 bg-stone-100 px-2 py-1 text-xs text-stone-700">
        {dados.rotulo[0].toUpperCase() + dados.rotulo.slice(1)}: mede o que aconteceu, não simula juntar ondas nem prevê poupança.
      </p>
    </CartaoIndicador>
  );
}
