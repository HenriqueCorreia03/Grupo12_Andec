import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../db/database.module';
import { customerOrder, pickingWave, storageLocation } from '../db/schema';
import { type Filtros, pedidosQuePassam, pickingFiltrado, SEM_FILTROS, naoAplicaveis, selecionarLinhasCO } from './filtros';
import { atribuicaoPorLinha, ZONA_NAO_MAPEADA, ZONA_SEM_ZONA } from './ligacao';
import type { Metadados } from './metadados';

/** Localização que a spec mostra sempre em separado dentro das não mapeadas. */
const RC01 = 'RC-01';

export interface ParticipacaoPorZona extends Metadados {
  /** Unidades recolhidas em localizações mapeadas, por zona (por ordem decrescente de unidades). */
  zonas: { zona: string; unidades: number; percentagem: number }[];
  naoMapeadas: {
    unidades: number;
    /** % sobre o total recolhido (mapeadas + não mapeadas); nulo sem unidades recolhidas. */
    percentagem: number | null;
    /** Unidades do RC-01, em separado; está incluído em `unidades`. */
    rc01Unidades: number;
    localizacoes: { localizacao: string; unidades: number }[];
  };
}

/** Unidades encomendadas repartidas por zona através da ligação CO ↔ PW (spec, "Ligação CO ↔ PW"). */
export interface UnidadesEncomendadasPorZona extends Metadados {
  /** Zonas mapeadas com unidades atribuídas, por ordem decrescente (unidades fracionárias, sem arredondar). */
  zonas: { zona: string; unidades: number }[];
  /** Unidades atribuídas a localizações não mapeadas. */
  naoMapeada: number;
  /** Falta de picking e linhas sem chave (tamanho vazio, referência nunca recolhida, onda sem picking). */
  semZona: number;
  /** Soma das unidades encomendadas (zonas + não mapeada + sem zona). */
  total: number;
}

export interface PedidosMultizona extends Metadados {
  /** % de pedidos válidos com unidades em ≥ 2 zonas mapeadas; nulo sem pedidos ("sem dados"). */
  valor: number | null;
  pedidosMultizona: number;
  pedidosValidos: number;
}

export interface ZonasDoPicking {
  /** Zonas do filtro (a destacar); a repartição por zona mostra sempre todas as zonas. */
  zonasSelecionadas: string[];
  participacaoPorZona: ParticipacaoPorZona;
  unidadesEncomendadasPorZona: UnidadesEncomendadasPorZona;
  pedidosMultizona: PedidosMultizona;
}

@Injectable()
export class ZonasService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async zonas(filtros: Filtros = SEM_FILTROS): Promise<ZonasDoPicking> {
    // O filtro de zona destaca uma zona mas não esconde as outras: as repartições usam os restantes filtros.
    const todasAsZonas = { ...filtros, zona: null };
    const { rows } = await this.db.execute<{ localizacao: string; zona: string | null; unidades: number }>(sql`
      with ${pickingFiltrado(todasAsZonas)}
      select
        r.localizacao,
        case when s.location is not null then split_part(r.localizacao, '-', 1) end as zona,
        r.unidades
      from (
        select ${pickingWave.location} as localizacao, sum(${pickingWave.quantity})::int as unidades
        from ${pickingWave}
        group by ${pickingWave.location}
      ) r
      left join ${storageLocation} s on s.location = r.localizacao
    `);

    const porZona = new Map<string, number>();
    const naoMapeadas: { localizacao: string; unidades: number }[] = [];
    for (const { localizacao, zona, unidades } of rows) {
      if (zona === null) naoMapeadas.push({ localizacao, unidades });
      else porZona.set(zona, (porZona.get(zona) ?? 0) + unidades);
    }

    const unidadesMapeadas = [...porZona.values()].reduce((total, u) => total + u, 0);
    const unidadesNaoMapeadas = naoMapeadas.reduce((total, l) => total + l.unidades, 0);
    const totalRecolhido = unidadesMapeadas + unidadesNaoMapeadas;

