"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatarNumero, formatarPercentagem } from "@/lib/formatar";

/**
 * Gráficos de leitura rápida para a demo (Artigos e Ondas). Só apresentam: os valores e as ordens vêm da API.
 * Uma escala por gráfico, as cores dos gráficos que já existem (serie-mensal) e o destaque em laranja, como no
 * histograma da ocupação. O destaque nunca é só a cor: a dica e o texto ao lado dizem qual é.
 */
const AZUL = "#2a78d6";
const AZUL_CLARO = "#86b6ef";
const CINZA = "#d6d3d1";
const DESTAQUE = "#f59e0b";
const GRELHA = "#e7e5e4";
const TEXTO = "#57534e";

function Dica({ linhas }: { linhas: string[] }) {
  return (
    <div className="rounded-md bg-stone-900 px-3 py-2 text-xs leading-relaxed text-stone-100 shadow-lg">
      {linhas.map((l, i) => (
        <p key={l} className={i === 0 ? "font-medium" : undefined}>
          {l}
        </p>
      ))}
    </div>
  );
}

/* ---------- curva do ABC ---------- */

export interface PontoAbc {
  posicao: number;
  referencia: string;
  /** % acumulada das unidades depois de juntar esta referência (0–100). */
  acumulado: number;
  unidades: number;
  classe: "A" | "B" | "C";
}

/**
 * Curva de concentração do ABC: as referências da que mais vende à que menos, e a % das unidades acumulada.
 * As faixas mostram onde acabam as classes A e B (os limiares de 80 % e 95 % da regra).
 */
