import { obterDadosHistoria } from "@/lib/dados";

/** Os números do site "Evidência." (public/evidencia.html), lidos do backend no momento do pedido. */
export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Pedidos extra ao backend, só para este site (tipos mínimos, sem tocar em lib/dados.ts). */
async function obterExtra<T>(caminho: string, tentativa = 0): Promise<T> {
  const r = await fetch(new URL(caminho, BASE), { cache: "no-store" }).catch(async (e) => {
    if (tentativa >= 1) throw e;
    await new Promise((ok) => setTimeout(ok, 400));
    return null;
  });
  if (r === null) return obterExtra<T>(caminho, tentativa + 1);
  if (!r.ok) throw new Error(`A API respondeu ${r.status} em ${caminho}.`);
  return (await r.json()) as T;
}

type Periodo = { pedidosDivididos: number; percentagem: number };
interface Extra {
  estabilidade: { transicoes: { percentagem: number | null }[] };
  prioridade: { artigos: { referencia: string; paragens: number; localizacoesDistintas: number }[] };
  periodos: { meses: (Periodo & { mes: string })[]; diasDaSemana: (Periodo & { nome: string })[]; horas: (Periodo & { hora: number })[] };
  visao: {
    tamanhoMedioEncomenda: { valor: number | null; mediana: number | null };
    pedidosPorOnda: { valor: number | null; ondas: number; ondasComUmPedido: number };
    participacaoPorSetor: { setores: { setor: string; percentagem: number }[] };
    pedidosMultissetor: { valor: number | null };
    matriz: { b: { impacto: { percentagemUnidades: number; notaUnidades: number }; robustez: { avisoLimiar: string | null } } };
  };
}

