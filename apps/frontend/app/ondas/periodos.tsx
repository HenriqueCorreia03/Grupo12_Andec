import type { ReactNode } from "react";
import { ErroApi } from "@/components/erro-api";
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
    <div className="space-y-8 sm:col-span-2 lg:col-span-3">
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
        Ranking da alavanca (b): por nº de pedidos divididos (mais primeiro); em empate, menor ocupação média das ondas.{" "}
        <span title={dados.definicao}>(definição)</span>
      </p>
      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-3">
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
    </section>
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
    <div className={`${CARTAO} max-h-96 overflow-auto`}>
      <h3 className="text-sm font-medium text-stone-500">{titulo}</h3>
      <table className="mt-2 w-full text-sm">
        <thead className="text-left text-stone-500">
          <tr>
            <th className="py-1 font-normal">#</th>
            <th className="py-1 font-normal">Período</th>
            <th className="py-1 text-right font-normal">Divididos</th>
            <th className="py-1 text-right font-normal">Ocup. média</th>
            {mostrarPorDia && <th className="py-1 text-right font-normal">Por dia</th>}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
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
        </tbody>
      </table>
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
        <div className="mt-2 max-h-72 overflow-auto">
          <table className="w-full text-sm sm:w-auto">
            <thead className="text-left text-stone-500">
              <tr>
                <th className="py-1 pr-6 font-normal">Operador</th>
                <th className="py-1 pr-6 text-right font-normal">Unidades</th>
                <th className="py-1 text-right font-normal">Ondas</th>
              </tr>
            </thead>
            <tbody>
              {operadores.map((o) => (
                <tr key={o.operador} className="border-t border-stone-100">
                  <td className="py-1 pr-6">{o.operador}</td>
                  <td className="py-1 pr-6 text-right">{formatarNumero(o.unidades)}</td>
                  <td className="py-1 text-right">{formatarNumero(o.ondas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
