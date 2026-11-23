import type { ReactNode } from "react";
import { ErroApi } from "@/components/erro-api";
import { BarrasPeriodo, type ItemBarra } from "@/components/graficos";
import { TabelaRecolhida } from "@/components/tabela-recolhida";
import { VerDetalhe } from "@/components/ver-detalhe";
import {
  obterCarga,
  obterDividosPorPeriodo,
  type CargaDoPeriodo,
  type CargaPorPeriodo,
  type DividosPorPeriodo,
  type PeriodoDividido,
} from "@/lib/api";
import type { FiltrosUrl } from "@/lib/filtros";
import { formatarMes, formatarNumero, formatarNumeroOuNulo, formatarPercentagemOuNulo } from "@/lib/formatar";

const CARTAO = "rounded-lg border border-stone-200 bg-white p-4 shadow-sm";

/**
 * Alavanca (b): pedidos divididos e carga por período (ticket 11). Só apresenta: os números, a ordem do ranking
 * e os dias com atividade vêm da API.
 */
export async function PeriodosDaAlavancaB({ filtros }: { filtros: FiltrosUrl }) {
  let divididos: DividosPorPeriodo;
  let carga: CargaPorPeriodo;
  try {
    [divididos, carga] = await Promise.all([obterDividosPorPeriodo(filtros), obterCarga(filtros)]);
  } catch (e) {
    return <ErroApi mensagem={(e as Error).message} />;
  }
  return (
    <div className="space-y-8">
      <DividosPorPeriodoSecao dados={divididos} />
      <CargaSecao dados={carga} />
    </div>
  );
}

function DividosPorPeriodoSecao({ dados }: { dados: DividosPorPeriodo }) {
  return (
    <section aria-labelledby="titulo-divididos">
      <h2 id="titulo-divididos" className="text-lg font-semibold">
        Pedidos divididos por período
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        Onde se concentram os pedidos divididos entre ondas: é aí que faz sentido testar outra regra de constituição das
        ondas. A laranja, o período de topo do ranking (mais divididos; em empate, menor ocupação média).{" "}
        <span title={dados.definicao}>(definição)</span>
      </p>
      <ConclusaoDivididos dados={dados} />
      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GraficoDivididos titulo="Por mês" itens={itensPorMes(dados)} />
        <GraficoDivididos titulo="Por dia da semana" itens={itensPorDia(dados)} />
        <GraficoDivididos titulo="Por hora" itens={itensPorHora(dados)} />
      </div>
      <VerDetalhe titulo="ranking em tabela (mês, dia da semana e hora)" className="mt-3">
        <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-3">
          <TabelaDivididos
            titulo="Por mês (por dia com atividade)"
            linhas={dados.meses.map((m) => ({ chave: m.mes, rotulo: formatarMes(m.mes), ...m }))}
            mostrarPorDia
          />
          <TabelaDivididos
            titulo="Por dia da semana"
            linhas={dados.diasDaSemana.map((d) => ({ chave: String(d.dia), rotulo: d.nome, marca: d.domingo ? "domingo" : undefined, ...d }))}
          />
          <TabelaDivididos titulo="Por hora" linhas={dados.horas.map((h) => ({ chave: String(h.hora), rotulo: `${h.hora}h`, ...h }))} />
        </div>
      </VerDetalhe>
    </section>
  );
}

/** A leitura da secção numa frase: os períodos de topo de cada ranking (vêm em primeiro lugar da API). */
function ConclusaoDivididos({ dados }: { dados: DividosPorPeriodo }) {
  const [mes] = dados.meses;
  const [dia] = dados.diasDaSemana;
  const [hora] = dados.horas;
  if (!mes || !dia || !hora) return null;
  return (
    <p className="mt-3 rounded-lg border-l-4 border-amber-400 bg-white px-4 py-3 text-sm text-stone-800 shadow-sm">
      Os pedidos divididos concentram-se em <strong>{MES_LONGO[Number(mes.mes.slice(5)) - 1]} de {mes.mes.slice(0, 4)}</strong> (
      {formatarPercentagemOuNulo(mes.percentagem) ?? "sem dados"} dos pedidos do mês), à <strong>{dia.nome}</strong> e às{" "}
      <strong>{hora.hora}h</strong>: são os primeiros sítios onde testar uma regra nova.
    </p>
  );
}

const MES_LONGO = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const MES_CURTO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const DIA_CURTO: Record<string, string> = {
  "segunda-feira": "seg",
  "terça-feira": "ter",
  "quarta-feira": "qua",
  "quinta-feira": "qui",
  "sexta-feira": "sex",
  sábado: "sáb",
  domingo: "dom",
};

