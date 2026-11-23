/**
 * Mini-gráficos para ler um cartão sem ler o texto (Visão geral). Sem JavaScript no cliente: só HTML e CSS.
 * Os valores vêm da API; aqui só se arredonda para desenhar (o número exato continua escrito no cartão).
 */

/**
 * Grelha de 100 quadrados ("em cada 100"): pinta tantos quadrados quanto a percentagem arredondada.
 * `classe` é a cor dos pintados (a do estado do cartão); os outros ficam cinzentos.
 */
export function Grelha100({
  percentagem,
  classe,
  legenda,
}: {
  percentagem: number | null;
  classe: string;
  legenda: string;
}) {
  if (percentagem === null) return null;
  const pintados = Math.max(0, Math.min(100, Math.round(percentagem)));
  return (
    <figure
      className="mt-3 flex items-center gap-3"
      aria-label={`${pintados} em cada 100 ${legenda}`}
    >
      <div
        className="grid w-[86px] shrink-0 grid-cols-10 gap-[2px]"
        aria-hidden="true"
      >
        {Array.from({ length: 100 }, (_, i) => (
          <span
            key={i}
            className={`aspect-square rounded-[1px] ${i < pintados ? classe : "bg-stone-200"}`}
          />
        ))}
      </div>
      <figcaption className="text-xs leading-snug text-stone-600">
        <span className="block text-lg font-semibold leading-none text-stone-900">
          {pintados} em cada 100
        </span>
        {legenda}
      </figcaption>
    </figure>
  );
}

/** Mini-barras verticais pela ordem recebida; a barra em destaque fica a laranja e com o rótulo a negrito. */
export function MiniBarras({
  itens,
}: {
  itens: { rotulo: string; valor: number; destaque?: boolean }[];
}) {
  const maximo = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <div className="mt-3" aria-hidden="true">
      <div className="flex h-14 items-end gap-[3px]">
        {itens.map((i) => (
          <span
            key={i.rotulo}
            className={`flex-1 rounded-t-[2px] ${i.destaque ? "bg-amber-500" : "bg-[#86b6ef]"}`}
            style={{ height: `${Math.max(4, (i.valor / maximo) * 100)}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex gap-[3px] text-[10px] text-stone-500">
        {itens.map((i) => (
          <span
            key={i.rotulo}
            className={`flex-1 text-center ${i.destaque ? "font-semibold text-stone-900" : ""}`}
          >
            {i.rotulo}
          </span>
        ))}
      </div>
    </div>
  );
}
