/** Aviso mostrado quando a API do backend não responde ou responde com erro. */
export function ErroApi({ mensagem }: { mensagem: string }) {
  return (
    <div role="alert" className="col-span-full rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">
      <p className="font-medium">Não foi possível obter os dados da API.</p>
      <p className="mt-1">{mensagem}</p>
    </div>
  );
}
