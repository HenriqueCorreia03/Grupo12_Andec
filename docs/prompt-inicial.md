# Prompt inicial

Somos uma equipa de estudantes a desenvolver uma aplicação web interna de
análise para o armazém de um fabricante de calçado (ISEP ANDEC/PROPL,
"Trabalho prático 3"). O enunciado do TP3 complementa o enunciado geral do
trabalho prático; se precisares de algo que só esteja no geral, pergunta-nos.

## Objetivo

Ajudar o diretor de operações a decidir, com base em evidência e não em
opiniões, entre duas alavancas de melhoria:

- (a) reorganizar as localizações de armazenagem;
- (b) alterar a forma como as ondas de picking são constituídas.

O dashboard deve mostrar qual das alavancas tem mais potencial e
fundamentar uma proposta de melhoria ou um teste operacional.

## Utilizador principal

Diretor de operações.

## Perguntas de negócio

Cada pergunta tem de apoiar uma decisão concreta. As decisões abaixo são o
nosso ponto de partida; desafia-as.

Gerais:

1. A procura está suficientemente concentrada (ABC) para justificar
   aproximar os artigos A das zonas mais acessíveis?
   → Decisão: avançar ou não com uma zona de acesso rápido para os artigos A.
2. Como varia a carga ao longo do dia, da semana e dos meses, e há picos que
   justifiquem regras de operação diferentes?
   → Decisão: usar ou não regras de constituição de ondas e de afetação de
   operadores diferentes por período.

Hipótese (a), localizações:

3. A classificação ABC é estável ao longo dos meses, ou os artigos mudam
   de classe (o que reduziria o valor de uma reorganização fixa)?
   → Decisão: reorganização única ou revisão periódica das localizações.
4. Quão dispersa é a recolha: por quantas localizações e zonas passa cada
   onda e cada pedido?
   → Decisão: que artigos e zonas reposicionar primeiro.

Hipótese (b), ondas:

5. As ondas saem cheias ou desaproveitadas, quantos pedidos são
   divididos entre várias ondas, e como evoluiu isso ao longo dos meses?
   → Decisão: mudar ou não a regra de capacidade e de divisão de pedidos.
6. Juntar pedidos criados no mesmo período reduziria o número de ondas ou
   a divisão de pedidos?
   → Decisão: que regra de agrupamento testar num teste operacional.

## Critérios de prioridade

O trabalho chama-se "Prioridades de operação" e o enunciado pede-nos que
definamos os critérios de prioridade. Ainda não os fechámos. Ajuda-nos a
decidir, por exemplo:

- que artigos reorganizar primeiro (unidades encomendadas, número de ondas
  em que aparecem, distância atual às zonas mais usadas);
- que ondas, períodos ou regras atacar primeiro (volume afetado, % de
  pedidos divididos, ocupação da onda);
- como comparar as duas alavancas entre si (impacto esperado vs. esforço e
  robustez da evidência).

## Indicadores

Mínimos (obrigatórios), com as definições que propomos confirmar na
especificação:

- **Classificação ABC de produtos por volume encomendado (classes A, B, C).**
  Fonte: `Customer_Order` (é o volume *encomendado*), em unidades. A decidir:
  limiares (ponto de partida 80/15/5 % das unidades), período de cálculo, e
  se o artigo é a referência ou a referência + tamanho.
- **Tamanho médio da encomenda:** unidades por pedido (pedido = `orderNumber`).
- **Pedidos médios por onda:** pedidos distintos por `waveNumber`.
- **Participação por setor:** % de unidades por `Sector`.
- **Pedidos multissetor:** % de pedidos com referências de setores distintos.

Os dois indicadores de setor mantêm-se no dashboard, porque são
obrigatórios. Como todos os produtos estão no setor "PF", dão sempre 100% e
0%: mostramo-los e explicamos esta limitação. A zona entra como indicador
adicional, não como substituto.