export function CurvaAbc({ pontos }: { pontos: PontoAbc[] }) {
  if (pontos.length === 0)
    return <p className="text-sm text-stone-500">sem dados</p>;
  const ultimo = (classe: PontoAbc["classe"]) =>
    pontos.filter((p) => p.classe === classe).at(-1)?.posicao ?? 0;
  const fimA = ultimo("A");
  const fimB = Math.max(fimA, ultimo("B"));
  const total = pontos.length;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={pontos}
          margin={{ top: 8, right: 44, bottom: 4, left: -8 }}
        >
          <CartesianGrid vertical={false} stroke={GRELHA} />
          {fimA > 0 && (
            <ReferenceArea
              x1={1}
              x2={fimA}
              fill={AZUL}
              fillOpacity={0.07}
              label={{
                value: "A",
                position: "insideTop",
                fill: TEXTO,
                fontSize: 12,
              }}
            />
          )}
          {fimB > fimA && (
            <ReferenceArea
              x1={fimA}
              x2={fimB}
              fill={AZUL_CLARO}
              fillOpacity={0.12}
              label={{
                value: "B",
                position: "insideTop",
                fill: TEXTO,
                fontSize: 12,
              }}
            />
          )}
          {total > fimB && (
            <ReferenceArea
              x1={fimB}
              x2={total}
              fill={CINZA}
              fillOpacity={0.2}
              label={{
                value: "C",
                position: "insideTop",
                fill: TEXTO,
                fontSize: 12,
              }}
            />
          )}
          <ReferenceLine
            y={80}
            stroke={TEXTO}
            strokeDasharray="4 4"
            label={{
              value: "80 %",
              position: "right",
              fill: TEXTO,
              fontSize: 11,
            }}
          />
          <ReferenceLine
            y={95}
            stroke={TEXTO}
            strokeDasharray="4 4"
            label={{
              value: "95 %",
              position: "right",
              fill: TEXTO,
              fontSize: 11,
            }}
          />
          <XAxis
            dataKey="posicao"
            type="number"
            domain={[1, total]}
            tickLine={false}
            axisLine={{ stroke: GRELHA }}
            tick={{ fill: TEXTO, fontSize: 11 }}
            ticks={[1, fimA, fimB, total].filter(
              (v, i, a) => v > 0 && a.indexOf(v) === i,
            )}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: TEXTO, fontSize: 11 }}
            tickFormatter={(v: number) => `${v} %`}
            width={48}
          />
          <Tooltip
            cursor={{ stroke: TEXTO, strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as PontoAbc;
              return (
                <Dica
                  linhas={[
                    `${p.posicao}.ª referência: ${p.referencia} (classe ${p.classe})`,
                    `${formatarNumero(p.unidades)} un. encomendadas`,
                    `Até aqui: ${formatarPercentagem(p.acumulado)} das unidades`,
                  ]}
                />
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="acumulado"
            stroke={AZUL}
            strokeWidth={2}
            fill={AZUL}
            fillOpacity={0.15}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------- barras horizontais (top N) ---------- */

export interface ItemBarra {
  rotulo: string;
  valor: number;
  destaque?: boolean;
  /** Linhas extra da dica. */
  dica?: string[];
}

/** Barras horizontais, da maior para a menor, pela ordem recebida (a ordem vem da API). */
export function BarrasHorizontais({
  itens,
  unidade,
}: {
  itens: ItemBarra[];
  unidade: string;
}) {
  if (itens.length === 0)
    return <p className="text-sm text-stone-500">sem dados</p>;
  return (
    <div style={{ height: Math.max(160, itens.length * 30 + 24) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={itens}
          layout="vertical"
          margin={{ top: 4, right: 40, bottom: 4, left: 8 }}
        >
          <CartesianGrid horizontal={false} stroke={GRELHA} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fill: TEXTO, fontSize: 11 }}
            tickFormatter={(v: number) => formatarNumero(v)}
          />
          <YAxis
            type="category"
            dataKey="rotulo"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#1c1917", fontSize: 12, fontWeight: 600 }}
            width={76}
          />
          <Tooltip
            cursor={{ fill: "#f5f5f4" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const i = payload[0].payload as ItemBarra;
              return (
                <Dica
                  linhas={[
                    i.rotulo,
                    `${formatarNumero(i.valor)} ${unidade}`,
                    ...(i.dica ?? []),
                  ]}
                />
              );
            }}
          />
          <Bar
            dataKey="valor"
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
            isAnimationActive={false}
            label={{
              position: "right",
              fill: TEXTO,
              fontSize: 11,
              formatter: (v: unknown) => formatarNumero(Number(v)),
            }}
          >
            {itens.map((i) => (
              <Cell key={i.rotulo} fill={i.destaque ? DESTAQUE : AZUL} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------- barras por período ---------- */

/** Barras verticais por ordem natural (meses, dias, horas), com o período de topo do ranking em destaque. */
export function BarrasPeriodo({
  itens,
  unidade,
}: {
  itens: ItemBarra[];
  unidade: string;
}) {
  if (itens.length === 0)
    return <p className="text-sm text-stone-500">sem dados</p>;
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={itens}
          margin={{ top: 8, right: 4, bottom: 0, left: -12 }}
        >
          <CartesianGrid vertical={false} stroke={GRELHA} />
          <XAxis
            dataKey="rotulo"
            tickLine={false}
            axisLine={{ stroke: GRELHA }}
            tick={{ fill: TEXTO, fontSize: 11 }}
            interval={0}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: TEXTO, fontSize: 11 }}
            tickFormatter={(v: number) => formatarNumero(v)}
            width={52}
          />
          <Tooltip
            cursor={{ fill: "#f5f5f4" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const i = payload[0].payload as ItemBarra;
              return (
                <Dica
                  linhas={[
                    i.rotulo + (i.destaque ? " (o mais alto)" : ""),
                    `${formatarNumero(i.valor)} ${unidade}`,
                    ...(i.dica ?? []),
                  ]}
                />
              );
            }}
          />
          <Bar
            dataKey="valor"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          >
            {itens.map((i) => (
              <Cell key={i.rotulo} fill={i.destaque ? DESTAQUE : AZUL} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
