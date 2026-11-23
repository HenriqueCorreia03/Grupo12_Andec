import Link from "next/link";
import type { CriterioMedido, MatrizAlavancas } from "@/lib/api";
import { COR_DO_ESTADO, type Criterio, type Estado, estadoDaNota, LEGENDA_DAS_CORES, palavraDaNota } from "@/lib/estado";
import { consulta, type FiltrosUrl } from "@/lib/filtros";
import { formatarNumero, formatarPercentagemOuNulo } from "@/lib/formatar";
import { BarraParteTodo } from "./mini-graficos";


/** O que fazer em cada estado: texto fixo por nível, registado na spec (ticket 20), não uma conclusão escrita à mão. */
type Acoes = Record<Estado, string>;

interface Pergunta {
  id: string;
  pergunta: string;
  criterio: Criterio;
  medido: CriterioMedido;
  unidadeDoValor: string;
  /** A barra parte/todo do cartão: o todo, a parte pintada e o resto, com os números reais. */
  barra: { titulo: string; rotuloParte: string; rotuloResto: string };
  leitura: string;
  acoes: Acoes;
  ligacao: { texto: string; pagina: string; ancora?: string };
}

/**
 * Diagnóstico da Visão geral (ticket 20): as quatro medidas da matriz com limiares na spec, em linguagem direta, com
 * o estado (cor + palavra) e o que se pode fazer. A nota vem da API; aqui só se traduz.
 */
export function Diagnostico({ matriz, filtros }: { matriz: MatrizAlavancas; filtros: FiltrosUrl }) {
  const { a, b } = matriz;
  const perguntas: Pergunta[] = [
    {
      id: "dispersao-a",
      barra: {
        titulo: `${formatarNumero(a.impacto.denominador)} idas às prateleiras dos ${formatarNumero(a.impacto.artigosA)} artigos A`,
        rotuloParte: "fora das 3 prateleiras habituais",
        rotuloResto: "nas 3 prateleiras habituais",
      },
      pergunta: "Os artigos A estão espalhados por muitas localizações?",
      criterio: "impacto",
      medido: a.impacto,
      unidadeDoValor: "das idas a artigos A são fora das 3 prateleiras de onde cada um mais sai",
      leitura: `${formatarNumero(a.impacto.numerador)} de ${formatarNumero(a.impacto.denominador)} idas às prateleiras, nos ${formatarNumero(a.impacto.artigosA)} artigos A com recolhas.`,
      acoes: {
        mal: "Arrumar os artigos A em menos sítios, a começar pelos primeiros da lista de prioridade.",
        atencao: "Arrumar os artigos A em menos sítios, a começar pelos primeiros da lista de prioridade.",
        bem: "Os artigos A já estão concentrados: reorganizar tem pouco a ganhar.",
      },
      ligacao: { texto: "Ver a lista de prioridade", pagina: "/artigos", ancora: "prioridade" },
    },
    {
      id: "divididos-b",
      barra: {
        titulo: `${formatarNumero(b.impacto.denominador)} pedidos`,
        rotuloParte: "partidos quando cabiam numa onda",
        rotuloResto: "os restantes",
      },
      pergunta: "Há pedidos divididos entre ondas que se podiam evitar?",
      criterio: "impacto",
      medido: b.impacto,
      unidadeDoValor: "dos pedidos foram partidos em várias ondas quando cabiam numa só (até 24 un.)",
      leitura: `${formatarNumero(b.impacto.numerador)} de ${formatarNumero(b.impacto.denominador)} pedidos.`,
      acoes: {
        mal: "Rever a regra de constituição das ondas, a começar pelos períodos com mais pedidos divididos.",
        atencao: "Rever a regra de constituição das ondas, a começar pelos períodos com mais pedidos divididos.",
        bem: "Mudar a regra das ondas ganha pouco: poucos pedidos se podiam ter evitado partir.",
      },
      ligacao: { texto: "Ver os pedidos divididos por período", pagina: "/ondas", ancora: "titulo-divididos" },
    },
    {
      id: "robustez-a",
      barra: {
        titulo: `${formatarNumero(a.robustez.denominador)} unidades recolhidas`,
        rotuloParte: "em sítios que estão no mapa",
        rotuloResto: "fora do mapa (sobretudo RC-01)",
      },
      pergunta: "Os dados das localizações são fiáveis?",
      criterio: "robustez",
      medido: a.robustez,
      unidadeDoValor: "do que se recolhe sai de sítios que estão no mapa do armazém",
      leitura: `${formatarNumero(a.robustez.denominador - a.robustez.numerador)} unidades saem de sítios fora do mapa, sobretudo a área RC-01.`,
      acoes: {
        mal: "Mapear o RC-01 e as outras localizações em falta antes de reorganizar: a dispersão real não é visível.",
        atencao: "Mapear o RC-01 e as outras localizações em falta, para confirmar a dispersão real.",
        bem: "Nada urgente: quase tudo é recolhido em localizações mapeadas.",
      },
      ligacao: { texto: "Ver as localizações não mapeadas", pagina: "/qualidade" },
    },
    {
      id: "robustez-b",
      barra: {
        titulo: `${formatarNumero(b.robustez.denominador)} linhas de encomenda`,
        rotuloParte: "encontram a sua recolha",
        rotuloResto: "sem recolha correspondente",
      },
      pergunta: "A ligação entre encomendas e picking é fiável?",
      criterio: "robustez",
      medido: b.robustez,
      unidadeDoValor: "das linhas de encomenda encontram a sua recolha no picking",
      leitura: `${formatarNumero(b.robustez.denominador - b.robustez.numerador)} de ${formatarNumero(b.robustez.denominador)} linhas ficam sem recolha correspondente.`,
      acoes: {
        mal: "Rever as linhas de encomenda sem correspondência no picking antes de mudar as ondas.",
        atencao: "Rever as linhas de encomenda sem correspondência no picking antes de mudar as ondas.",
        bem: "Nada urgente: quase todas as linhas de encomenda têm correspondência no picking.",
      },
      ligacao: { texto: "Ver a qualidade dos dados", pagina: "/qualidade" },
    },
  ];

  return (
    <section aria-labelledby="titulo-diagnostico">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="titulo-diagnostico" className="text-lg font-semibold">
          Diagnóstico: o que está bem, o que está mal e o que fazer
        </h2>
        <LegendaDasCores />
      </div>
      {matriz.filtrosNaoAplicaveis.length > 0 && (
        <p className="mt-2 rounded border border-stone-300 bg-stone-100 px-2 py-1 text-xs text-stone-700">
          Filtro não aplicável ao diagnóstico: {matriz.filtrosNaoAplicaveis.join(", ")}. Usa sempre o dataset completo.
        </p>
      )}
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {perguntas.map((p) => (
          <CartaoDiagnostico key={p.id} pergunta={p} filtros={filtros} />
        ))}
      </div>
      <p className="mt-2 text-xs text-stone-500">
        As cores seguem limites fixos, os mesmos da matriz das duas ideias, sobre todo o histórico. Mostram quanto há
        para melhorar, nunca um ganho garantido.
      </p>
    </section>
  );
}

