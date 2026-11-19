# Contexto do projeto TP3: Armazém de calçado (ANDEC/PROPL, ISEP × Deloitte)

Resumo para continuar o trabalho num chat novo. O prompt inicial completo
está em `docs/prompt-inicial.md` no repositório (anexar também).

## Como trabalhar neste chat

- Respondemos às perguntas do `grill-with-docs` (Claude Code no repositório).
  Um colega responde em paralelo noutra sessão e depois comparamos.
- **Antes de afirmar qualquer número ou facto sobre os dados, verifica-o nos
  CSV, incluindo casos-limite** (conjuntos completos e não só o primeiro
  valor, localizações que não existem no mapa, colunas que faltam num
  ficheiro). Diz de que ficheiro vem cada número.
- Responde em português (PT-PT). No fim de cada ronda, dá um bloco pronto a
  colar no grill.

## O projeto em poucas linhas

- Dashboard web (Next.js + NestJS + PostgreSQL) para o diretor de operações
  decidir entre **(a) reorganizar localizações** e **(b) mudar a constituição
  das ondas de picking**.
- Workflow: prompt inicial → `grill-with-docs` → `to-spec` → `to-tickets` →
  implementação TDD por ticket → `code-review` → verificação humana.
- Páginas (decidido): Visão geral; Artigos, ABC e localizações (a); Ondas e
  pedidos (b), com vista de detalhe da onda; Qualidade dos dados e
  limitações. **Máximo de 4 páginas** (principal + 3 subpáginas).
- Dados: CSV em `data/` (fora do Git): `Customer_Order`, `Picking_Wave`,
  `Product`, `Storage_Location`, `Support_Points_Navigation` e quatro
  ficheiros de políticas de armazenagem (Random, Class-based, Dedicated,
  Hybrid).

## Factos verificados nos dados

| Facto | Valor |
|---|---|
| Período | 5/1/2023 a 19/10/2023; dias com pedidos por mês variam entre 13 e 21 |
| Volume | 122 370 linhas, 32 634 pedidos, 588 clientes, 208 referências, 24 operadores |
| Ondas | 9784 no `Customer_Order`, 9707 no `Picking_Wave`; 77 só no `Customer_Order` (745 un.) |
| Picking vs encomendas | O picking nunca excede as encomendas; diferença total 13 003 un. (12 258 nas ondas com picking + 745 nas 77 ondas) |
| Duplicados | 2559 linhas duplicadas no `Customer_Order`; com duplicados o `Picking_Wave` bate em 777 de 782 casos, sem duplicados em 0 → são linhas reais |
| Unidades por onda | `Picking_Wave`: 61% com exatamente 24, máx. 30; `Customer_Order`: 74% com 24, máx. 192 (156 ondas > 30 un., mas o picking delas é ~24) |
| Ondas com um só pedido | 3751 (38%) |
| Pedidos divididos entre ondas | 4024 (~12%) |
| ABC | 51 das 208 referências = 80% das unidades encomendadas |
| Setor | Todas as referências são "PF" (indicadores de setor dão sempre 100% / 0%) |
| Zonas | Nas localizações conhecidas, ~99% das recolhas de artigos A são em H–P; zonas A–G não aparecem no picking |
| Dispersão dos A | Mediana de 55 localizações distintas por artigo A (mín. 15, máx. 175) |
| RC-01 | Não existe no `Storage_Location`; 22 979 un. (~11%), 2283 ondas, 155 referências (é uma área, não um sítio); 89% das unidades são de artigos A |
| SKUs | 84% dos SKUs (referência + tamanho) saem de mais de uma localização |
| Referências nunca recolhidas | 10 referências encomendadas nunca aparecem no `Picking_Wave` |
| Datas no picking | O `Picking_Wave` não tem data; cada onda tem pedidos de um único dia |
| Operadores | 88 ondas com vários operadores no `Picking_Wave` (só 1 no `Customer_Order`); 102 ondas com operadores diferentes entre ficheiros; Operator_12 e Operator_13 só no `Customer_Order` |
| Pedido ↔ localização | O `Picking_Wave` não tem número de pedido; ligar por onda + referência + tamanho: ~97–98% das linhas com correspondência ligam a uma só zona; ~5% das linhas do `Customer_Order` não têm correspondência |
| Tempos | Não há tempos de picking: não se mede produtividade; operador = carga, não desempenho |

