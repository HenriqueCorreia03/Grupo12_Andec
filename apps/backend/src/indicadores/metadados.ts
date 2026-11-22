import type { Comparacao } from './comparacao.service';

/** Como um indicador se compara com o período anterior: volume por dia com atividade, rácio diretamente. */
export type NaturezaIndicador = 'volume' | 'rácio';

/** Linhas, pedidos ou ondas que ficaram fora de um indicador, com o motivo. */
export interface Exclusao {
  motivo: string;
  quantidade: number;
}

/** O que todos os indicadores devolvem para o tooltip (spec, "Contrato da API"). */
export interface Metadados {
  definicao: string;
  fonte: 'Customer_Order' | 'Customer_Order + Product' | 'Picking_Wave' | 'Picking_Wave + Storage_Location' | 'Customer_Order + Picking_Wave + Storage_Location';
  /** Linhas do CO que entram no cálculo. */
  linhasConsideradas: number;
  exclusoes: Exclusao[];
  /** Filtros pedidos que este indicador não consegue aplicar (por exemplo, o operador num indicador de encomenda). */
  filtrosNaoAplicaveis: string[];
  nota?: string;
  /**
   * Volume (contagens, unidades): compara-se com o período anterior por dia com atividade.
   * Rácio (por omissão): compara-se diretamente (spec, "Comparação no tempo").
   */
  natureza?: NaturezaIndicador;
  /** Comparação com o período anterior; juntada a todos os indicadores com valor único (ticket 08). */
  comparacao?: Comparacao;
}
