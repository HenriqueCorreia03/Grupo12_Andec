import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../db/database.module';
import { customerOrder, product } from '../db/schema';
import { AbcService, type ResumoAbc } from './abc.service';
import { diasComAtividade, porDiaComAtividade } from './atividade';
import { type Filtros, linhasFiltradas, pedidosQuePassam, SEM_FILTROS, naoAplicaveis } from './filtros';
import { MatrizService, type Matriz } from './matriz.service';
import type { Exclusao, Metadados } from './metadados';

export type { Exclusao, Metadados };

export interface TamanhoMedioEncomenda extends Metadados {
  /** Σ unidades ÷ nº de pedidos válidos; nulo quando não há pedidos ("sem dados"). */
  valor: number | null;
  mediana: number | null;
  p90: number | null;
  pedidosConsiderados: number;
  pedidosExcluidos: number;
}

export interface PedidosPorOnda extends Metadados {
  /** Média, sobre as ondas, do nº de pedidos válidos distintos; nulo sem ondas. */
  valor: number | null;
  mediana: number | null;
  ondas: number;
  ondasComUmPedido: number;
}

export interface ParticipacaoPorSetor extends Metadados {
  setores: { setor: string; unidades: number; percentagem: number }[];
  /** Explicação quando os dados têm um único setor; nulo quando há vários. */
  limitacao: string | null;
}

export interface PedidosMultissetor extends Metadados {
  /** % de pedidos válidos com ≥ 2 setores; nulo sem pedidos. */
  valor: number | null;
  pedidosMultissetor: number;
  pedidosValidos: number;
  /** Explicação quando os dados têm um único setor; nulo quando há vários. */
  limitacao: string | null;
}

/** Volume no período (comparado com o período anterior por dia com atividade). */
export interface IndicadorVolume extends Metadados {
  natureza: 'volume';
  /** Total no período; nulo quando a seleção não tem linhas ("sem dados"). */
  valor: number | null;
  /** Dias com ≥ 1 pedido criado no período (domingos incluídos). */
  diasComAtividade: number;
  /** valor ÷ dias com atividade; nulo sem dados. */
  porDiaComAtividade: number | null;
}

export interface VisaoGeral {
  tamanhoMedioEncomenda: TamanhoMedioEncomenda;
  pedidosPorOnda: PedidosPorOnda;
  participacaoPorSetor: ParticipacaoPorSetor;
  pedidosMultissetor: PedidosMultissetor;
  abc: ResumoAbc;
  matriz: Matriz;
  volume: { pedidos: IndicadorVolume; unidades: IndicadorVolume };
}

/** Linhas, pedidos e ondas que os indicadores de encomenda consideram ou deixam de fora. */
interface Contagens {
  linhasPositivas: number;
  linhasPositivasComProduto: number;
  linhasZero: number;
  pedidosZero: number;
  ondasSoComZeros: number;
  linhasSemProduto: number;
  setores: number;
}

type MotivoExclusao = 'linhasZero' | 'pedidosZero' | 'ondasSoComZeros' | 'linhasSemProduto';

const MOTIVOS: Record<MotivoExclusao, string> = {
  linhasZero: 'linhas com 0 un.',
  pedidosZero: 'pedidos com 0 un.',
  ondasSoComZeros: 'ondas só com linhas a 0 un.',
  linhasSemProduto: 'linhas cuja referência não existe no Product',
};

function exclusoes(contagens: Contagens, ...motivos: MotivoExclusao[]): Exclusao[] {
  return motivos.map((motivo) => ({ motivo: MOTIVOS[motivo], quantidade: contagens[motivo] }));
}

/** A limitação só se explica quando os dados têm um único setor (o caso do dataset real, só "PF"). */
function limitacaoSetor(contagens: Contagens): string | null {
  return contagens.setores === 1
    ? 'Todas as referências encomendadas são de um único setor: a participação por setor dá sempre 100 % ' +
        'e os pedidos multissetor dão sempre 0 %.'
    : null;
}