interface Adicionais {
  picking: { paragens: { valor: number }; localizacoesPorOnda: { media: number | null; mediana: number | null; maximo: number | null }; ocupacao: { ondasMaisDe24: number } };
  zonas: { pedidosMultizona: { valor: number | null }; participacaoPorZona: { zonas: { zona: string; percentagem: number }[] } };
  carga: { porHora: { hora: number; pedidos: number }[]; porOperador: { operadores: { operador: string; unidades: number }[] } };
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

async function calcular(): Promise<Response> {
  try {
    // O primeiro pedido ao backend depois de algum tempo parado pode falhar ("fetch failed"): tenta outra vez.
    const dados = await obterDadosHistoria().catch(async () => {
      await new Promise((ok) => setTimeout(ok, 400));
      return obterDadosHistoria();
    });
    const { visao, picking, ondasEPedidos, zonas, incompletas, qualidade } = dados;
    const [pickingExtra, zonasExtra, cargaExtra] = await Promise.all([
      obterExtra<Adicionais["picking"]>("/api/ondas-e-pedidos/picking"),
      obterExtra<Adicionais["zonas"]>("/api/artigos/zonas"),
      obterExtra<Adicionais["carga"]>("/api/ondas-e-pedidos/carga"),
    ]);
    const zonaTop = [...zonasExtra.participacaoPorZona.zonas].sort((x, y) => y.percentagem - x.percentagem)[0];
    const horaPico = [...cargaExtra.porHora].sort((x, y) => y.pedidos - x.pedidos)[0];
    const operadores = cargaExtra.porOperador.operadores;
    const [estabilidade, prioridade, periodos, visaoExtra] = await Promise.all([
      obterExtra<Extra["estabilidade"]>("/api/artigos/estabilidade"),
      obterExtra<Extra["prioridade"]>("/api/artigos/prioridade"),
      obterExtra<Extra["periodos"]>("/api/ondas-e-pedidos/divididos-por-periodo"),
      obterExtra<Extra["visao"]>("/api/visao-geral"),
    ]);
    // As listas de períodos vêm ordenadas pelo critério de prioridade da alavanca (b): o primeiro é o que atacar primeiro.
    const [mesTop] = periodos.meses, [diaTop] = periodos.diasDaSemana, [horaTop] = periodos.horas;
    const mudancas = estabilidade.transicoes.map((t) => t.percentagem).filter((v): v is number => v !== null);
    const [artigoTop] = prioridade.artigos;
    const pf = visaoExtra.participacaoPorSetor.setores.find((x) => x.setor === "PF");
    const classeA = visao.abc.classes.find((c) => c.classe === "A");
    const d = ondasEPedidos.pedidosDivididos;
    const semLigacao = qualidade.contagens.percentagemSemCorrespondencia;
    const r = qualidade.recolhidoVsEncomendado;
    return Response.json({
      pedidos: visao.volume.pedidos.valor,
      unidades: visao.volume.unidades.valor,
      dias: visao.volume.pedidos.diasComAtividade,
      ondas: picking.ocupacao.ondas,
      ondasCO: visaoExtra.pedidosPorOnda.ondas,
      // Os 12 indicadores adicionais da spec (secção "Porque medimos isto").
      robustezA: visao.matriz.a.robustez.valor,
      paragens: pickingExtra.paragens.valor,
      locPorOnda: pickingExtra.localizacoesPorOnda.media,
      locPorOndaMediana: pickingExtra.localizacoesPorOnda.mediana,
      locPorOndaMax: pickingExtra.localizacoesPorOnda.maximo,
      ondasMaisDe24: pickingExtra.ocupacao.ondasMaisDe24,
      zonaTop: zonaTop?.zona ?? null,
      zonaTopPct: zonaTop?.percentagem ?? null,
      multizona: zonasExtra.pedidosMultizona.valor,
      horaPicoCarga: horaPico ? `${horaPico.hora}h` : null,
      horaPicoPedidos: horaPico?.pedidos ?? null,
      operadores: operadores.length,
      operadorMaxUn: operadores.length ? Math.max(...operadores.map((o) => o.unidades)) : null,
      operadorMinUn: operadores.length ? Math.min(...operadores.map((o) => o.unidades)) : null,
      // Tratamento dos dados (página de qualidade): campos que lib/dados.ts não tipa.
      linhasDuplicadas: (qualidade.contagens as unknown as Record<string, number>).linhasDuplicadas ?? null,
      linhasZero: (qualidade.contagens as unknown as Record<string, number>).linhasZero ?? null,
      pedidosZero: (qualidade.contagens as unknown as Record<string, number>).pedidosZero ?? null,
      tamanhoMedio: visaoExtra.tamanhoMedioEncomenda.valor,
      tamanhoMediana: visaoExtra.tamanhoMedioEncomenda.mediana,
      pedidosPorOnda: visaoExtra.pedidosPorOnda.valor,
      ondasUmPedido: visaoExtra.pedidosPorOnda.ondasComUmPedido,
      setorPF: pf?.percentagem ?? null,
      multissetor: visaoExtra.pedidosMultissetor.valor,
      abcMudaMedia: mudancas.length ? mudancas.reduce((a, b) => a + b, 0) / mudancas.length : null,
      abcMudaMin: mudancas.length ? Math.min(...mudancas) : null,
      abcMudaMax: mudancas.length ? Math.max(...mudancas) : null,
      artigoTop: artigoTop?.referencia ?? null,
      artigoTopLocalizacoes: artigoTop?.localizacoesDistintas ?? null,
      artigoTopParagens: artigoTop?.paragens ?? null,
      mesTop: mesTop ? MESES[Number(mesTop.mes.slice(5)) - 1] : null,
      mesTopPct: mesTop?.percentagem ?? null,
      diaTop: diaTop?.nome ?? null,
      horaTop: horaTop ? `${horaTop.hora}h` : null,
      impactoBUnidades: visaoExtra.matriz.b.impacto.percentagemUnidades,
      impactoBNotaUnidades: visaoExtra.matriz.b.impacto.notaUnidades,
      robustezBAviso: visaoExtra.matriz.b.robustez.avisoLimiar,
      linhasCO: qualidade.contagens.linhasCO,
      ligadas: semLigacao === null ? null : 100 - semLigacao,
      referenciasA: classeA?.referencias ?? null,
      unidadesA: classeA?.percentagemUnidades ?? null,
      paragensForaTop3: visao.matriz.a.impacto.valor,
      naoMapeadas: zonas.participacaoPorZona.naoMapeadas.percentagem,
      rc01: zonas.participacaoPorZona.naoMapeadas.rc01Unidades,
      ocupacao: picking.ocupacao.valor,
      com24: picking.ocupacao.percentagemCom24,
      divididos: d.valor,
      divididosN: d.pedidosDivididos,
      pedidosValidos: d.pedidosValidos,
      evitaveis: d.pedidosValidos === 0 ? null : (d.divididosAte24 * 100) / d.pedidosValidos,
      evitaveisN: d.divididosAte24,
      inevitaveisN: d.divididosMaisDe24,
      incompletas: incompletas.ondasIncompletas,
      simultaneas: incompletas.ondasSimultaneas,
      envolvidos: incompletas.pedidosDivididosEnvolvidos,
      matriz: Object.fromEntries(
        (["a", "b"] as const).map((k) => {
          const m = visao.matriz[k];
          return [k, {
            impacto: m.impacto.nota, impactoValor: m.impacto.valor,
            robustez: m.robustez.nota, robustezValor: m.robustez.valor,
            esforco: m.esforco.nota, esforcoRotulo: m.esforco.rotulo,
          }];
        }),
      ),
      encomendado: r.encomendado,
      recolhido: r.recolhido,
      diferenca: r.diferenca,
      semPicking: r.ondasSemPicking,
      nuncaRecolhidas: r.referenciasNuncaRecolhidas,
      semCausa: r.semCausaConhecida,
    });
  } catch (erro) {
    return Response.json({ erro: (erro as Error).message }, { status: 503 });
  }
}

/**
 * Guarda a última resposta boa e devolve-a logo (os números do histórico não mudam durante a apresentação).
 * Se tiver mais de um minuto, atualiza-a por trás sem fazer esperar a página. Se o backend falhar, mantém a última.
 * Só o primeiro pedido espera pelo backend (cerca de 10 s no dataset completo).
 */
let ultima: { quando: number; corpo: string } | null = null;
let aAtualizar: Promise<void> | null = null;
const VALIDADE_MS = 60_000;
const json = (corpo: string) => new Response(corpo, { headers: { "content-type": "application/json" } });

function atualizar(): Promise<Response> {
  return calcular().then(async (resposta) => {
    if (resposta.ok) ultima = { quando: Date.now(), corpo: await resposta.clone().text() };
    return resposta;
  });
}

export async function GET() {
  if (ultima) {
    if (Date.now() - ultima.quando > VALIDADE_MS && !aAtualizar) {
      aAtualizar = atualizar().then(() => undefined, () => undefined).finally(() => { aAtualizar = null; });
    }
    return json(ultima.corpo);
  }
  return atualizar();
}
