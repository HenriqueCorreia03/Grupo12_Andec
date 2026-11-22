/**
 * Conteúdo estático versionado da página de qualidade (spec, "Further Notes"; ticket 13).
 * Tem de ficar igual às listas de `docs/spec.md` (sem a marcação de código): o teste
 * `qualidade-listas.e2e-spec.ts` compara-as. Se a spec mudar, atualize aqui.
 */

export const LIMITACOES_CONHECIDAS: readonly string[] = [
  'O PW não tem data nem número de pedido. A data vem da onda, e a ligação ao pedido é feita por onda + referência + tamanho, com repartição proporcional.',
  'Não há tempos de picking: o operador mede carga, não desempenho.',
  '77 ondas do CO não têm picking (745 un.).',
  '10 referências encomendadas nunca aparecem no PW (4 929 un. em ondas com picking), contadas à parte das 7 329 un. sem causa conhecida.',
  'Os duplicados do CO são tratados como linhas reais. A sensibilidade com/sem duplicados está disponível.',
  '6 093 linhas do CO (4,98 %) não têm correspondência no PW e ficam "sem zona".',
  'Setor sempre "PF": a participação por setor dá 100 % e os pedidos multissetor 0 %.',
  'Há pedidos ao domingo (5 dias, 348 pedidos) e um pico às 20h (337 pedidos em apenas 4 dias).',
  'Localizações não mapeadas (10,97 % das unidades recolhidas; RC-01 = 22 979 un.). O RC-01 conta como 1 localização, mas tem 155 referências, o que subestima a dispersão.',
  'A escala de tamanhos 215–305 é mantida sem interpretação.',
  'O operador atribuído (CO) e o operador recolhedor (PW) não coincidem sempre; o Operator_12 e o Operator_13 só existem no CO.',
  'Janeiro e outubro de 2023 são meses parciais.',
  'A ocupação usa 24 un. como capacidade de referência, que é um alvo e não um limite.',
];

export const PERGUNTAS_AO_DOCENTE: readonly string[] = [
  'O que é o RC-01?',
  'O que representa a escala de tamanhos 215–305?',
  'Qual é a origem e o critério do ABCCOD do Product?',
  'Qual é a causa das 7 329 un. recolhidas a menos sem causa conhecida?',
  'A localização K-23-40 tem z = 3, quando o padrão indica 4: é um erro?',
  'A capacidade da onda (24 un.) é um alvo ou um limite?',
  'Qual é a diferença entre operador atribuído e operador que recolheu (102 ondas diferem)?',
  'O que são C-102, ZN-COR, EX-11 e K-26-20 (e as restantes localizações não mapeadas)?',
  'Onde fica o ponto de partida/expedição? (Só é relevante se a distância voltar a entrar no âmbito.)',
];