Adicionais (a validar e justificar na especificação):

- **Taxa de ocupação da onda:** unidades da onda ÷ capacidade de referência.
  A capacidade parece ser um alvo de 24 unidades, mas não é um limite rígido
  (ver análise preliminar). Apoia as perguntas 5 e 6.
- **% de pedidos divididos:** pedidos presentes em mais de uma onda ÷ total
  de pedidos. Apoia as perguntas 5 e 6.
- **Localizações distintas por onda:** medida real de dispersão da recolha
  (não é uma estimativa). Definir como tratar as localizações que não
  existem no `Storage_Location`. Apoia a pergunta 4.
- **Participação por zona e % de pedidos multizona:** zona = letra da
  localização (ex.: "I" em I-18-23), só para localizações que existem no
  `Storage_Location`; as restantes (ex.: `RC-01`) mostram-se à parte.
  Apoia as perguntas 1 e 4.
- **Estabilidade do ABC:** classe de cada artigo por mês e % de artigos que
  mudam de classe. Apoia as perguntas 1 e 3.

Mostrar distribuições (ex.: histogramas) e não apenas médias quando a
média esconder variação relevante (ex.: as unidades por pedido têm média
~7 mas mediana 2).

## Organização visual (ideia inicial, a desafiar)

Página principal com a visão geral e os indicadores mínimos, mais até três
subpáginas, por exemplo: artigos, ABC e localizações (alavanca a); ondas e
pedidos (alavanca b); qualidade dos dados e limitações.

## Contexto técnico

- Enunciado: `ENUNCIADO/Enunciado_3_Armazem_Calcado-20261116/Enunciado_03_Armazem_Calcado.pdf`
  (local, não está no Git).
- CSV originais em `data/` (nunca os alterar; não estão no Git). São
  grandes: nunca os leias inteiros. Lê só o cabeçalho e poucas linhas, e
  para contagens ou validações escreve e corre um script e mostra só o resumo.
- Stack: Next.js (`apps/frontend`), NestJS (`apps/backend`), PostgreSQL.
  Browser -> Next.js -> NestJS -> PostgreSQL. Todos os indicadores e
  filtros são calculados no servidor. ETL dos CSV reprodutível.
  Credenciais apenas em variáveis de ambiente (com um `.env.example` no repo).
- O repositório tem de ter instruções para executar tudo localmente:
  arrancar o PostgreSQL, correr o ETL, arrancar o backend e o frontend.

## Requisitos funcionais

Página principal + até 3 subpáginas com navegação; filtros dinâmicos
consistentes (produto, período, zona, operador, ...); comparação dos
indicadores ao longo do tempo; pelo menos um tooltip, um drill-down e um
drill-through; testes automatizados para os indicadores mínimos.

## Validação independente

O enunciado pede que validemos os cálculos e as interações de forma
independente. Para cada indicador mínimo, define connosco um exemplo
pequeno calculado à mão (ex.: 3 pedidos e 2 ondas), com o resultado
esperado, que passa a ser um teste de aceitação. Para as interações
(filtros, drill-down, drill-through), define verificações concretas que
possamos fazer manualmente.

## Problemas conhecidos nos dados (resolver na especificação)

- Todos os produtos estão no setor "PF" (com espaços a mais: `"PF      "`).
- `Product.csv` já traz um ABCCOD, mas o ABC tem de ser calculado por nós.
  Com limiares 80/15/5 sobre as unidades encomendadas, o nosso ABC coincide
  com o ABCCOD em apenas ~54% das referências: o ABCCOD usa outro critério
  ou período. Serve de contraste a explicar, não de verificação.
- Tamanhos: inteiros 1–16; códigos 35, 45 … 125 que significam 3,5 … 12,5
  (o `Picking_Wave` escreve 3.5 … 12.5); e uma segunda escala 215–305
  (a confirmar o que representa). 16 linhas do `Customer_Order` sem tamanho.
