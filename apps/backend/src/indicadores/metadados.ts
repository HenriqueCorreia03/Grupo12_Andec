/** Linhas, pedidos ou ondas que ficaram fora de um indicador, com o motivo. */
export interface Exclusao {
  motivo: string;
  quantidade: number;
}

/** O que todos os indicadores devolvem para o tooltip (spec, "Contrato da API"). */
export interface Metadados {
  definicao: string;
  fonte: 'Customer_Order' | 'Customer_Order + Product' | 'Picking_Wave' | 'Picking_Wave + Storage_Location';
  /** Linhas do CO que entram no cálculo. */
  linhasConsideradas: number;
  exclusoes: Exclusao[];
  nota?: string;
}