@Injectable()
export class IndicadoresService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly abc: AbcService,
    private readonly matrizService: MatrizService,
  ) {}

  async visaoGeral(filtros: Filtros = SEM_FILTROS): Promise<VisaoGeral> {
    const contagens = await this.contagens(filtros);
    return {
      tamanhoMedioEncomenda: await this.tamanhoMedioEncomenda(contagens, filtros),
      pedidosPorOnda: await this.pedidosPorOnda(contagens, filtros),
      participacaoPorSetor: await this.participacaoPorSetor(contagens, filtros),
      pedidosMultissetor: await this.pedidosMultissetor(contagens, filtros),
      abc: await this.abc.resumo(filtros),
      matriz: await this.matrizService.matriz(filtros),
      volume: await this.volume(contagens, filtros),
    };
  }

  /** Pedidos válidos e unidades encomendadas que passam os filtros, com os dias com atividade do período. */
  private async volume(contagens: Contagens, filtros: Filtros): Promise<VisaoGeral['volume']> {
    const { rows } = await this.db.execute<{ pedidos: number; unidades: number }>(sql`
      with ${linhasFiltradas(filtros)}
      select
        count(distinct ${customerOrder.orderNumber}) filter (where ${customerOrder.quantity} > 0)::int as pedidos,
        coalesce(sum(${customerOrder.quantity}) filter (where ${customerOrder.quantity} > 0), 0)::float8 as unidades
      from ${customerOrder}
    `);
    const [{ pedidos, unidades }] = rows;
    const dias = await diasComAtividade(this.db, filtros);
    const semDados = contagens.linhasPositivas === 0;
    const comum = {
      natureza: 'volume' as const,
      fonte: 'Customer_Order' as const,
      filtrosNaoAplicaveis: naoAplicaveis(filtros, 'CO'),
      linhasConsideradas: contagens.linhasPositivas,
      diasComAtividade: dias,
    };
    const indicador = (valor: number, definicao: string, motivos: MotivoExclusao[]): IndicadorVolume => ({
      ...comum,
      valor: semDados ? null : valor,
      porDiaComAtividade: semDados ? null : porDiaComAtividade(valor, dias),
      definicao,
      exclusoes: exclusoes(contagens, ...motivos),
    });
    return {
      pedidos: indicador(
        pedidos,
        'Nº de pedidos válidos (total > 0 un.) com linhas no período; compara-se por dia com atividade ' +
          '(dia com ≥ 1 pedido criado, domingos incluídos).',
        ['pedidosZero', 'linhasZero'],
      ),
      unidades: indicador(
        unidades,
        'Unidades encomendadas (linhas > 0) no período; compara-se por dia com atividade ' +
          '(dia com ≥ 1 pedido criado, domingos incluídos).',
        ['linhasZero'],
      ),
    };
  }

  private async contagens(filtros: Filtros): Promise<Contagens> {
    const { rows } = await this.db.execute<{
      linhas_positivas: number;
      linhas_positivas_com_produto: number;
      linhas_zero: number;
      pedidos_zero: number;
      ondas_so_com_zeros: number;
      linhas_sem_produto: number;
      setores: number;
    }>(sql`
      with ${linhasFiltradas(filtros)}, linhas as (
        select
          ${customerOrder.orderNumber} as pedido,
          ${customerOrder.waveNumber} as onda,
          ${customerOrder.quantity} as unidades,
          ${product.sector} as setor
        from ${customerOrder}
        left join ${product} on ${product.reference} = ${customerOrder.reference}
      )
      select
        (count(*) filter (where unidades > 0))::int as linhas_positivas,
        (count(*) filter (where unidades > 0 and setor is not null))::int as linhas_positivas_com_produto,
        (count(*) filter (where unidades = 0))::int as linhas_zero,
        (select count(*)::int from (select 1 from linhas group by pedido having sum(unidades) = 0) as p) as pedidos_zero,
        (select count(*)::int from (select 1 from linhas group by onda having sum(unidades) = 0) as o) as ondas_so_com_zeros,
        (count(*) filter (where setor is null))::int as linhas_sem_produto,
        (count(distinct setor) filter (where unidades > 0))::int as setores
      from linhas
    `);
    const [linha] = rows;
    return {
      linhasPositivas: linha.linhas_positivas,
      linhasPositivasComProduto: linha.linhas_positivas_com_produto,
      linhasZero: linha.linhas_zero,
      pedidosZero: linha.pedidos_zero,
      ondasSoComZeros: linha.ondas_so_com_zeros,
      linhasSemProduto: linha.linhas_sem_produto,
      setores: linha.setores,
    };
  }

  private async tamanhoMedioEncomenda(contagens: Contagens, filtros: Filtros): Promise<TamanhoMedioEncomenda> {
    const { rows } = await this.db.execute<{
      valor: number | null;
      mediana: number | null;
      p90: number | null;
      pedidos_considerados: number;
    }>(sql`
      with ${linhasFiltradas(filtros)}, validos as (
        select sum(${customerOrder.quantity}) as unidades
        from ${customerOrder}
        group by ${customerOrder.orderNumber}
        having sum(${customerOrder.quantity}) > 0
      )
      select
        sum(unidades)::float8 / nullif(count(*), 0) as valor,
        percentile_cont(0.5) within group (order by unidades) as mediana,
        percentile_cont(0.9) within group (order by unidades) as p90,
        count(*)::int as pedidos_considerados
      from validos
    `);
    const [resultado] = rows;
    return {
      valor: resultado.valor,
      mediana: resultado.mediana,
      p90: resultado.p90,
      pedidosConsiderados: resultado.pedidos_considerados,
      pedidosExcluidos: contagens.pedidosZero,
      definicao:
        'Unidades encomendadas ÷ nº de pedidos válidos (pedidos com total > 0 un.). ' +
        'Mediana e p90 sobre o total de unidades de cada pedido válido (método contínuo).',
      fonte: 'Customer_Order',
      filtrosNaoAplicaveis: naoAplicaveis(filtros, 'CO'),
      linhasConsideradas: contagens.linhasPositivas,
      exclusoes: exclusoes(contagens, 'pedidosZero', 'linhasZero'),
    };
  }

  private async pedidosPorOnda(contagens: Contagens, filtros: Filtros): Promise<PedidosPorOnda> {
    // Linhas > 0 só existem em pedidos válidos, por isso basta filtrar as linhas.
    const { rows } = await this.db.execute<{
      valor: number | null;
      mediana: number | null;
      ondas: number;
      ondas_com_um_pedido: number;
    }>(sql`
      with ${linhasFiltradas(filtros)}, por_onda as (
        select count(distinct ${customerOrder.orderNumber}) as pedidos
        from ${customerOrder}
        where ${customerOrder.quantity} > 0
        group by ${customerOrder.waveNumber}
      )
      select
        avg(pedidos)::float8 as valor,
        percentile_cont(0.5) within group (order by pedidos) as mediana,
        count(*)::int as ondas,
        (count(*) filter (where pedidos = 1))::int as ondas_com_um_pedido
      from por_onda
    `);
    const [resultado] = rows;
    return {
      valor: resultado.valor,
      mediana: resultado.mediana,
      ondas: resultado.ondas,
      ondasComUmPedido: resultado.ondas_com_um_pedido,
      definicao:
        'Média, sobre as ondas, do nº de pedidos válidos distintos com linhas > 0 na onda. ' +
        'Um pedido dividido conta em cada onda onde aparece.',
      nota: 'Universo de ondas = CO (inclui as ondas sem picking); a ocupação usa o PW.',
      fonte: 'Customer_Order',
      filtrosNaoAplicaveis: naoAplicaveis(filtros, 'CO'),
      linhasConsideradas: contagens.linhasPositivas,
      exclusoes: exclusoes(contagens, 'linhasZero', 'pedidosZero', 'ondasSoComZeros'),
    };
  }

  private async participacaoPorSetor(contagens: Contagens, filtros: Filtros): Promise<ParticipacaoPorSetor> {
    // Numerador e denominador usam as mesmas linhas (> 0 e com referência no Product), por isso somam 100 %.
    const { rows } = await this.db.execute<{ setor: string; unidades: number; percentagem: number }>(sql`
      with ${linhasFiltradas(filtros)}
      select
        ${product.sector} as setor,
        sum(${customerOrder.quantity})::float8 as unidades,
        sum(${customerOrder.quantity})::float8 * 100 / sum(sum(${customerOrder.quantity})) over () as percentagem
      from ${customerOrder}
      join ${product} on ${product.reference} = ${customerOrder.reference}
      where ${customerOrder.quantity} > 0
      group by ${product.sector}
      order by unidades desc, setor
    `);
    return {
      setores: rows,
      definicao:
        'Unidades encomendadas do setor ÷ unidades encomendadas totais × 100. Setor do Product, sem espaços.',
      limitacao: limitacaoSetor(contagens),
      fonte: 'Customer_Order + Product',
      filtrosNaoAplicaveis: naoAplicaveis(filtros, 'CO'),
      linhasConsideradas: contagens.linhasPositivasComProduto,
      exclusoes: exclusoes(contagens, 'linhasZero', 'linhasSemProduto'),
    };
  }

  private async pedidosMultissetor(contagens: Contagens, filtros: Filtros): Promise<PedidosMultissetor> {
    const { rows } = await this.db.execute<{ multissetor: number; validos: number }>(sql`
      with passam as (${pedidosQuePassam(filtros)}),
      -- Multissetor é uma propriedade do pedido: os setores são os do pedido completo, não só os das linhas filtradas.
      pedidos as (
        select count(distinct ${product.sector}) as setores
        from ${customerOrder}
        left join ${product} on ${product.reference} = ${customerOrder.reference}
        where ${customerOrder.quantity} > 0 and ${customerOrder.orderNumber} in (select order_number from passam)
        group by ${customerOrder.orderNumber}
      )
      select
        (count(*) filter (where setores >= 2))::int as multissetor,
        count(*)::int as validos
      from pedidos
    `);
    const [resultado] = rows;
    return {
      valor: resultado.validos === 0 ? null : (resultado.multissetor * 100) / resultado.validos,
      pedidosMultissetor: resultado.multissetor,
      pedidosValidos: resultado.validos,
      definicao: 'Pedidos válidos com linhas > 0 de ≥ 2 setores ÷ pedidos válidos × 100.',
      limitacao: limitacaoSetor(contagens),
      fonte: 'Customer_Order + Product',
      filtrosNaoAplicaveis: naoAplicaveis(filtros, 'CO'),
      linhasConsideradas: contagens.linhasPositivas,
      exclusoes: exclusoes(contagens, 'pedidosZero', 'linhasZero', 'linhasSemProduto'),
    };
  }
}
