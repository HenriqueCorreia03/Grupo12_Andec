import { BadRequestException } from '@nestjs/common';
import { sql, type SQL } from 'drizzle-orm';
import { customerOrder, pickingWave, storageLocation } from '../db/schema';
import { abcGlobal, CLASSES_ABC, type ClasseAbc } from './abc';
import { atribuicaoPorLinha } from './ligacao';

/**
 * Filtros globais comuns a todos os endpoints (ticket 06a; spec, "Filtros").
 * Parâmetros desconhecidos são ignorados.
 *
 * Regra única (spec, "Propriedades das entidades e filtros"): as medidas aditivas (unidades, linhas, paragens)
 * usam só as linhas que passam os filtros; as propriedades de uma entidade (pedido dividido, multissetor,
 * ocupação da onda) calculam-se com a entidade completa. O filtro decide só que entidades entram: as que têm
 * pelo menos uma linha que passa.
 */
export interface Filtros {
  /** Primeiro dia do período (aaaa-mm-dd, inclusivo); nulo = sem limite. */
  inicio: string | null;
  /** Último dia do período (aaaa-mm-dd, inclusivo); nulo = sem limite. */
  fim: string | null;
  referencia: string | null;
  /** Classe ABC **global** (do histórico completo, fixa), nunca recalculada no período. */
  classe: ClasseAbc | null;
  /** Operador recolhedor (PW). Só se aplica aos indicadores de picking; nos de encomenda é "não aplicável". */
  operador: string | null;
  /**
   * Zonas (prefixo da localização mapeada), uma ou várias (`zona=K,O`). Na encomenda, conta a parte das unidades
   * atribuída a essas zonas pela ligação CO ↔ PW (um pedido entra se tiver mais de 0 un. em qualquer uma delas);
   * no picking, a zona da localização recolhida.
   */
  zona: string[] | null;
  /** Onda: aplica-se ao CO e ao PW (a chave comum). */
  onda: string | null;
  /** Pedido: só existe no CO; nos indicadores de picking é "não aplicável" (o PW não tem número de pedido). */
  pedido: string | null;
  /**
   * Sensibilidade aos duplicados (ticket 17): `com` (regra principal: as linhas idênticas do CO contam como reais)
   * ou `sem` (retira as linhas marcadas como duplicadas no ETL). Só mexe no CO; o picking não tem duplicados.
   */
  duplicados: 'com' | 'sem';
}

export const SEM_FILTROS: Filtros = {
  inicio: null,
  fim: null,
  referencia: null,
  classe: null,
  operador: null,
  zona: null,
  onda: null,
  pedido: null,
  duplicados: 'com',
};

/** Os filtros que cada origem de dados não consegue aplicar (a API devolve-os junto de cada indicador). */
export function naoAplicaveis(filtros: Filtros, origem: 'CO' | 'PW'): string[] {
  const lista: string[] = [];
  if (origem === 'CO' && filtros.operador !== null) lista.push('operador');
  if (origem === 'PW' && filtros.pedido !== null) lista.push('pedido');
  return lista;
}

/**
 * Todos os filtros ativos, pelo nome que a interface mostra. Para o que é sempre calculado sobre o dataset
 * completo (página de qualidade, matriz das alavancas): qualquer filtro ativo é "não aplicável".
 */
export function filtrosAtivos(filtros: Filtros): string[] {
  const ativos: [string, boolean][] = [
    ['período', filtros.inicio !== null || filtros.fim !== null],
    ['referência', filtros.referencia !== null],
    ['classe ABC', filtros.classe !== null],
    ['operador', filtros.operador !== null],
    ['zona', filtros.zona !== null],
    ['onda', filtros.onda !== null],
    ['pedido', filtros.pedido !== null],
    ['sem duplicados', filtros.duplicados === 'sem'],
  ];
  return ativos.filter(([, ativo]) => ativo).map(([nome]) => nome);
}

/**
 * Lê e valida os parâmetros de filtro da query string; qualquer erro é um 400 com mensagem clara.
 * - `inicio` e `fim` (aaaa-mm-dd) vêm sempre juntos; sem nenhum, é todo o histórico.
 * - `mes=aaaa-mm` equivale a `inicio` e `fim` desse mês e não se combina com eles.
 * - `classe` é A, B ou C. `duplicados` é com (omissão) ou sem. Parâmetros desconhecidos são ignorados.
 */
