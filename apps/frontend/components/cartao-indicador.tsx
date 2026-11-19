import { formatarNumero } from "@/lib/formatar";

export interface DetalheIndicador {
  rotulo: string;
  valor: number | null;
}

interface Props {
  titulo: string;
  /** Valor sem arredondamento, como vem da API; nulo = "sem dados". */
  valor: number | null;
  unidade?: string;
  detalhes?: DetalheIndicador[];
  definicao: string;
  fonte: string;
  /** Texto sobre o que ficou de fora (por exemplo, "2 pedidos com 0 un. excluídos"). */
  exclusoes?: string;
}

/** Cartão de um indicador. Só apresenta: os valores vêm calculados pela API. */
export function CartaoIndicador({ titulo, valor, unidade, detalhes = [], definicao, fonte, exclusoes }: Props) {
  return (
    <article
      className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
      title={`${definicao}\nFonte: ${fonte}${exclusoes ? `\n${exclusoes}` : ""}`}
    >
      <h2 className="text-sm font-medium text-stone-500">{titulo}</h2>
      {valor === null ? (
        <p className="mt-2 text-2xl font-semibold text-stone-400">sem dados</p>
      ) : (
        <p className="mt-2 text-3xl font-semibold">
          {formatarNumero(valor)}
          {unidade && <span className="ml-1 text-base font-normal text-stone-500">{unidade}</span>}
        </p>
      )}
      {detalhes.length > 0 && (
        <dl className="mt-3 flex gap-4 text-sm">
          {detalhes.map((d) => (
            <div key={d.rotulo} className="flex gap-1">
              <dt className="text-stone-500">{d.rotulo}</dt>
              <dd className="font-medium">{d.valor === null ? "sem dados" : formatarNumero(d.valor)}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-3 text-xs text-stone-500">Fonte: {fonte}</p>
      {exclusoes && <p className="text-xs text-stone-500">{exclusoes}</p>}
    </article>
  );
}
