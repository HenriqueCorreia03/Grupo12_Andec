import { CartaoIndicador, DetalhesIndicador, ValorIndicador } from "@/components/cartao-indicador";
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
    <CartaoIndicador titulo="Ondas incompletas simultâneas" metadados={dados} valorResumo={valor}>
      <ValorIndicador texto={valor} unidade="ondas" />
      <DetalhesIndicador
        detalhes={[
          {
            rotulo: "Incompletas (< 24 un.)",
            texto: semDados
              ? null
              : `${formatarNumero(dados.ondasIncompletas)} (${formatarPercentagemOuNulo(dados.percentagemIncompletas)} das ondas)`,
          },
          { rotulo: "Grupos dia/hora", texto: semDados ? null : formatarNumero(dados.gruposDiaHora) },
          { rotulo: "Pedidos divididos envolvidos", texto: semDados ? null : formatarNumero(dados.pedidosDivididosEnvolvidos) },
        ]}
      />
      <p className="mt-3 rounded border border-stone-300 bg-stone-100 px-2 py-1 text-xs text-stone-700">
        {dados.rotulo[0].toUpperCase() + dados.rotulo.slice(1)}: mede o que aconteceu, não simula juntar ondas nem prevê poupança.
      </p>
    </CartaoIndicador>
  );
}