function dicaPeriodo(p: PeriodoDividido): string[] {
  return [
    `${formatarPercentagemOuNulo(p.percentagem) ?? "sem dados"} dos ${formatarNumero(p.pedidosValidos)} pedidos do período`,
    `Ocupação média das ondas: ${formatarPercentagemOuNulo(p.ocupacaoMedia) ?? "sem dados"}`,
  ];
}

/** Ordem natural (cronológica) para o gráfico; o destaque é o primeiro do ranking da API. */
function itensPorMes(d: DividosPorPeriodo): ItemBarra[] {
  const topo = d.meses[0]?.mes;
  return [...d.meses]
    .sort((x, y) => x.mes.localeCompare(y.mes))
    .map((m) => ({ rotulo: MES_CURTO[Number(m.mes.slice(5)) - 1], valor: m.pedidosDivididos, destaque: m.mes === topo, dica: [formatarMes(m.mes), ...dicaPeriodo(m)] }));
}

function itensPorDia(d: DividosPorPeriodo): ItemBarra[] {
  const topo = d.diasDaSemana[0]?.dia;
  return [...d.diasDaSemana]
    .sort((x, y) => ((x.dia + 6) % 7) - ((y.dia + 6) % 7))
    .map((x) => ({ rotulo: DIA_CURTO[x.nome] ?? x.nome, valor: x.pedidosDivididos, destaque: x.dia === topo, dica: [x.nome, ...dicaPeriodo(x)] }));
}

function itensPorHora(d: DividosPorPeriodo): ItemBarra[] {
  const topo = d.horas[0]?.hora;
  return [...d.horas]
    .sort((x, y) => x.hora - y.hora)
    .map((h) => ({ rotulo: `${h.hora}h`, valor: h.pedidosDivididos, destaque: h.hora === topo, dica: dicaPeriodo(h) }));
}

function GraficoDivididos({ titulo, itens }: { titulo: string; itens: ItemBarra[] }) {
  return (
    <figure className={CARTAO}>
      <figcaption className="text-sm font-medium text-stone-500">{titulo}: pedidos divididos</figcaption>
      <div className="mt-2">
        <BarrasPeriodo itens={itens} unidade="pedidos divididos" />
      </div>
    </figure>
  );
}

interface LinhaDividido extends PeriodoDividido {
  chave: string;
  rotulo: string;
  marca?: string;
}

function TabelaDivididos({ titulo, linhas, mostrarPorDia = false }: { titulo: string; linhas: LinhaDividido[]; mostrarPorDia?: boolean }) {
  if (linhas.length === 0) {
    return (
      <div className={CARTAO}>
        <h3 className="text-sm font-medium text-stone-500">{titulo}</h3>
        <p className="mt-2 text-sm text-stone-500">sem dados</p>
      </div>
    );
  }
  return (
    <div className={CARTAO}>
      <h3 className="text-sm font-medium text-stone-500">{titulo}</h3>
      <TabelaRecolhida
        classeTabela="mt-2 w-full text-sm"
        classeCabecalho="text-left text-stone-500"
        cabecalho={
          <tr>
            <th className="py-1 font-normal">#</th>
            <th className="py-1 font-normal">Período</th>
            <th className="py-1 text-right font-normal">Divididos</th>
            <th className="py-1 text-right font-normal">Ocup. média</th>
            {mostrarPorDia && <th className="py-1 text-right font-normal">Por dia</th>}
          </tr>
        }
        linhas={linhas.map((l, i) => (
            <tr key={l.chave} className={`border-t border-stone-100 ${i === 0 ? "bg-amber-50 font-medium" : ""}`}>
              <td className="py-1 text-stone-500">{i + 1}</td>
              <td className="py-1">
                {l.rotulo}
                {l.marca && <Etiqueta>{l.marca}</Etiqueta>}
              </td>
              <td className="py-1 text-right" title={`${formatarNumero(l.pedidosDivididos)} de ${formatarNumero(l.pedidosValidos)} pedidos`}>
                {formatarNumero(l.pedidosDivididos)}{" "}
                <span className="text-stone-500">({formatarPercentagemOuNulo(l.percentagem) ?? "sem dados"})</span>
              </td>
              <td className="py-1 text-right">{formatarPercentagemOuNulo(l.ocupacaoMedia) ?? "sem dados"}</td>
              {mostrarPorDia && (
                <td className="py-1 text-right" title={`${formatarNumero(l.diasComAtividade)} dias com atividade`}>
                  {formatarNumeroOuNulo(l.divididosPorDia) ?? "sem dados"}
                </td>
              )}
            </tr>
          ))}
      />
    </div>
  );
}

