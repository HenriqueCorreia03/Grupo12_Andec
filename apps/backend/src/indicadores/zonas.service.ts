import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../db/database.module';
import { pickingWave, storageLocation } from '../db/schema';
import { type Filtros, pickingFiltrado, SEM_FILTROS } from './filtros';
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

export interface ZonasDoPicking {
  participacaoPorZona: ParticipacaoPorZona;
}

@Injectable()
export class ZonasService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async zonas(filtros: Filtros = SEM_FILTROS): Promise<ZonasDoPicking> {
    const { rows } = await this.db.execute<{ localizacao: string; zona: string | null; unidades: number }>(sql`
      with ${pickingFiltrado(filtros)}
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
        linhasConsideradas: totalRecolhido,
        exclusoes: [],
      },
    };
  }
}
