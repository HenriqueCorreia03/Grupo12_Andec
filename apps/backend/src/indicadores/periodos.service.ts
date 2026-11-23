import { Inject, Injectable } from '@nestjs/common';
import { sql, type SQL } from 'drizzle-orm';
import { DATABASE, type Database } from '../db/database.module';
import { customerOrder, pickingWave } from '../db/schema';
import { porDiaComAtividade } from './atividade';
import { type Filtros, naoAplicaveis, pedidosQuePassam, SEM_FILTROS, selecionarLinhasCO, selecionarLinhasPicking } from './filtros';
import type { Exclusao } from './metadados';
import { type MesDaSerie, SerieMensalService } from './serie-mensal.service';

/** Capacidade de referência da onda (um alvo, não um limite; spec, "Ocupação da onda"). */
const CAPACIDADE = 24;

const DIAS_DA_SEMANA = ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado', 'domingo'];

/** Como se obtém a chave de cada período a partir de uma data/hora (`x`). */
interface Periodicidade {
  /** Chave do período como texto (aaaa-mm, 1 a 7 com 7 = domingo, 0 a 23). */
  chave: (x: SQL) => SQL;
}

const MES: Periodicidade = { chave: (x) => sql`to_char(${x}, 'YYYY-MM')` };
const DIA_DA_SEMANA: Periodicidade = { chave: (x) => sql`extract(isodow from ${x})::int::text` };
const HORA: Periodicidade = { chave: (x) => sql`extract(hour from ${x})::int::text` };

/** Números de um período (mês, dia da semana ou hora). */
export interface PeriodoDividido {
  pedidosDivididos: number;
  /** Pedidos válidos (total > 0 un.) criados no período. */
  pedidosValidos: number;
  /** % de pedidos válidos do período que são divididos; nulo sem pedidos. */
  percentagem: number | null;
  /** Ondas do PW cuja data/hora é do período (a data da onda é a dos seus pedidos). */
  ondas: number;
  /** Média de unidades recolhidas ÷ 24 × 100 sobre essas ondas (a onda completa); nulo sem ondas. */
  ocupacaoMedia: number | null;
  /** Dias com ≥ 1 pedido criado no período (domingos incluídos). */
  diasComAtividade: number;
  /** Divididos ÷ dias com atividade; nulo sem dias. */
  divididosPorDia: number | null;
}

export interface MesDividido extends PeriodoDividido {
  /** aaaa-mm */
  mes: string;
}

export interface DiaDaSemanaDividido extends PeriodoDividido {
  /** 1 = segunda-feira … 7 = domingo. */
  dia: number;
  nome: string;
  domingo: boolean;
}

export interface HoraDividida extends PeriodoDividido {
  hora: number;
}

export interface DividosPorPeriodo {
  meses: MesDividido[];
  diasDaSemana: DiaDaSemanaDividido[];
  horas: HoraDividida[];
  /** Critério de ordenação (alavanca b). */
  criterio: string;
  definicao: string;
  fonte: 'Customer_Order + Picking_Wave';
  linhasConsideradas: number;
  exclusoes: Exclusao[];
  filtrosNaoAplicaveis: string[];
}

/** Carga de um dia da semana ou de uma hora: totais e valores por dia com atividade. */
export interface CargaDoPeriodo {
  /** Dias com ≥ 1 pedido criado no período (domingos incluídos). */
  diasComAtividade: number;
  pedidos: number;
  unidades: number;
  /** Ondas do PW cuja data/hora é a do período. */
  ondas: number;
  pedidosPorDia: number | null;
  unidadesPorDia: number | null;
  ondasPorDia: number | null;
}

export interface CargaDiaDaSemana extends CargaDoPeriodo {
  /** 1 = segunda-feira … 7 = domingo. */
  dia: number;
  nome: string;
  /** Os domingos vêm assinalados (há pedidos ao domingo, spec). */
  domingo: boolean;
}

export interface CargaHora extends CargaDoPeriodo {
  hora: number;
}

export interface CargaOperador {
  operador: string;
  unidades: number;
  ondas: number;
}