export function lerFiltros(query: Record<string, unknown>): Filtros {
  const inicio = texto(query, 'inicio');
  const fim = texto(query, 'fim');
  const mes = texto(query, 'mes');
  const referencia = texto(query, 'referencia');
  const classe = texto(query, 'classe');
  const operador = texto(query, 'operador');
  const zona = listaDeZonas(texto(query, 'zona'));
  const onda = texto(query, 'onda');
  const pedido = texto(query, 'pedido');
  const duplicados = texto(query, 'duplicados') ?? 'com';

  if (classe !== null && !(CLASSES_ABC as string[]).includes(classe)) {
    throw new BadRequestException(`Classe ABC inválida "${classe}" (use A, B ou C).`);
  }
  if (duplicados !== 'com' && duplicados !== 'sem') {
    throw new BadRequestException(`Valor inválido para duplicados "${duplicados}" (use com ou sem).`);
  }
  const outros = { referencia, classe: classe as ClasseAbc | null, operador, zona, onda, pedido, duplicados: duplicados as 'com' | 'sem' };

  if (mes !== null) {
    if (inicio !== null || fim !== null) {
      throw new BadRequestException('Use mes ou inicio e fim, não os dois.');
    }
    return { ...periodoDoMes(mes), ...outros };
  }
  if ((inicio === null) !== (fim === null)) {
    throw new BadRequestException('Os parâmetros inicio e fim têm de vir juntos.');
  }
  if (inicio !== null && fim !== null) {
    validarData('inicio', inicio);
    validarData('fim', fim);
    if (inicio > fim) {
      throw new BadRequestException(`A data inicio (${inicio}) é posterior à data fim (${fim}).`);
    }
  }
  return { inicio, fim, ...outros };
}

/** `K,O` → ["K", "O"] (sem repetições, pela ordem pedida); um elemento vazio é um erro. */
function listaDeZonas(valor: string | null): string[] | null {
  if (valor === null) return null;
  const zonas = valor.split(',').map((z) => z.trim());
  if (zonas.some((z) => z === '')) {
    throw new BadRequestException(`Zona inválida "${valor}" (use uma ou várias zonas separadas por vírgulas, por exemplo K,O).`);
  }
  return [...new Set(zonas)];
}

/** Valor de um parâmetro; nulo se ausente ou vazio. Um parâmetro repetido ou composto é um erro. */
function texto(query: Record<string, unknown>, nome: string): string | null {
  const valor = query[nome];
  if (valor === undefined || valor === '') return null;
  if (typeof valor !== 'string') {
    throw new BadRequestException(`O parâmetro "${nome}" está repetido ou tem um formato inválido.`);
  }
  return valor;
}

/** Data aaaa-mm-dd que existe no calendário (por exemplo, 30 de fevereiro não existe). */
function validarData(nome: string, valor: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw new BadRequestException(`Formato inválido em "${nome}": "${valor}" (use aaaa-mm-dd).`);
  }
  const [ano, mes, dia] = valor.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) {
    throw new BadRequestException(`Data inválida em "${nome}": ${valor}.`);
  }
}

/** Primeiro e último dia do mês `aaaa-mm`. */
function periodoDoMes(mes: string): { inicio: string; fim: string } {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
    throw new BadRequestException(`Mês inválido "${mes}" (use aaaa-mm).`);
  }
  const [ano, mesNumero] = mes.split('-').map(Number);
  const ultimoDia = new Date(Date.UTC(ano, mesNumero, 0)).getUTCDate();
  return { inicio: `${mes}-01`, fim: `${mes}-${String(ultimoDia).padStart(2, '0')}` };
}

/** `('K', 'O')` como parâmetros SQL. */
function listaSql(valores: string[]): SQL {
  return sql.join(valores.map((v) => sql`${v}`), sql`, `);
}

/** Linhas do CO que cumprem os filtros (medidas aditivas: unidades, linhas). */
export function selecionarLinhasCO(filtros: Filtros): SQL {
  if (filtros.zona === null) {
    return sql`select * from ${customerOrder} as base where ${condicoesCO(filtros, sql`base`)}`;
  }
  // Com filtro de zona só ficam as linhas com mais de 0 un. atribuídas à zona, e `quantity` passa a ser essa parte.
  return sql`
    select
      base.id, base.source_line, base.customer, base.order_number, base.order_to_collect, base.reference, base.size,
      base.size_scale_unconfirmed, base.size_out_of_known_scales, z.unidades as quantity, base.created_at,
      base.wave_number, base.operator, base.is_duplicate, base.is_zero
    from ${customerOrder} as base
    join (
      select id, sum(unidades) as unidades from (${atribuicaoPorLinha()}) a where a.zona in (${listaSql(filtros.zona)}) group by id
    ) z on z.id = base.id
    where z.unidades > 0 and ${condicoesCO(filtros, sql`base`)}
  `;
}

