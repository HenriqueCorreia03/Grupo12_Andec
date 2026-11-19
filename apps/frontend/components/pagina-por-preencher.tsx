interface Props {
  titulo: string;
  subtitulo?: string;
}

/** Página que ainda não tem conteúdo (é preenchida nos tickets seguintes). */
export function PaginaPorPreencher({ titulo, subtitulo }: Props) {
  return (
    <section>
      <h1 className="text-2xl font-semibold">{titulo}</h1>
      {subtitulo && <p className="mt-1 text-sm text-stone-500">{subtitulo}</p>}
      <p className="mt-6 text-sm text-stone-500">Página por preencher nos tickets seguintes.</p>
    </section>
  );
}
