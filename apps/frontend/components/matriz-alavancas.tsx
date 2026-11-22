import type { CriterioMedido, EsforcoMatriz, MatrizAlavancas, NotaMatriz } from "@/lib/api";
import { formatarNumero, formatarPercentagemOuNulo } from "@/lib/formatar";

/**
 * Matriz impacto × robustez × esforço das duas alavancas (ticket 12).
 * Só apresenta: impacto e robustez vêm medidos pela API; o esforço vem do ficheiro de configuração (juízo da equipa).
 */
export function MatrizAlavancasView({ matriz }: { matriz: MatrizAlavancas }) {
  const { a, b } = matriz;
  const linhas = [
    { id: "a", nome: "(a) Reorganizar localizações", alavanca: a },
    { id: "b", nome: "(b) Constituição das ondas", alavanca: b },
  ];

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Matriz das duas alavancas</h2>
      <p className="mt-1 text-sm text-stone-600">{matriz.nota}</p>
      {matriz.filtrosNaoAplicaveis.length > 0 && (
        <p className="mt-2 rounded border border-stone-300 bg-stone-100 px-2 py-1 text-xs text-stone-700">
          Filtro não aplicável à matriz: {matriz.filtrosNaoAplicaveis.join(", ")}. A matriz usa sempre o dataset completo.
        </p>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="text-left text-stone-500">
              <th className="pb-2 font-normal">Alavanca</th>
              <th className="pb-2 font-normal">Impacto (espaço de melhoria)</th>
              <th className="pb-2 font-normal">Robustez da evidência</th>
              <th className="pb-2 font-normal">Esforço (juízo da equipa)</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(({ id, nome, alavanca }) => (
              <tr key={id} className="border-t border-stone-200 align-top">
                <th scope="row" className="py-3 pr-4 text-left font-medium">
                  {nome}
                </th>
                <td className="py-3 pr-4">
                  <CelulaMedida criterio={alavanca.impacto} />
                </td>
                <td className="py-3 pr-4">
                  <CelulaMedida criterio={alavanca.robustez} />
                </td>
                <td className="py-3">
                  <CelulaEsforco esforco={alavanca.esforco} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-5 text-sm font-semibold">Justificações</h3>
      <dl className="mt-2 space-y-3 text-sm">
        <Justificacao titulo="Impacto (a)" criterio={a.impacto}>
          {percentagem(a.impacto.valor)} das paragens de artigos A ({formatarNumero(a.impacto.numerador)} de{" "}
          {formatarNumero(a.impacto.denominador)}; {formatarNumero(a.impacto.artigosA)} artigos A com picking) são feitas
          fora das 3 localizações mais usadas do artigo. Sensibilidade:{" "}
          {a.impacto.sensibilidade
            .map((s) => `fora ${s.localizacoes === 1 ? "da mais usada" : `das ${s.localizacoes} mais usadas`} = ${percentagem(s.valor)}`)
            .join("; ")}
          . O RC-01 está entre as 3 mais usadas de {formatarNumero(a.impacto.artigosComRc01NasMaisUsadas)} dos{" "}
          {formatarNumero(a.impacto.artigosA)} artigos A.
        </Justificacao>
        <Justificacao titulo="Robustez (a)" criterio={a.robustez}>
          {percentagem(a.robustez.valor)} das unidades recolhidas ({formatarNumero(a.robustez.numerador)} de{" "}
          {formatarNumero(a.robustez.denominador)}) estão em localizações mapeadas; as outras{" "}
          {formatarNumero(a.robustez.denominador - a.robustez.numerador)} un. saem de localizações não mapeadas (RC-01 e
          outras), onde a dispersão real não é visível.
        </Justificacao>
        <JustificacaoEsforco titulo="Esforço (a)" esforco={a.esforco} />
        <Justificacao titulo="Impacto (b)" criterio={b.impacto}>
          {percentagem(b.impacto.valor)} dos pedidos válidos ({formatarNumero(b.impacto.numerador)} de{" "}
          {formatarNumero(b.impacto.denominador)}) estão divididos em mais de uma onda com 24 un. ou menos (divisões
          evitáveis). Em unidades: {percentagem(b.impacto.percentagemUnidades)} ({formatarNumero(b.impacto.unidades)} de{" "}
          {formatarNumero(b.impacto.unidadesTotais)} un.), que daria nota {b.impacto.notaUnidades ?? "—"}.
        </Justificacao>
        <Justificacao titulo="Robustez (b)" criterio={b.robustez}>
          {percentagem(b.robustez.valor)} das linhas do CO ({formatarNumero(b.robustez.numerador)} de{" "}
          {formatarNumero(b.robustez.denominador)}) têm correspondência no PW (onda + referência + tamanho);{" "}
          {formatarNumero(b.robustez.denominador - b.robustez.numerador)} linhas ficam sem correspondência.
        </Justificacao>
        <JustificacaoEsforco titulo="Esforço (b)" esforco={b.esforco} />
      </dl>
    </article>
  );
}

function percentagem(valor: number | null): string {
  return formatarPercentagemOuNulo(valor) ?? "sem dados";
}

function Nota({ nota }: { nota: NotaMatriz | null }) {
  return <span className="text-2xl font-semibold">{nota ?? "—"}</span>;
}

function CelulaMedida({ criterio }: { criterio: CriterioMedido }) {
  return (
    <div>
      <Nota nota={criterio.nota} />
      <span className="ml-2 text-stone-600">{percentagem(criterio.valor)}</span>
      {criterio.avisoLimiar && (
        <p className="mt-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-900">
          ⚠ {criterio.avisoLimiar}
        </p>
      )}
    </div>
  );
}

function CelulaEsforco({ esforco }: { esforco: EsforcoMatriz }) {
  return (
    <div>
      <Nota nota={esforco.nota} />
      <span className="ml-2 text-stone-600">{esforco.rotulo}</span>
      <p className="mt-1 text-xs text-stone-500">{esforco.origem}, não é medido</p>
    </div>
  );
}

function Justificacao({
  titulo,
  criterio,
  children,
}: {
  titulo: string;
  criterio: CriterioMedido;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="font-medium">
        {titulo}: nota {criterio.nota ?? "—"}
      </dt>
      <dd className="text-stone-700">
        {children}
        <span className="block text-xs text-stone-500">
          Medida: {criterio.medida} Limiares: {criterio.regra}.
        </span>
      </dd>
    </div>
  );
}

function JustificacaoEsforco({ titulo, esforco }: { titulo: string; esforco: EsforcoMatriz }) {
  return (
    <div>
      <dt className="font-medium">
        {titulo}: nota {esforco.nota} ({esforco.rotulo})
      </dt>
      <dd className="text-stone-700">
        {esforco.justificacao}
        <span className="block text-xs text-stone-500">Juízo qualitativo da equipa, não é uma medição (1 = alto, 3 = baixo).</span>
      </dd>
    </div>
  );
}