function CartaoDiagnostico({ pergunta: p, filtros }: { pergunta: Pergunta; filtros: FiltrosUrl }) {
  const { nota, valor, avisoLimiar } = p.medido;
  const estado = nota === null ? null : estadoDaNota(p.criterio, nota);
  const cor = COR_DO_ESTADO[estado ?? "semDados"];
  const href = `${p.ligacao.pagina}${consulta(filtros)}${p.ligacao.ancora ? `#${p.ligacao.ancora}` : ""}`;
  return (
    <article className={`flex flex-col rounded-lg border p-4 shadow-sm ${cor.fundo}`}>
      <h3 className="text-sm font-medium text-stone-700">{p.pergunta}</h3>
      <p className={`mt-2 text-sm font-semibold uppercase tracking-wide ${cor.texto}`}>
        {nota === null ? "sem dados" : palavraDaNota(p.criterio, nota)}
      </p>
      <p className="mt-1 text-2xl font-semibold">
        {formatarPercentagemOuNulo(valor) ?? "sem dados"}
        <span className="ml-1 text-sm font-normal text-stone-600">{p.unidadeDoValor}</span>
      </p>
      <BarraParteTodo parte={p.medido.numerador} todo={p.medido.denominador} classe={cor.marca} {...p.barra} />
      {avisoLimiar && (
        <p className="mt-2 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-900">⚠ {avisoLimiar}</p>
      )}
      <p className="mt-3 text-sm text-stone-800">
        <span className="font-medium">O que fazer: </span>
        {estado === null ? "sem dados para decidir." : p.acoes[estado]}
      </p>
      <Link href={href} className="mt-auto pt-2 text-sm font-medium underline underline-offset-2">
        {p.ligacao.texto} →
      </Link>
    </article>
  );
}

/** Legenda das cores, comum ao diagnóstico e à matriz. */
export function LegendaDasCores() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
      {LEGENDA_DAS_CORES.map(({ estado, texto }) => (
        <span key={estado} className="flex items-center gap-1">
          <span className={`inline-block h-3 w-3 rounded-sm ${COR_DO_ESTADO[estado].marca}`} />
          {texto}
        </span>
      ))}
    </p>
  );
}