function CargaSecao({ dados }: { dados: CargaPorPeriodo }) {
  return (
    <section aria-labelledby="titulo-carga">
      <h2 id="titulo-carga" className="text-lg font-semibold">
        Carga por período
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        Pedidos, unidades e ondas por dia com atividade (dia com pelo menos 1 pedido criado, domingos incluídos e assinalados).{" "}
        <span title={dados.definicao}>(definição)</span>
      </p>
      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CargaBarras
          titulo="Por mês"
          linhas={dados.porMes.map((m) => ({
            chave: m.mes,
            rotulo: formatarMes(m.mes),
            marca: m.parcial ? "parcial" : undefined,
            carga: m,
          }))}
        />
        <CargaBarras
          titulo="Por dia da semana"
          linhas={dados.porDiaDaSemana.map((d) => ({ chave: String(d.dia), rotulo: d.nome, marca: d.domingo ? "domingo" : undefined, carga: d }))}
        />
        <CargaBarras
          titulo="Por hora"
          linhas={dados.porHora.filter((h) => h.pedidos > 0 || h.ondas > 0).map((h) => ({ chave: String(h.hora), rotulo: `${h.hora}h`, carga: h }))}
        />
      </div>
      <CargaOperador operadores={dados.porOperador.operadores} rotulo={dados.porOperador.rotulo} />
    </section>
  );
}

interface LinhaCarga {
  chave: string;
  rotulo: string;
  marca?: string;
  carga: Pick<CargaDoPeriodo, "diasComAtividade" | "pedidos" | "unidades" | "pedidosPorDia" | "unidadesPorDia"> & { ondas?: number; ondasRecolhidas?: number };
}

function CargaBarras({ titulo, linhas }: { titulo: string; linhas: LinhaCarga[] }) {
  if (linhas.length === 0) {
    return (
      <div className={CARTAO}>
        <h3 className="text-sm font-medium text-stone-500">{titulo}</h3>
        <p className="mt-2 text-sm text-stone-500">sem dados</p>
      </div>
    );
  }
  const maximo = Math.max(1, ...linhas.map((l) => l.carga.pedidosPorDia ?? 0));
  return (
    <div className={`${CARTAO} max-h-96 overflow-auto`}>
      <h3 className="text-sm font-medium text-stone-500">{titulo}: pedidos por dia com atividade</h3>
      <ul className="mt-2 space-y-1 text-sm">
        {linhas.map((l) => (
          <li
            key={l.chave}
            className="grid grid-cols-[7.5rem_1fr_3.5rem] items-center gap-2"
            title={`${formatarNumero(l.carga.pedidos)} pedidos, ${formatarNumero(l.carga.unidades)} un. em ${formatarNumero(l.carga.diasComAtividade)} dias com atividade`}
          >
            <span>
              {l.rotulo}
              {l.marca && <Etiqueta>{l.marca}</Etiqueta>}
            </span>
            <span
              className={`h-3 rounded ${l.marca === "domingo" ? "bg-amber-500" : l.marca === "parcial" ? "bg-sky-200" : "bg-sky-500"}`}
              style={{ width: `${((l.carga.pedidosPorDia ?? 0) / maximo) * 100}%` }}
            />
            <span className="text-right font-medium">{formatarNumeroOuNulo(l.carga.pedidosPorDia) ?? "—"}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-stone-500">
        Passe o rato numa linha para ver os totais e os dias. Unidades por dia: ver a Visão geral (série mensal).
      </p>
    </div>
  );
}

function CargaOperador({ operadores, rotulo }: { operadores: { operador: string; unidades: number; ondas: number }[]; rotulo: string }) {
  return (
    <div className={`${CARTAO} mt-4`}>
      <h3 className="text-sm font-medium text-stone-500">
        Carga por operador recolhedor <span className="ml-2 rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-700">{rotulo}</span>
      </h3>
      {operadores.length === 0 ? (
        <p className="mt-2 text-sm text-stone-500">sem dados</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <TabelaRecolhida
            classeTabela="w-full text-sm sm:w-auto"
            classeCabecalho="text-left text-stone-500"
            cabecalho={
              <tr>
                <th className="py-1 pr-6 font-normal">Operador</th>
                <th className="py-1 pr-6 text-right font-normal">Unidades</th>
                <th className="py-1 text-right font-normal">Ondas</th>
              </tr>
            }
            linhas={operadores.map((o) => (
              <tr key={o.operador} className="border-t border-stone-100">
                <td className="py-1 pr-6">{o.operador}</td>
                <td className="py-1 pr-6 text-right">{formatarNumero(o.unidades)}</td>
                <td className="py-1 text-right">{formatarNumero(o.ondas)}</td>
              </tr>
            ))}
          />
        </div>
      )}
      <p className="mt-2 text-xs text-stone-500">
        Mostra quanto cada operador recolheu, não o seu desempenho: o operador do PW é quem recolheu, e a distribuição depende de como as ondas foram atribuídas.
      </p>
    </div>
  );
}

function Etiqueta({ children }: { children: ReactNode }) {
  return <span className="ml-1.5 rounded bg-stone-100 px-1 text-xs text-stone-600">{children}</span>;
}
