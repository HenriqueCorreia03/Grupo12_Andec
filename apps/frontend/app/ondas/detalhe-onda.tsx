import Link from "next/link";
import { ErroApi } from "@/components/erro-api";
import { Onda24 } from "@/components/mini-graficos";
import { TabelaRecolhida } from "@/components/tabela-recolhida";
import { obterDetalheOnda, type DetalheOnda } from "@/lib/api";
import { consulta, type FiltrosUrl } from "@/lib/filtros";
import { formatarNumero, formatarPercentagemOuNulo } from "@/lib/formatar";

/**
 * Vista de detalhe de uma onda (drill-through, ticket 09): pedidos, linhas, localizações, zonas e operadores.
 * Só apresenta; a onda é uma entidade completa e os valores vêm da API.
 */
export async function DetalheDaOnda({ onda, filtros }: { onda: string; filtros: FiltrosUrl }) {
  let detalhe: DetalheOnda | null;
  try {
    detalhe = await obterDetalheOnda(onda);
  } catch (e) {
    return <ErroApi mensagem={(e as Error).message} />;
  }
  const semOnda = consulta({ ...filtros, onda: undefined });
  if (detalhe === null) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-5 text-sm">
        <p>
          A onda <span className="font-semibold">{onda}</span> não existe nos dados.
        </p>
        <Link href={`/ondas${semOnda}`} className="mt-2 inline-block underline">
          Ver todas as ondas
        </Link>
      </div>
    );
  }
  const exclusoes = detalhe.exclusoes.filter((e) => e.quantidade > 0);

  return (
    <article className="rounded-lg border border-amber-300 bg-white p-5 shadow-sm" aria-label={`Detalhe da onda ${detalhe.onda}`}>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">
          Onda {detalhe.onda}
          <span className="ml-2 text-sm font-normal text-stone-500">
            {detalhe.data ? `${detalhe.data} às ${detalhe.hora}` : "sem data (a onda só existe no picking)"}
          </span>
        </h2>
        <Link href={`/ondas${semOnda}`} className="text-sm underline underline-offset-2">
          ← Ver todas as ondas
        </Link>
      </header>

      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <Facto rotulo="Pedidos" valor={formatarNumero(detalhe.pedidos.length)} />
        <Facto
          rotulo="Unidades recolhidas"
          valor={detalhe.unidadesRecolhidas === null ? "sem picking" : formatarNumero(detalhe.unidadesRecolhidas)}
        />
        <Facto rotulo="Ocupação" valor={formatarPercentagemOuNulo(detalhe.ocupacao) ?? "sem picking"} />
        <Facto rotulo="Localizações" valor={formatarNumero(detalhe.localizacoes.length)} />
      </dl>
      {detalhe.unidadesRecolhidas !== null && (
        <div className="mt-3 text-sm">
          <Onda24 unidades={detalhe.unidadesRecolhidas} grande />
          <span className="ml-2 text-stone-500">unidades recolhidas nesta onda, para um alvo de 24</span>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h3 className="text-sm font-medium text-stone-500">Pedidos ({formatarNumero(detalhe.pedidos.length)})</h3>
          {detalhe.pedidos.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">sem dados</p>
          ) : (
            <TabelaRecolhida
              classeTabela="mt-2 w-full text-sm"
              classeCabecalho="text-left text-stone-500"
              cabecalho={
                <tr>
                  <th className="py-1 font-normal">Pedido</th>
                  <th className="py-1 text-right font-normal">Nesta onda</th>
                  <th className="py-1 text-right font-normal">Total</th>
                  <th className="py-1 pl-3 font-normal">Estado</th>
                </tr>
              }
              linhas={detalhe.pedidos.map((p) => (
                <tr key={p.pedido} className="border-t border-stone-100">
                  <td className="py-1 font-medium">{p.pedido}</td>
                  <td className="py-1 text-right">{formatarNumero(p.unidades)} un.</td>
                  <td className="py-1 text-right">{formatarNumero(p.unidadesDoPedido)} un.</td>
                  <td className="py-1 pl-3">
                    {p.dividido ? (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900">
                        dividido (também na onda {p.outrasOndas.join(", ")})
                      </span>
                    ) : (
                      <span className="text-stone-500">inteiro</span>
                    )}
                  </td>
                </tr>
              ))}
            />
          )}
        </section>

        <section>
          <h3 className="text-sm font-medium text-stone-500">Localizações e zonas ({formatarNumero(detalhe.localizacoes.length)})</h3>
          {detalhe.localizacoes.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">sem picking: a onda não tem localizações.</p>
          ) : (
            <TabelaRecolhida
              classeTabela="mt-2 w-full text-sm"
              classeCabecalho="text-left text-stone-500"
              cabecalho={
                <tr>
                  <th className="py-1 font-normal">Localização</th>
                  <th className="py-1 font-normal">Zona</th>
                  <th className="py-1 text-right font-normal">Unidades</th>
                </tr>
              }
              linhas={detalhe.localizacoes.map((l) => (
                <tr key={l.localizacao} className="border-t border-stone-100">
                  <td className="py-0.5">{l.localizacao}</td>
                  <td className="py-0.5 text-stone-500">{l.zona === null ? "não mapeada" : `zona ${l.zona}`}</td>
                  <td className="py-0.5 text-right font-medium">{formatarNumero(l.unidades)} un.</td>
                </tr>
              ))}
            />
          )}
          {detalhe.zonas.length > 0 && (
            <p className="mt-2 text-sm text-stone-600">
              Zonas: {detalhe.zonas.map((z) => `${z.zona} ${formatarNumero(z.unidades)}`).join(" · ")}
              {detalhe.naoMapeadas > 0 && ` · não mapeada ${formatarNumero(detalhe.naoMapeadas)}`}
            </p>
          )}
          <h3 className="mt-4 text-sm font-medium text-stone-500">Operadores</h3>
          <p className="mt-1 text-sm">
            Atribuído (Customer_Order): {detalhe.operadores.customerOrder.join(", ") || "—"}
            <br />
            Recolhedor (Picking_Wave): {detalhe.operadores.pickingWave.join(", ") || "—"}
          </p>
        </section>
      </div>

      <details className="mt-5">
        <summary className="cursor-pointer text-sm font-medium text-stone-500">
          Linhas da onda ({formatarNumero(detalhe.linhas.length)})
        </summary>
        <table className="mt-2 w-full text-sm">
          <thead className="text-left text-stone-500">
            <tr>
              <th className="py-1 font-normal">Pedido</th>
              <th className="py-1 font-normal">Referência</th>
              <th className="py-1 text-right font-normal">Tamanho</th>
              <th className="py-1 text-right font-normal">Unidades</th>
            </tr>
          </thead>
          <tbody>
            {detalhe.linhas.map((l, i) => (
              <tr key={i} className="border-t border-stone-100">
                <td className="py-1">{l.pedido}</td>
                <td className="py-1">{l.referencia}</td>
                <td className="py-1 text-right">{l.tamanho === null ? "—" : formatarNumero(l.tamanho)}</td>
                <td className="py-1 text-right">
                  {formatarNumero(l.unidades)}
                  {l.duplicada && <span title="Linha idêntica a uma anterior; conta na mesma"> (duplicada)</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <p className="mt-3 text-xs text-stone-500">
        Fonte: Customer_Order + Picking_Wave + Storage_Location.
        {exclusoes.length > 0 && ` Excluídos: ${exclusoes.map((e) => `${formatarNumero(e.quantidade)} ${e.motivo}`).join("; ")}.`}
      </p>
    </article>
  );
}

function Facto({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex gap-1">
      <dt className="text-stone-500">{rotulo}</dt>
      <dd className="font-medium">{valor}</dd>
    </div>
  );
}
