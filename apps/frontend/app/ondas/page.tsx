import { Suspense } from "react";
import { PickingOndas } from "./picking-ondas";

export default function OndasPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Ondas e pedidos</h1>
      <p className="mt-1 text-sm text-stone-500">
        Alavanca (b). Indicadores calculados no servidor. Passe o rato por um cartão para ver a definição.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-lg border border-stone-200 bg-white" />}>
          <PickingOndas />
        </Suspense>
      </div>
    </section>
  );
}