export interface CargaPorPeriodo {
  /** A série mensal do ticket 08 (por dia com atividade, com os meses parciais assinalados). */
  porMes: MesDaSerie[];
  porDiaDaSemana: CargaDiaDaSemana[];
  porHora: CargaHora[];
  porOperador: { rotulo: 'carga, não desempenho'; operadores: CargaOperador[] };
  definicao: string;
  fonte: 'Customer_Order + Picking_Wave';
  linhasConsideradas: number;
  exclusoes: Exclusao[];
  filtrosNaoAplicaveis: string[];
}

interface PorChave {
  validos: number;
  divididos: number;
  ondas: number;
  ocupacaoMedia: number | null;
  dias: number;
}

@Injectable()
export class PeriodosService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly serieMensal: SerieMensalService,
  ) {}

  /**
   * Carga (pedidos, unidades e ondas) por mês, dia da semana e hora, e por operador recolhedor. Os pedidos e as
   * unidades são do CO (data de criação); as ondas e o operador são do PW (data/hora da onda).
   */
  async carga(filtros: Filtros = SEM_FILTROS): Promise<CargaPorPeriodo> {
    const [serie, contagens, operadores] = await Promise.all([
      this.serieMensal.serieMensal(filtros),
      this.linhas(filtros),
      this.cargaPorOperador(filtros),
    ]);
    const [dias, horas] = await Promise.all([this.cargaPorChave(DIA_DA_SEMANA, filtros), this.cargaPorChave(HORA, filtros)]);
    return {
      porMes: serie.meses,
      porDiaDaSemana: DIAS_DA_SEMANA.map((nome, i) => ({
        dia: i + 1,
        nome,
        domingo: i === 6,
        ...dias(String(i + 1)),
      })),
      porHora: Array.from({ length: 24 }, (_, hora) => ({ hora, ...horas(String(hora)) })),
      porOperador: { rotulo: 'carga, não desempenho', operadores },
      definicao:
        'Pedidos válidos e unidades encomendadas por período de criação do pedido (mês, dia da semana, hora) e ondas do PW pela data/hora da onda, ' +
        'também por dia com atividade (dia com ≥ 1 pedido criado, domingos incluídos). Carga por operador = unidades e ondas recolhidas pelo operador ' +
        'recolhedor: mostra a carga, não o desempenho.',
      fonte: 'Customer_Order + Picking_Wave',
      linhasConsideradas: contagens.positivas,
      exclusoes: [{ motivo: 'linhas com 0 un.', quantidade: contagens.zero }],
      filtrosNaoAplicaveis: naoAplicaveis(filtros, 'CO'),
    };
  }

  /** Carga de cada chave de período; as chaves sem atividade devolvem 0 (e "por dia" nulo). */
  private async cargaPorChave(periodicidade: Periodicidade, filtros: Filtros): Promise<(chave: string) => CargaDoPeriodo> {
    const [encomenda, ondas, dias] = await Promise.all([
      this.encomendaPorChave(periodicidade, filtros),
      this.ondasPorChave(periodicidade, filtros),
      this.diasPorChave(periodicidade, filtros),
    ]);
    return (chave) => {
      const e = encomenda.get(chave) ?? { pedidos: 0, unidades: 0 };
      const o = ondas.get(chave)?.ondas ?? 0;
      const d = dias.get(chave) ?? 0;
      return {
        diasComAtividade: d,
        pedidos: e.pedidos,
        unidades: e.unidades,
        ondas: o,
        pedidosPorDia: porDiaComAtividade(e.pedidos, d),
        unidadesPorDia: porDiaComAtividade(e.unidades, d),
        ondasPorDia: porDiaComAtividade(o, d),
      };
    };
  }

  /** Pedidos válidos (com linhas > 0) e unidades das linhas que passam os filtros, por período de criação. */
  private async encomendaPorChave(periodicidade: Periodicidade, filtros: Filtros) {
    const { rows } = await this.db.execute<{ chave: string; pedidos: number; unidades: number }>(sql`
      select
        ${periodicidade.chave(sql.raw('created_at'))} as chave,
        count(distinct order_number)::int as pedidos,
        sum(quantity)::float8 as unidades
      from (${selecionarLinhasCO(filtros)}) as linhas
      where quantity > 0
      group by 1
    `);
    return new Map(rows.map((r) => [r.chave, { pedidos: r.pedidos, unidades: r.unidades }]));
  }

  /** Unidades e ondas recolhidas por operador recolhedor (PW), por ordem decrescente de unidades. */
  private async cargaPorOperador(filtros: Filtros): Promise<CargaOperador[]> {
    const { rows } = await this.db.execute<CargaOperador & Record<string, unknown>>(sql`
      select
        operator as operador,
        sum(quantity)::int as unidades,
        count(distinct wave_number)::int as ondas
      from (${selecionarLinhasPicking(filtros)}) as linhas
      group by operator
      order by unidades desc, operator
    `);
    return rows.map((r) => ({ operador: r.operador, unidades: r.unidades, ondas: r.ondas }));
  }

  /**
   * Pedidos divididos por mês, dia da semana e hora, ordenados pelo critério da alavanca (b): nº absoluto de
   * divididos (decrescente) e, em empate, ocupação média das ondas do período (crescente).
   */
  async divididosPorPeriodo(filtros: Filtros = SEM_FILTROS): Promise<DividosPorPeriodo> {
    const [meses, dias, horas, contagens] = await Promise.all([
      this.agregar(MES, filtros),
      this.agregar(DIA_DA_SEMANA, filtros),
      this.agregar(HORA, filtros),
      this.linhas(filtros),
    ]);
    const numeros = (n: PorChave): PeriodoDividido => ({
      pedidosDivididos: n.divididos,
      pedidosValidos: n.validos,
      percentagem: n.validos === 0 ? null : (n.divididos * 100) / n.validos,
      ondas: n.ondas,
      ocupacaoMedia: n.ocupacaoMedia,
      diasComAtividade: n.dias,
      divididosPorDia: porDiaComAtividade(n.divididos, n.dias),
    });
    return {
      meses: ordenar([...meses].map(([mes, n]) => ({ mes, ...numeros(n) })), (m) => m.mes),
      diasDaSemana: ordenar(
        [...dias].map(([chave, n]) => ({ dia: Number(chave), nome: DIAS_DA_SEMANA[Number(chave) - 1], domingo: chave === '7', ...numeros(n) })),
        (d) => d.dia,
      ),
      horas: ordenar([...horas].map(([chave, n]) => ({ hora: Number(chave), ...numeros(n) })), (h) => h.hora),
      criterio:
        'Por nº absoluto de pedidos divididos (decrescente); em empate, pela ocupação média das ondas do período (crescente); ' +
        'a seguir, pela ordem do calendário.',
      definicao:
        'Pedidos válidos (total > 0 un.) presentes em mais de uma onda, por período de criação do pedido (mês, dia da semana, hora). ' +
        'Ocupação média = média das unidades recolhidas ÷ 24 das ondas do PW cuja data/hora é a do período. ' +
        'Os meses também vêm por dia com atividade.',
      fonte: 'Customer_Order + Picking_Wave',
      linhasConsideradas: contagens.positivas,
      exclusoes: [{ motivo: 'linhas com 0 un.', quantidade: contagens.zero }],
      filtrosNaoAplicaveis: naoAplicaveis(filtros, 'CO'),
    };
  }

  /** Divididos, ondas e dias por chave de período; um período só aparece se tiver pedidos ou ondas. */
  private async agregar(periodicidade: Periodicidade, filtros: Filtros): Promise<Map<string, PorChave>> {
    const [pedidos, ondas, dias] = await Promise.all([
      this.pedidosPorChave(periodicidade, filtros),
      this.ondasPorChave(periodicidade, filtros),
      this.diasPorChave(periodicidade, filtros),
    ]);
    const chaves = new Set([...pedidos.keys(), ...ondas.keys()]);
    return new Map(
      [...chaves].map((chave) => {
        const p = pedidos.get(chave) ?? { validos: 0, divididos: 0 };
        const o = ondas.get(chave) ?? { ondas: 0, ocupacaoMedia: null };
        return [chave, { ...p, ...o, dias: dias.get(chave) ?? 0 }];
      }),
    );
  }

  /** Pedidos válidos e divididos por período de criação. Dividido é propriedade do pedido completo. */
  private async pedidosPorChave(periodicidade: Periodicidade, filtros: Filtros) {
    const { rows } = await this.db.execute<{ chave: string; validos: number; divididos: number }>(sql`
      with passam as (${pedidosQuePassam(filtros)}),
      pedidos as (
        select
          min(${customerOrder.createdAt}) filter (where ${customerOrder.quantity} > 0) as criado,
          count(distinct ${customerOrder.waveNumber}) filter (where ${customerOrder.quantity} > 0) as ondas
        from ${customerOrder}
        where ${customerOrder.orderNumber} in (select order_number from passam)
        group by ${customerOrder.orderNumber}
        having sum(${customerOrder.quantity}) > 0
      )
      select
        ${periodicidade.chave(sql.raw('criado'))} as chave,
        count(*)::int as validos,
        (count(*) filter (where ondas > 1))::int as divididos
      from pedidos
      group by 1
    `);
    return new Map(rows.map((r) => [r.chave, { validos: r.validos, divididos: r.divididos }]));
  }

  /** Ondas do PW (que passam os filtros) e a sua ocupação média, pelo período da data/hora da onda. */
  private async ondasPorChave(periodicidade: Periodicidade, filtros: Filtros) {
    const { rows } = await this.db.execute<{ chave: string; ondas: number; ocupacao: number }>(sql`
      with datas as (
        select ${customerOrder.waveNumber} as onda, min(${customerOrder.createdAt}) as criada
        from ${customerOrder}
        group by ${customerOrder.waveNumber}
      ),
      selecionadas as (select distinct wave_number from (${selecionarLinhasPicking(filtros)}) as linhas),
      completas as (
        select ${pickingWave.waveNumber} as onda, sum(${pickingWave.quantity})::float8 as unidades
        from ${pickingWave}
        where ${pickingWave.waveNumber} in (select wave_number from selecionadas)
        group by ${pickingWave.waveNumber}
      )
      select
        ${periodicidade.chave(sql.raw('d.criada'))} as chave,
        count(*)::int as ondas,
        avg(c.unidades * 100 / ${CAPACIDADE})::float8 as ocupacao
      from completas c
      join datas d on d.onda = c.onda
      group by 1
    `);
    return new Map(rows.map((r) => [r.chave, { ondas: r.ondas, ocupacaoMedia: r.ocupacao }]));
  }

  /** Dias com ≥ 1 pedido criado por período: a atividade da operação toda no período (só o período filtra). */
  private async diasPorChave(periodicidade: Periodicidade, filtros: Filtros) {
    const { rows } = await this.db.execute<{ chave: string; dias: number }>(sql`
      select
        ${periodicidade.chave(sql.raw('created_at'))} as chave,
        count(distinct created_at::date)::int as dias
      from ${customerOrder}
      where (${filtros.inicio}::date is null or created_at >= ${filtros.inicio}::date)
        and (${filtros.fim}::date is null or created_at < (${filtros.fim}::date + 1))
      group by 1
    `);
    return new Map(rows.map((r) => [r.chave, r.dias]));
  }

  private async linhas(filtros: Filtros): Promise<{ positivas: number; zero: number }> {
    const { rows } = await this.db.execute<{ positivas: number; zero: number }>(sql`
      select
        (count(*) filter (where quantity > 0))::int as positivas,
        (count(*) filter (where quantity = 0))::int as zero
      from (${selecionarLinhasCO(filtros)}) as linhas
    `);
    return rows[0];
  }
}

/** Mais pedidos divididos primeiro; em empate, menor ocupação média (sem ondas, no fim); depois pelo calendário. */
function ordenar<T extends PeriodoDividido>(itens: T[], calendario: (item: T) => string | number): T[] {
  return itens.sort(
    (a, b) =>
      b.pedidosDivididos - a.pedidosDivididos ||
      (a.ocupacaoMedia ?? Infinity) - (b.ocupacaoMedia ?? Infinity) ||
      (calendario(a) < calendario(b) ? -1 : calendario(a) > calendario(b) ? 1 : 0),
  );
}
