"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SerieMensal } from "@/lib/api";
import { formatarMes, formatarMesCurto, formatarNumero } from "@/lib/formatar";

/** Uma só série por gráfico (pequenos múltiplos, nunca dois eixos): cor da série 1 da paleta de referência. */
const COR = "#2a78d6";
/** Meses parciais: passo mais claro da mesma rampa, mais o "*" no eixo e a indicação no tooltip (nunca só a cor). */
const COR_PARCIAL = "#86b6ef";
const GRELHA = "#e7e5e4";
const TEXTO = "#57534e";

type Mes = SerieMensal["meses"][number];
type Medida = "pedidosPorDia" | "unidadesPorDia" | "ondasRecolhidasPorDia" | "tamanhoMedio";

const MEDIDAS: { chave: Medida; titulo: string }[] = [
  { chave: "pedidosPorDia", titulo: "Pedidos por dia com atividade" },
  { chave: "unidadesPorDia", titulo: "Unidades por dia com atividade" },
  { chave: "ondasRecolhidasPorDia", titulo: "Ondas recolhidas por dia com atividade" },
  { chave: "tamanhoMedio", titulo: "Tamanho médio da encomenda (un./pedido)" },
];

/** Série mensal em quatro pequenos gráficos de barras (um eixo cada), com a tabela por baixo. */
export function GraficosSerieMensal({ serie, mesSelecionado }: { serie: SerieMensal; mesSelecionado: string | null }) {
  if (serie.meses.length === 0) {
    return <p className="rounded-lg border border-stone-200 bg-white p-5 text-sm text-stone-500">sem dados</p>;
  }
  const dados = serie.meses.map((m) => ({ ...m, rotulo: `${formatarMesCurto(m.mes)}${m.parcial ? "*" : ""}` }));
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {MEDIDAS.map((medida) => (
          <figure key={medida.chave} className="rounded-lg border border-stone-200 bg-white p-4">
            <figcaption className="text-sm font-medium text-stone-500">{medida.titulo}</figcaption>
            <div className="mt-2 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dados} margin={{ top: 8, right: 4, bottom: 0, left: -8 }}>
                  <CartesianGrid vertical={false} stroke={GRELHA} strokeWidth={1} />
                  <XAxis dataKey="rotulo" tickLine={false} axisLine={{ stroke: GRELHA }} tick={{ fill: TEXTO, fontSize: 11 }} interval={0} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: TEXTO, fontSize: 11 }}
                    tickFormatter={(v: number) => formatarNumero(v)}
                    width={48}
                  />
                  <Tooltip cursor={{ fill: "#f5f5f4" }} content={<DicaMes medida={medida.chave} titulo={medida.titulo} />} />
                  <Bar dataKey={medida.chave} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {dados.map((m) => (
                      <Cell
                        key={m.mes}
                        fill={m.parcial ? COR_PARCIAL : COR}
                        stroke={m.mes === mesSelecionado ? "#1c1917" : "none"}
                        strokeWidth={m.mes === mesSelecionado ? 2 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </figure>
        ))}
      </div>
      <p className="mt-2 text-xs text-stone-500">
        * Mês parcial (só em parte coberto pelos dados ou pelo período escolhido).{" "}
        {mesSelecionado && "Contorno escuro = mês selecionado."}
      </p>
      <details className="mt-3 rounded-lg border border-stone-200 bg-white text-sm">
        <summary className="cursor-pointer px-4 py-2 text-stone-600">Ver a série em tabela</summary>
        <TabelaSerie meses={serie.meses} />
      </details>
    </div>
  );
}

function DicaMes({
  active,
  payload,
  medida,
  titulo,
}: {
  active?: boolean;
  payload?: { payload: Mes }[];
  medida: Medida;
  titulo: string;
}) {
  if (!active || !payload?.length) return null;
  const m = payload[0].payload;
  const valor = m[medida];
  return (
    <div className="rounded-md bg-stone-900 px-3 py-2 text-xs leading-relaxed text-stone-100 shadow-lg">
      <p className="font-medium">
        {formatarMes(m.mes)}
        {m.parcial && " (mês parcial)"}
      </p>
      <p>
        {titulo}: {valor === null ? "sem dados" : formatarNumero(valor)}
      </p>
      <p>
        {m.diasComAtividade} dias com atividade{m.domingos > 0 && `, dos quais ${m.domingos} ${m.domingos === 1 ? "domingo" : "domingos"}`}
      </p>
    </div>
  );
}

function TabelaSerie({ meses }: { meses: Mes[] }) {
  const numero = (v: number | null) => (v === null ? "sem dados" : formatarNumero(v));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right">
        <thead className="border-y border-stone-200 bg-stone-50 text-stone-500">
          <tr>
            <th className="px-3 py-2 text-left font-normal">Mês</th>
            <th className="px-3 py-2 font-normal">Dias com atividade</th>
            <th className="px-3 py-2 font-normal">Domingos</th>
            <th className="px-3 py-2 font-normal">Pedidos/dia</th>
            <th className="px-3 py-2 font-normal">Unidades/dia</th>
            <th className="px-3 py-2 font-normal">Ondas recolhidas/dia</th>
            <th className="px-3 py-2 font-normal">Tamanho médio</th>
          </tr>
        </thead>
        <tbody>
          {meses.map((m) => (
            <tr key={m.mes} className="border-t border-stone-100">
              <td className="px-3 py-1.5 text-left">
                {formatarMes(m.mes)}
                {m.parcial && <span className="ml-1 text-xs text-stone-500">(parcial)</span>}
              </td>
              <td className="px-3 py-1.5">{m.diasComAtividade}</td>
              <td className="px-3 py-1.5">{m.domingos}</td>
              <td className="px-3 py-1.5">{numero(m.pedidosPorDia)}</td>
              <td className="px-3 py-1.5">{numero(m.unidadesPorDia)}</td>
              <td className="px-3 py-1.5">{numero(m.ondasRecolhidasPorDia)}</td>
              <td className="px-3 py-1.5">{numero(m.tamanhoMedio)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