## Decisões já respondidas ao grill

- **Q1** Matriz das duas alavancas: impacto × esforço × robustez, escala 1–3,
  justificação escrita. Impacto e robustez vêm de indicadores medidos com
  regra explícita; esforço é juízo qualitativo da equipa, assumido como tal.
  O dashboard mostra o "espaço de melhoria observado", nunca ganhos.
- **Q2** Prioridade dos artigos (a): sem distâncias. Critério principal =
  paragens (onda × localização); desempate = nº de localizações distintas
  por artigo.
- **Q3** Prioridade das ondas/períodos (b): nº absoluto de pedidos divididos
  por período, ocupação como segundo critério; comparações entre meses por
  dia com atividade.
- **Q4** Duplicados mantidos como linhas reais; sensibilidade com/sem
  duplicados na página de qualidade; investigar o resto da diferença.
- **Q5** ABC por referência; tamanhos só no drill-down; normalizar 35…125 →
  3,5…12,5; escala 215–305 como limitação (pergunta ao docente); não assumir
  uma localização por SKU.
- **Q6** ABC global (período completo, 80/15/5) como principal; ABC mensal
  para a estabilidade; janeiro e outubro assinalados como parciais, não
  excluídos; mínimo de unidades por mês para evitar ruído.
- **Q7** Pergunta 1 reformulada: "os artigos A estão concentrados em poucas
  localizações ou espalhados por muitas, e que papel tem o RC-01?". Decisão:
  consolidar os A em menos localizações e/ou criar ou alargar uma zona de
  acesso rápido.
- **Q8** Fonte por indicador: ABC, unidades por pedido, setor, pedidos por
  onda e pedidos divididos no `Customer_Order`; ocupação da onda,
  localizações, paragens, zonas e dispersão no `Picking_Wave`. Cada
  indicador indica a fonte na legenda. Pedido ao grill: mostrar o cálculo
  das "7 329 un. por explicar".
- **Q9** Localizações não mapeadas (RC-01 e outras): contam como paragens e
  localizações distintas, ficam fora da % por zona, aparecem sempre como
  "não mapeada"; RC-01 como área (subestima a dispersão), registado como
  limitação.
- **Q10** Filtros ao nível da linha, com aviso visível. Período = data de
  criação (no picking, via data da onda). Operador = quem recolheu
  (`Picking_Wave`) nos indicadores de picking; "operador atribuído" ou filtro
  desativado nos de encomenda. Zona via ligação onda + referência + tamanho,
  com regra para ligações a várias zonas e unidades não recolhidas "sem
  zona". Classe ABC do filtro = classe global, fixa.
- **Q11** Quatro páginas. Tooltip com definição, fonte, valor, variação face
  ao período anterior e linhas excluídas. Drill-down ABC → classe →
  referência → tamanhos. Drill-through leva a outra das 4 páginas com o
  contexto (ex.: onda → "Ondas e pedidos" filtrada nessa onda), sem 5.ª
  página. Comparação mensal por dia com atividade.
- **Resto do âmbito (proposto):** exemplo à mão = uma onda real com 2–3
  pedidos e os 5 indicadores mínimos em Excel, como teste de aceitação;
  verificações das interações no formato "faço X → espero ver Y";
  simulação de distâncias fora do âmbito desta versão (opcional, rotulada
  como estimativa).

## Perguntas ao docente

- O que é o RC-01 (e `C-102`, `ZN-COR`, `EX-11`, `K-26-20`)?
- O que representa a escala de tamanhos 215–305?

## Próximo passo

Continuar as rondas do `grill-with-docs` até fechar o âmbito, depois
`to-spec` (especificação em `docs/`) e `to-tickets`.
