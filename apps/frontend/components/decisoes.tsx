import Link from "next/link";
import type {
  DividosPorPeriodo,
  EstabilidadeAbc,
  OndasIncompletas,
} from "@/lib/api";
import { consulta, type FiltrosUrl } from "@/lib/filtros";
import { formatarNumero, formatarPercentagemOuNulo } from "@/lib/formatar";

const MES_LONGO = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

interface Decisao {
  id: string;
  pergunta: string;
  destaque: string;
  unidadeDoDestaque: string;
  leitura: string;
  decisao: string;
  ligacao: { texto: string; pagina: string; ancora?: string };
}

/**
 * Outras decisões que os dados apoiam, além das duas alavancas (perguntas P2, P3 e P6 da spec). Ao contrário do
 * diagnóstico, não têm cor de estado: a spec não define limiares para estas medidas, por isso mostram o padrão
 * observado e a decisão que apoiam, sem dizer se está bem ou mal. Os valores e as ordens vêm da API.
 */
export function OutrasDecisoes({
  estabilidade,
  divididos,
  incompletas,
  filtros,
}: {
  estabilidade: EstabilidadeAbc;
  divididos: DividosPorPeriodo;
  incompletas: OndasIncompletas;
  filtros: FiltrosUrl;
}) {
  const [mes] = divididos.meses;
  const [dia] = divididos.diasDaSemana;
  const [hora] = divididos.horas;
  const decisoes: Decisao[] = [
    {
      id: "estabilidade",
      pergunta: "Reorganizar uma vez, ou rever as localizações periodicamente?",
      destaque: formatarPercentagemOuNulo(estabilidade.valor) ?? "sem dados",
      unidadeDoDestaque:
        "das referências mudam de classe ABC de um mês para o seguinte",
      leitura: `${formatarNumero(estabilidade.mudaram)} mudanças em ${formatarNumero(estabilidade.comparadas)} comparações (referências com ≥ ${formatarNumero(estabilidade.limiarUnidades)} un. nos dois meses).`,
      decisao:
        "Se a classe muda muito de mês para mês, uma reorganização única desatualiza-se: a revisão tem de ser periódica.",
      ligacao: {
        texto: "Ver a estabilidade do ABC",
        pagina: "/artigos",
        ancora: "estabilidade",
      },
    },
    {
      id: "onde-testar",
      pergunta: "Onde testar primeiro uma regra nova para as ondas?",
      destaque:
        mes && dia && hora
          ? `${MES_LONGO[Number(mes.mes.slice(5)) - 1]} · ${dia.nome.replace("-feira", "")} · ${hora.hora}h`
          : "sem dados",
      unidadeDoDestaque: "",
      leitura:
        mes && dia && hora
          ? `Os períodos com mais pedidos divididos: ${formatarNumero(mes.pedidosDivididos)} no mês (${formatarPercentagemOuNulo(mes.percentagem) ?? "sem dados"} dos pedidos), ${formatarNumero(dia.pedidosDivididos)} à ${dia.nome} e ${formatarNumero(hora.pedidosDivididos)} às ${hora.hora}h.`
          : "Sem pedidos divididos no período.",
      decisao:
        "Um teste operacional começa onde o problema é maior: o mês, o dia e a hora com mais pedidos divididos.",
      ligacao: {
        texto: "Ver os divididos por período",
        pagina: "/ondas",
        ancora: "titulo-divididos",
      },
    },
    {
      id: "agrupar",
      pergunta: "Há ondas incompletas que podiam ter saído juntas?",
      destaque: formatarNumero(incompletas.ondasSimultaneas),
      unidadeDoDestaque: `de ${formatarNumero(incompletas.ondasIncompletas)} ondas incompletas criadas à mesma hora que outra incompleta`,
      leitura: `Em ${formatarNumero(incompletas.gruposDiaHora)} grupos de dia e hora, com ${formatarNumero(incompletas.pedidosDivididosEnvolvidos)} pedidos divididos envolvidos. É uma observação, não uma simulação.`,
      decisao:
        "Diz que regra de agrupamento testar: juntar ondas incompletas criadas à mesma hora.",
      ligacao: {
        texto: "Ver as ondas incompletas",
        pagina: "/ondas",
        ancora: "lista-ondas",
      },
    },
  ];

  return (
    <section aria-labelledby="titulo-outras-decisoes" className="mt-8">
      <h2 id="titulo-outras-decisoes" className="text-lg font-semibold">
        Outras decisões que os dados apoiam
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        Além de escolher entre as duas alavancas: quando rever, onde testar e o
        que agrupar. Sem cor de estado, porque não há meta definida para estas
        medidas.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
        {decisoes.map((d) => (
          <article
            key={d.id}
            className="flex flex-col rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
          >
            <h3 className="text-sm font-medium text-stone-700">{d.pergunta}</h3>
            <p className="mt-2 text-2xl font-semibold first-letter:uppercase">
              {d.destaque}
              {d.unidadeDoDestaque && (
                <span className="ml-1 text-sm font-normal text-stone-600">
                  {d.unidadeDoDestaque}
                </span>
              )}
            </p>
            <p className="mt-1 text-sm text-stone-600">{d.leitura}</p>
            <p className="mt-3 text-sm text-stone-800">
              <span className="font-medium">Decisão que apoia: </span>
              {d.decisao}
            </p>
            <Link
              href={`${d.ligacao.pagina}${consulta(filtros)}${d.ligacao.ancora ? `#${d.ligacao.ancora}` : ""}`}
              className="mt-auto pt-2 text-sm font-medium underline underline-offset-2"
            >
              {d.ligacao.texto} →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