/**
 * CTE com o nome `customer_order`: dentro da consulta, a tabela passa a ser só as linhas do CO que cumprem
 * os filtros. Usa-se como `with ${linhasFiltradas(f)}, outra as (...)`. Para propriedades de um pedido
 * (por exemplo, multissetor) usa `pedidosQuePassam()` e a tabela real, que dá o pedido completo.
 */
export function linhasFiltradas(filtros: Filtros): SQL {
  return sql`customer_order as (${selecionarLinhasCO(filtros)})`;
}

/** Pedidos com pelo menos uma linha que cumpre os filtros: as entidades que entram nos indicadores de pedido. */
export function pedidosQuePassam(filtros: Filtros): SQL {
  return sql`select distinct order_number from (${selecionarLinhasCO(filtros)}) as linhas`;
}

/** Linhas do PW que cumprem os filtros (o período é a data da onda, vinda do CO). */
export function selecionarLinhasPicking(filtros: Filtros): SQL {
  return sql`select * from ${pickingWave} as base where ${condicoesPicking(filtros, sql`base`)}`;
}

/** CTE com o nome `picking_wave`, só com as linhas do PW que cumprem os filtros (medidas aditivas). */
export function pickingFiltrado(filtros: Filtros): SQL {
  return sql`picking_wave as (${selecionarLinhasPicking(filtros)})`;
}

/** Referências da classe ABC global (histórico completo, fixa). */
function referenciasDaClasse(classe: ClasseAbc): SQL {
  return sql`select referencia from (${abcGlobal()}) as global where classe = ${classe}`;
}

/**
 * Condições (unidas por AND) que uma linha do CO tem de cumprir; `true` sem filtros.
 * O período é pela data de criação do pedido, em hora local (a coluna não tem fuso):
 * de `inicio` às 00:00 até ao fim do dia `fim` (exclusivo do dia seguinte às 00:00).
 * A classe global usa o CO completo: dentro de um CTE com o nome da tabela, `customer_order` é a tabela real.
 */
function condicoesCO(filtros: Filtros, alias: SQL): SQL {
  const condicoes: SQL[] = [];
  if (filtros.inicio !== null) condicoes.push(sql`${alias}.created_at >= ${filtros.inicio}::date`);
  if (filtros.fim !== null) condicoes.push(sql`${alias}.created_at < (${filtros.fim}::date + 1)`);
  if (filtros.referencia !== null) condicoes.push(sql`${alias}.reference = ${filtros.referencia}`);
  if (filtros.classe !== null) condicoes.push(sql`${alias}.reference in (${referenciasDaClasse(filtros.classe)})`);
  if (filtros.onda !== null) condicoes.push(sql`${alias}.wave_number = ${filtros.onda}`);
  if (filtros.pedido !== null) condicoes.push(sql`${alias}.order_number = ${filtros.pedido}`);
  if (filtros.duplicados === 'sem') condicoes.push(sql`not ${alias}.is_duplicate`);
  return condicoes.length === 0 ? sql`true` : sql.join(condicoes, sql` and `);
}

/**
 * Condições de uma linha do PW. O período é a data da onda (a data dos seus pedidos no CO): uma onda sem
 * pedidos no CO não tem data e fica de fora quando há período.
 */
function condicoesPicking(filtros: Filtros, alias: SQL): SQL {
  const condicoes: SQL[] = [];
  if (filtros.inicio !== null || filtros.fim !== null) {
    const limites: SQL[] = [];
    if (filtros.inicio !== null) limites.push(sql`min(created_at) >= ${filtros.inicio}::date`);
    if (filtros.fim !== null) limites.push(sql`min(created_at) < (${filtros.fim}::date + 1)`);
    condicoes.push(
      sql`${alias}.wave_number in (
        select wave_number from ${customerOrder} group by wave_number having ${sql.join(limites, sql` and `)}
      )`,
    );
  }
  if (filtros.referencia !== null) condicoes.push(sql`${alias}.reference = ${filtros.referencia}`);
  if (filtros.classe !== null) condicoes.push(sql`${alias}.reference in (${referenciasDaClasse(filtros.classe)})`);
  if (filtros.operador !== null) condicoes.push(sql`${alias}.operator = ${filtros.operador}`);
  if (filtros.zona !== null) {
    condicoes.push(
      sql`${alias}.location in (select location from ${storageLocation} where split_part(location, '-', 1) in (${listaSql(filtros.zona)}))`,
    );
  }
  if (filtros.onda !== null) condicoes.push(sql`${alias}.wave_number = ${filtros.onda}`);
  return condicoes.length === 0 ? sql`true` : sql.join(condicoes, sql` and `);
}
