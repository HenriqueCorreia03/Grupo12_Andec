import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

/**
 * Customer_Order tal como está no CSV: todas as colunas em texto, sem limpeza,
 * com o nº da linha de origem (1 = cabeçalho, por isso os dados começam na 2).
 */
export const rawCustomerOrder = pgTable('raw_customer_order', {
  sourceLine: integer('source_line').primaryKey(),
  codCustomer: text('cod_customer'),
  orderNumber: text('order_number'),
  orderToCollect: text('order_to_collect'),
  reference: text('reference'),
  size: text('size'),
  quantity: text('quantity'),
  creationDate: text('creation_date'),
  waveNumber: text('wave_number'),
  operator: text('operator'),
});

/** Customer_Order normalizado (regras de limpeza da spec). */
export const customerOrder = pgTable('customer_order', {
  id: serial('id').primaryKey(),
  sourceLine: integer('source_line').notNull(),
  customer: text('customer').notNull(),
  orderNumber: text('order_number').notNull(),
  orderToCollect: integer('order_to_collect').notNull(),
  reference: text('reference').notNull(),
  /** Tamanho normalizado (35…125 → 3,5…12,5); nulo quando vem vazio. */
  size: doublePrecision('size'),
  /** Escala 215–305: mantida tal como está, "escala por confirmar". */
  sizeScaleUnconfirmed: boolean('size_scale_unconfirmed').notNull(),
  /** Tamanho fora de todas as escalas conhecidas (mantido tal como está). */
  sizeOutOfKnownScales: boolean('size_out_of_known_scales').notNull().default(false),
  quantity: integer('quantity').notNull(),
  /** Hora local, sem fuso horário. */
  createdAt: timestamp('created_at', { mode: 'string' }).notNull(),
  waveNumber: text('wave_number').notNull(),
  operator: text('operator').notNull(),
  /** Linha idêntica (em todas as colunas) a uma linha anterior. Conta na mesma. */
  isDuplicate: boolean('is_duplicate').notNull(),
  /** Linha com 0 un.: não conta em nenhum indicador de pedido. */
  isZero: boolean('is_zero').notNull(),
});

/** Product tal como está no CSV (texto, com o nº da linha de origem). */
export const rawProduct = pgTable('raw_product', {
  sourceLine: integer('source_line').primaryKey(),
  reference: text('reference'),
  abccod: text('abccod'),
  sector: text('sector'),
});

/** Product normalizado: uma linha por referência, setor sem espaços. */
export const product = pgTable('product', {
  reference: text('reference').primaryKey(),
  sourceLine: integer('source_line').notNull(),
  abccod: text('abccod').notNull(),
  sector: text('sector').notNull(),
});