    return {
      zonasSelecionadas: filtros.zona ?? [],
      unidadesEncomendadasPorZona: await this.unidadesEncomendadas(todasAsZonas),
      pedidosMultizona: await this.pedidosMultizona(filtros),
      participacaoPorZona: {
        zonas: [...porZona.entries()]
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .map(([zona, unidades]) => ({ zona, unidades, percentagem: (unidades * 100) / unidadesMapeadas })),
        naoMapeadas: {
          unidades: unidadesNaoMapeadas,
          percentagem: totalRecolhido === 0 ? null : (unidadesNaoMapeadas * 100) / totalRecolhido,
          rc01Unidades: naoMapeadas.find((l) => l.localizacao === RC01)?.unidades ?? 0,
          localizacoes: naoMapeadas.sort((a, b) => b.unidades - a.unidades || a.localizacao.localeCompare(b.localizacao)),
        },
        definicao:
          'Unidades recolhidas na zona ÷ unidades recolhidas em localizações mapeadas × 100. ' +
          'Localização mapeada = existe no Storage_Location; zona = prefixo antes do 1.º hífen. ' +
          'As não mapeadas ficam fora das percentagens por zona e aparecem à parte, com a % sobre o total recolhido (RC-01 em separado).',
        fonte: 'Picking_Wave + Storage_Location',
        filtrosNaoAplicaveis: naoAplicaveis(filtros, 'PW'),
        linhasConsideradas: totalRecolhido,
        exclusoes: [],
      },
    };
  }

  private async unidadesEncomendadas(filtros: Filtros): Promise<UnidadesEncomendadasPorZona> {
    const { rows } = await this.db.execute<{ zona: string; unidades: number; linhas: number }>(sql`
      select a.zona, sum(a.unidades)::float8 as unidades, count(*)::int as linhas
      from (${atribuicaoPorLinha()}) a
      where a.id in (select id from (${selecionarLinhasCO(filtros)}) as linhas)
      group by a.zona
    `);
    const zonas = rows
      .filter((r) => r.zona !== ZONA_NAO_MAPEADA && r.zona !== ZONA_SEM_ZONA)
      .map((r) => ({ zona: r.zona, unidades: r.unidades }))
      .sort((a, b) => b.unidades - a.unidades || a.zona.localeCompare(b.zona));
    const de = (zona: string) => rows.find((r) => r.zona === zona)?.unidades ?? 0;
    const total = rows.reduce((soma, r) => soma + r.unidades, 0);
    return {
      zonas,
      naoMapeada: de(ZONA_NAO_MAPEADA),
      semZona: de(ZONA_SEM_ZONA),
      total,
      definicao:
        'Unidades encomendadas repartidas por zona: para cada onda + referência + tamanho, o recolhido em cada zona ' +
        'reparte-se pelos pedidos proporcionalmente às unidades encomendadas. A falta de picking e as linhas sem ' +
        'correspondência no PW ficam "sem zona"; as localizações não mapeadas ficam "não mapeada".',
      fonte: 'Customer_Order + Picking_Wave + Storage_Location',
      filtrosNaoAplicaveis: naoAplicaveis(filtros, 'CO'),
      linhasConsideradas: rows.reduce((soma, r) => soma + r.linhas, 0),
      exclusoes: [],
    };
  }

  /** Multizona é uma propriedade do pedido: usa as zonas do pedido completo; os filtros só escolhem que pedidos entram. */
  private async pedidosMultizona(filtros: Filtros): Promise<PedidosMultizona> {
    const { rows } = await this.db.execute<{ multizona: number; validos: number; linhas: number }>(sql`
      with passam as (${pedidosQuePassam(filtros)}),
      por_pedido as (
        select
          l.order_number,
          count(distinct a.zona) filter (where a.zona not in (${ZONA_NAO_MAPEADA}, ${ZONA_SEM_ZONA})) as zonas,
          count(distinct l.id) as linhas
        from (${atribuicaoPorLinha()}) a
        join ${customerOrder} l on l.id = a.id
        where l.order_number in (select order_number from passam)
        group by l.order_number
      )
      select (count(*) filter (where zonas >= 2))::int as multizona, count(*)::int as validos, coalesce(sum(linhas), 0)::int as linhas
      from por_pedido
    `);
    const [r] = rows;
    return {
      valor: r.validos === 0 ? null : (r.multizona * 100) / r.validos,
      pedidosMultizona: r.multizona,
      pedidosValidos: r.validos,
      definicao:
        'Pedidos válidos com unidades atribuídas a ≥ 2 zonas mapeadas ÷ pedidos válidos × 100 (via ligação CO ↔ PW). ' +
        'A "não mapeada" e o "sem zona" não contam como zona.',
      fonte: 'Customer_Order + Picking_Wave + Storage_Location',
      filtrosNaoAplicaveis: naoAplicaveis(filtros, 'CO'),
      linhasConsideradas: r.linhas,
      exclusoes: [],
    };
  }
}
