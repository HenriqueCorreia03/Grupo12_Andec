import type { CriterioMedido, EsforcoMatriz, MatrizAlavancas, NotaMatriz } from "@/lib/api";

/** O que a leitura precisa de cada alavanca: só as notas dos três critérios. */
interface NotasDaAlavanca {
  impacto: { nota: NotaMatriz | null };
  robustez: { nota: NotaMatriz | null };
  esforco: { nota: NotaMatriz | null };
}
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

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {linhas.map(({ id, nome, alavanca }) => (
          <section key={id} aria-label={nome} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <h3 className="font-semibold">{nome}</h3>
            <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <NotaGrande rotulo="Impacto" nota={alavanca.impacto.nota} detalhe={percentagem(alavanca.impacto.valor)} />
              <NotaGrande rotulo="Robustez" nota={alavanca.robustez.nota} detalhe={percentagem(alavanca.robustez.valor)} />
              <NotaGrande rotulo="Esforço" nota={alavanca.esforco.nota} detalhe={alavanca.esforco.rotulo} />
            </dl>
            {alavanca.robustez.avisoLimiar && (
              <p className="mt-3 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-900">⚠ {alavanca.robustez.avisoLimiar}</p>
            )}
            {alavanca.impacto.avisoLimiar && (
              <p className="mt-3 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-900">⚠ {alavanca.impacto.avisoLimiar}</p>
            )}
            <p className="mt-3 text-xs text-stone-600">Esforço: {alavanca.esforco.origem}, não é medido.</p>
          </section>
        ))}
      </div>
      <p className="mt-3 text-sm text-stone-700">
        <span className="font-medium">Leitura das notas</span> (3 = melhor em cada critério): {leitura(a, b)}
      </p>

      <details className="mt-4 rounded border border-stone-200 p-3">
        <summary className="cursor-pointer text-sm font-semibold">Justificações de cada nota</summary>
      <dl className="mt-3 space-y-3 text-sm">
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
      </details>
    </article>
  );
}

/** Nota 1–3 em destaque, com o valor que a justifica por baixo. */
function NotaGrande({ rotulo, nota, detalhe }: { rotulo: string; nota: NotaMatriz | null; detalhe: string }) {
  return (
    <div>
      <dt className="text-xs text-stone-600">{rotulo}</dt>
      <dd>
        <span className="block text-4xl font-semibold leading-none">{nota ?? "—"}</span>
        <span className="mt-1 block text-xs text-stone-600">{detalhe}</span>
      </dd>
    </div>
  );
}

/** Compara só as notas (3 = melhor): quem lidera em cada critério, ou "empate". Não inventa nenhuma recomendação. */
function leitura(a: NotasDaAlavanca, b: NotasDaAlavanca): string {
  const comparar = (criterio: string, na: NotaMatriz | null, nb: NotaMatriz | null) => {
    if (na === null || nb === null) return `${criterio}: sem nota`;
    if (na === nb) return `${criterio}: empate (${na})`;
    return `${criterio}: ${na > nb ? "(a)" : "(b)"} ${na > nb ? na : nb} contra ${na > nb ? nb : na}`;
  };
  return [
    comparar("maior impacto", a.impacto.nota, b.impacto.nota),
    comparar("evidência mais robusta", a.robustez.nota, b.robustez.nota),
    comparar("menor esforço", a.esforco.nota, b.esforco.nota),
  ].join("; ") + ".";
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
