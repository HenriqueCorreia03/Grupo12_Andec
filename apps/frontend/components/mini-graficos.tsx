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

/**
 * Barra "parte de um todo" com os números reais: por cima o todo, depois a barra com as duas partes no seu
 * tamanho verdadeiro (a parte pintada com a cor do estado, o resto a cinzento) e, por baixo, o que é cada uma.
 */
export function BarraParteTodo({
  parte,
  todo,
  classe,
  titulo,
  rotuloParte,
  rotuloResto,
}: {
  parte: number;
  todo: number;
  classe: string;
  titulo: string;
  rotuloParte: string;
  rotuloResto: string;
}) {
  if (todo <= 0) return null;
  const resto = Math.max(0, todo - parte);
  const largura = Math.max(0, Math.min(100, (parte / todo) * 100));
  const formatar = (v: number) =>
    new Intl.NumberFormat("pt-PT", { useGrouping: "always" }).format(v);
  return (
    <figure
      className="mt-3"
      aria-label={`${titulo}: ${formatar(parte)} ${rotuloParte}; ${formatar(resto)} ${rotuloResto}`}
    >
      <figcaption className="text-xs text-stone-600">{titulo}</figcaption>
      <div className="mt-1 flex h-4 overflow-hidden rounded" aria-hidden="true">
        <span className={classe} style={{ width: `${largura}%` }} />
        <span className="flex-1 bg-stone-300" />
      </div>
      <div
        className="mt-1.5 grid grid-cols-2 gap-2 text-xs leading-snug"
        aria-hidden="true"
      >
        <p>
          <span className="block text-base font-semibold text-stone-900">
            {formatar(parte)}
          </span>
          <span className="text-stone-600">{rotuloParte}</span>
        </p>
        <p className="text-right">
          <span className="block text-base font-semibold text-stone-500">
            {formatar(resto)}
          </span>
          <span className="text-stone-500">{rotuloResto}</span>
        </p>
      </div>
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

/**
 * Barra com várias partes no seu tamanho real (por exemplo, as classes A, B e C) e, por baixo, cada parte com o seu
 * número. A ordem e as cores vêm de quem a usa.
 */
export function BarraSegmentos({
  titulo,
  segmentos,
}: {
  titulo: string;
  segmentos: { valor: number; rotulo: string; classe: string }[];
}) {
  const total = segmentos.reduce((soma, s) => soma + s.valor, 0);
  if (total <= 0) return null;
  const formatar = (v: number) =>
    new Intl.NumberFormat("pt-PT", { useGrouping: "always" }).format(v);
  return (
    <figure
      className="mt-3"
      aria-label={`${titulo}: ${segmentos.map((s) => `${formatar(s.valor)} ${s.rotulo}`).join("; ")}`}
    >
      <figcaption className="text-xs text-stone-600">{titulo}</figcaption>
      <div className="mt-1 flex h-4 overflow-hidden rounded" aria-hidden="true">
        {segmentos.map((s) => (
          <span
            key={s.rotulo}
            className={s.classe}
            style={{ width: `${(s.valor / total) * 100}%` }}
          />
        ))}
      </div>
      <ul
        className="mt-1.5 space-y-0.5 text-xs leading-snug"
        aria-hidden="true"
      >
        {segmentos.map((s) => (
          <li key={s.rotulo} className="flex items-baseline gap-1.5">
            <span
              className={`inline-block h-2.5 w-2.5 shrink-0 rounded-sm ${s.classe}`}
            />
            <span className="font-semibold text-stone-900">
              {formatar(s.valor)}
            </span>
            <span className="text-stone-600">{s.rotulo}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