- `Customer_Order` tem 2559 linhas duplicadas (12 735 unidades) e 33
  quantidades a zero. Sem os duplicados, o total desce para 215 460
  unidades, quase igual às 215 192 do `Picking_Wave`; mas nesse caso 700
  ondas ficam com mais unidades no picking do que nas encomendas, o que
  sugere que alguns "duplicados" são linhas reais. Precisamos de uma regra
  explícita (afeta o ABC e as unidades por pedido).
- 77 ondas existem em `Customer_Order` (745 unidades) mas não em
  `Picking_Wave`.
- ~11% das unidades recolhidas (23 609) vêm de localizações que não existem
  no `Storage_Location`, quase todas `RC-01` (22 979 unidades, presente em
  2283 das 9707 ondas). `RC-01` também não está no
  `Support_Points_Navigation` (que só tem RC-08 a RC-17). Há ainda algumas
  como `C-102`, `ZN-COR`, `EX-11`, `K-26-20`. Confirmar o que são.
- Formatos: `;` na maioria dos ficheiros e `,` em `Storage_Location` e
  `Random_Storage`; células com `"ref;quantidade"` dentro dos ficheiros de
  políticas de armazenagem; BOM e fim de linha CRLF em vários ficheiros;
  `Support_Points_Navigation` separa linhas só com CR; valores com espaços a
  mais (setor, cliente, localização).
- Datas só de 5/1/2023 a 19/10/2023 (um único ano, ~9,5 meses): a
  comparação temporal é entre meses de 2023, sem comparação entre anos.
  Há 348 pedidos ao domingo, nenhum ao sábado, e um pequeno pico às 20h.
- `Class_Based_Storage` tem 317 referências, 109 das quais não existem em
  `Product` (relevante só para a simulação opcional).
- `Storage_Location`: a localização `K-23-40` tem z = 3, quando o padrão
  indica 4.

## Análise preliminar (confirmar antes de usar)

- 208 artigos, 32 634 pedidos, 588 clientes, 9784 ondas em `Customer_Order`
  (9707 em `Picking_Wave`), 2292 localizações nas zonas A–R.
- Ondas: mediana de 24 unidades, mas só 61% têm exatamente 24; o primeiro
  quartil é 23 e 1042 ondas têm mais de 24 (máximo 30). 24 parece um alvo,
  não um limite rígido.
- ~12% dos pedidos (4024) estão divididos entre ondas.
- ~38% das ondas (3751) têm um único pedido; média de ~4 pedidos por onda,
  máximo 24.
- 51 dos 208 artigos representam 80% das unidades encomendadas.
- Cada onda passa em média por ~11 localizações distintas (máx. 25).
- Nas localizações conhecidas, o picking concentra-se nas zonas H–P (a zona
  I tem ~19%); Q e R têm menos de 2% cada e as zonas A–G não aparecem no
  picking.
- Os pedidos são criados em lotes (picos às 7h, 11–12h e 15–16h);
  sexta-feira tem cerca de metade dos pedidos dos outros dias úteis.

## Restrições

- Indicar limitações em vez de inventar factos ou aproximar em silêncio.
- Nunca apresentar estimativas de desempenho (ex.: distâncias
  percorridas) como medições reais. Uma simulação de distâncias com as
  políticas de armazenagem (Random/Class-based/Dedicated/Hybrid) é uma
  extensão opcional e, se existir, deve ser claramente rotulada como
  estimativa.

## Como queremos trabalhar

Ainda estamos a perceber o domínio (picking, ondas, ABC, políticas de
armazenagem). Durante a entrevista, explica brevemente os conceitos
quando forem relevantes, desafia as nossas perguntas de negócio,
decisões, critérios de prioridade e indicadores, e propõe alternativas
quando os dados não os suportarem.

## Resultado esperado agora

NÃO escrevas código. Entrevista-nos com grill-with-docs até concordarmos
no que construir; depois corremos to-spec. Responde em português.
