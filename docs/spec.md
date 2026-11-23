# Especificação: Dashboard de prioridades de operação do armazém de calçado

**Estado:** draft — a confirmar pela equipa (passa a `ready-for-agent` depois de aprovada)
**Projeto:** TP3 ANDEC/PROPL 2026/2027 (ISEP × Deloitte)
**Origem:** prompt inicial, entrevista `grill-with-docs` (Q1–Q15) e ronda de fecho de 19/11/2026.
**Versões (a confirmar pelo docente):** Node.js 24 LTS; PostgreSQL na versão estável atual.

Convenções:
- "CO" designa o ficheiro `Customer_Order` e "PW" o ficheiro `Picking_Wave`.
- Os números de referência do dataset completo foram calculados em 19/11/2026, com um script sobre os CSV originais e com as regras desta especificação.

---

## Problem Statement

O diretor de operações de um fabricante de calçado sente que a preparação de encomendas no armazém se tornou mais exigente. A equipa divide-se entre duas alavancas de melhoria:

- (a) reorganizar as localizações de armazenagem;
- (b) mudar a forma como as ondas de picking são constituídas.

O diretor quer decidir com base em evidência e não em opiniões.

Não há orçamento para Power BI. Os dados existem, mas estão espalhados por vários CSV com formatos inconsistentes, duplicados, localizações que não constam do mapa e ficheiros que não se ligam diretamente:

- o PW não tem data nem número de pedido;
- o CO não tem localização.

Hoje não há forma fiável de saber qual das alavancas tem mais espaço de melhoria, nem por onde começar.

## Solution

Uma aplicação web interna (Next.js → NestJS → PostgreSQL) com um dashboard interativo de 4 páginas. O dashboard:

- mostra os 5 indicadores mínimos e os indicadores adicionais, todos calculados no servidor a partir dos CSV, carregados por um ETL reprodutível;
- mostra, para cada alavanca, o **espaço de melhoria observado** (nunca ganhos esperados nem estimativas apresentadas como medições);
- compara as duas alavancas numa matriz impacto × esforço × robustez da evidência;
- ordena o que atacar primeiro: que artigos reposicionar e que períodos ou ondas rever;
- permite filtrar de forma consistente por período, referência, classe ABC, zona e operador;
- compara meses entre si por dia com atividade;
- torna visíveis os problemas dos dados e as limitações, numa página própria.

### Utilizador principal

Diretor de operações.

### Perguntas de negócio e decisões que apoiam

| # | Pergunta | Decisão apoiada | Alavanca |
|---|---|---|---|
| P1 | Os artigos A estão concentrados em poucas localizações ou espalhados por muitas, e que papel tem o RC-01? | Consolidar os artigos A em menos localizações e/ou criar ou alargar uma zona de acesso rápido. | (a) |
| P2 | Como varia a carga (pedidos, unidades, ondas) ao longo do dia, da semana e dos meses, e há picos que justifiquem regras de operação diferentes? | Usar ou não regras de constituição de ondas e de afetação de operadores diferentes por período. | geral |
| P3 | A classificação ABC é estável ao longo dos meses, ou os artigos mudam de classe? | Reorganização única ou revisão periódica das localizações. | (a) |
| P4 | Quão dispersa é a recolha: por quantas localizações e zonas passa cada onda e cada artigo? | Que artigos e zonas reposicionar primeiro. | (a) |
| P5 | As ondas saem cheias ou desaproveitadas, quantos pedidos são divididos entre várias ondas, e como evoluiu isso ao longo dos meses? | Mudar ou não a regra de capacidade e de divisão de pedidos. | (b) |
| P6 (extra) | Quantas ondas incompletas (menos de 24 un.) foram criadas no mesmo dia e na mesma hora que outras ondas incompletas, e quantos pedidos divididos envolvem essas ondas? (observação medida, não simulação) | Que regra de agrupamento testar num teste operacional. | (b) |

### Critérios de prioridade

1. **Comparação das duas alavancas: matriz impacto × esforço × robustez**, cada critério com escala de 1 a 3 e justificação escrita.
   - **Impacto** e **robustez** são calculados a partir de indicadores medidos, com as regras explícitas abaixo.
   - **Esforço** é um juízo qualitativo da equipa e é rotulado como tal na interface.
   - A matriz mostra potencial observado, nunca ganho esperado.

   Medidas e limiares propostos (a rever pela equipa):

   | Critério | Medida (a) | Medida (b) | 1 | 2 | 3 |
   |---|---|---|---|---|---|
   | Impacto (espaço de melhoria) | % das paragens de artigos A feitas fora das 3 localizações mais usadas desse artigo | % dos pedidos válidos divididos com ≤ 24 un. (divisões evitáveis) | < 10 % | 10–30 % | ≥ 30 % |
   | Robustez | % das unidades recolhidas em localizações mapeadas | % das linhas do CO com correspondência no PW (onda + referência + tamanho) | < 85 % | 85–95 % | ≥ 95 % |
   | Esforço | juízo da equipa (texto + nota) | juízo da equipa (texto + nota) | alto | médio | baixo |

   Definições do impacto:
   - **Impacto (a).** Uma paragem de artigo é um trio distinto (referência, onda, localização). Para cada artigo A, as suas localizações ordenam-se por nº de paragens (decrescente), depois por unidades recolhidas (decrescente) e depois por código (crescente). As 3 primeiras são as "mais usadas". As localizações não mapeadas (por exemplo, o RC-01) entram no ranking como qualquer outra.
   - **Impacto (b).** Pedidos válidos em mais de uma onda e com total ≤ 24 un. ÷ pedidos válidos.

   Os valores de impacto e robustez são calculados pelo backend e nunca escritos à mão. A nota e a justificação do esforço vêm de um ficheiro de configuração versionado no repositório, carregado pelo ETL.

   Valores de referência no dataset completo:
   - **impacto (a) = 72,15 %** (59 551 de 82 535 paragens de artigos A; 49 artigos A com picking). Sensibilidade: fora da localização mais usada = 89,17 %; fora das 5 mais usadas = 57,84 %. O RC-01 está entre as 3 mais usadas de 10 dos 49 artigos A.
   - **impacto (b) = 7,74 %** (2 526 de 32 632 pedidos válidos; 29 684 un., 13,01 % das unidades).
   - **robustez (a) = 89,03 %** (23 609 de 215 192 un. recolhidas em localizações não mapeadas).
   - **robustez (b) = 95,02 %** (6 093 de 122 370 linhas do CO sem correspondência). ⚠ Fica apenas 0,02 pontos acima do limiar dos 95 %: a nota 3 é frágil, e a página da matriz mostra este aviso ao lado da nota.

   Matriz resultante (esforço ainda por preencher pela equipa):

   | Alavanca | Impacto | Robustez | Esforço |
   |---|---|---|---|
   | (a) Reorganizar localizações | **3** (72,15 %) | **2** (89,03 %) | juízo da equipa |
   | (b) Constituição das ondas | **1** (7,74 %) | **3** (95,02 %, colado ao limiar) | juízo da equipa |

   Leitura: (a) tem muito mais espaço de melhoria observado, mas com evidência menos robusta, por causa das localizações não mapeadas. (b) tem pouco espaço evitável, com evidência mais robusta.

2. **Prioridade dos artigos (alavanca a).**
   - Ordenação principal: nº de paragens (pares distintos onda × localização em que o artigo é recolhido), por ordem decrescente.
   - Desempate: nº de localizações distintas de onde o artigo sai, por ordem decrescente; a seguir, o código da referência por ordem crescente.
   - Não se usam distâncias.

3. **Prioridade das ondas, períodos e regras (alavanca b).**
   - Ordenação principal: nº absoluto de pedidos divididos por período (mês, dia da semana, hora).
   - Segundo critério: ocupação média das ondas do período, por ordem crescente.
   - Nas comparações entre meses, os valores são por dia com atividade.

---

## User Stories

Cada história está marcada como **essencial** (entra na primeira versão) ou **extra** (só depois das essenciais estarem feitas e verificadas).

### Visão geral e decisão

1. **[essencial]** Como diretor de operações, quero ver os 5 indicadores mínimos numa única página, para ter o retrato da operação num relance.
2. **[essencial]** Como diretor de operações, quero ver a matriz impacto × esforço × robustez das duas alavancas, para saber qual tem mais espaço de melhoria observado.
3. **[essencial]** Como diretor de operações, quero que cada nota da matriz tenha uma justificação escrita e a medida que lhe deu origem, para poder defender a decisão.
4. **[essencial]** Como diretor de operações, quero que o esforço apareça rotulado como juízo da equipa, para não o confundir com uma medição.
5. **[essencial]** Como diretor de operações, quero ver a evolução mensal dos indicadores por dia com atividade, para comparar meses com números de dias úteis diferentes.
6. **[essencial]** Como diretor de operações, quero que janeiro e outubro de 2023 apareçam assinalados como meses parciais, para não tirar conclusões erradas.
7. **[essencial]** Como diretor de operações, quero que nenhum valor seja apresentado como ganho esperado, para não tomar decisões com base em estimativas disfarçadas.

### ABC e artigos (alavanca a)

8. **[essencial]** Como diretor de operações, quero ver a classificação ABC das referências por unidades encomendadas, para saber quão concentrada é a procura.
9. **[essencial]** Como diretor de operações, quero ver quantas referências e que percentagem das unidades cabem em cada classe, para avaliar a concentração.
10. **[essencial]** Como diretor de operações, quero clicar numa classe e ver as referências dessa classe, para descer ao detalhe (drill-down).
11. **[essencial]** Como diretor de operações, quero clicar numa referência e ver as unidades por tamanho, para perceber o perfil dessa referência.
12. **[extra]** Como diretor de operações, quero comparar a classe ABC calculada com o ABCCOD do ficheiro de produtos, para perceber que o ABCCOD usa outro critério.
13. **[essencial]** Como diretor de operações, quero ver a classe ABC de cada referência mês a mês e a % de referências que mudam de classe entre meses consecutivos, para decidir entre reorganização única e revisão periódica.
14. **[extra]** Como diretor de operações, quero ver como a estabilidade do ABC muda com o limiar mínimo de unidades (5/10/20) e quantas combinações referência-mês ficam de fora, para avaliar a robustez dessa conclusão.
15. **[essencial]** Como diretor de operações, quero ver as referências ordenadas pelo critério de prioridade da alavanca (a), para saber que artigos reposicionar primeiro.
16. **[essencial]** Como diretor de operações, quero ver de quantas localizações distintas sai cada artigo A, para avaliar a dispersão.
17. **[essencial]** Como diretor de operações, quero ver a participação de cada zona nas unidades recolhidas, para saber onde se concentra o picking.
18. **[essencial]** Como diretor de operações, quero ver as unidades recolhidas em localizações não mapeadas (RC-01 em separado), para perceber o peso dessa área.
19. **[essencial]** Como diretor de operações, quero ver a % de pedidos multizona, para avaliar se os pedidos obrigam a percorrer várias zonas.
20. **[essencial]** Como diretor de operações, quero ver o nº de localizações distintas e de paragens por onda, para medir a dispersão real da recolha.

### Ondas e pedidos (alavanca b)

21. **[essencial]** Como diretor de operações, quero ver o tamanho médio da encomenda e a sua distribuição, para perceber que a média (6,99) esconde uma mediana de 2.
22. **[essencial]** Como diretor de operações, quero ver o nº médio de pedidos por onda e a distribuição, para perceber quantas ondas têm um único pedido.
23. **[essencial]** Como diretor de operações, quero ver a ocupação das ondas face à capacidade de referência de 24 un., para saber se as ondas saem desaproveitadas.
24. **[essencial]** Como diretor de operações, quero ver a % e o nº de pedidos divididos entre ondas, separando os pedidos com mais de 24 un., para distinguir divisões inevitáveis de divisões evitáveis.
25. **[essencial]** Como diretor de operações, quero ver os pedidos divididos por mês, dia da semana e hora, ordenados pelo critério de prioridade da alavanca (b), para saber que períodos atacar primeiro.
26. **[extra]** Como diretor de operações, quero ver as ondas incompletas criadas na mesma hora que outras ondas incompletas, para escolher que regra de agrupamento testar.
27. **[essencial]** Como diretor de operações, quero clicar numa onda num gráfico e abrir a página "Ondas e pedidos" já filtrada por essa onda (drill-through), para ver os pedidos, as linhas e as localizações dessa onda.
28. **[essencial]** Como diretor de operações, quero ver a carga por hora do dia e por dia da semana, com os domingos assinalados, para avaliar se há picos que justifiquem regras por período.
29. **[essencial]** Como diretor de operações, quero ver a carga por operador (unidades e ondas recolhidas), com a indicação de que não é desempenho, para não a confundir com produtividade.

### Filtros e consistência

30. **[essencial]** Como diretor de operações, quero filtrar por período (intervalo de datas ou mês), para analisar um período específico.
31. **[essencial]** Como diretor de operações, quero filtrar por referência, para ver o efeito de um artigo.
32. **[essencial]** Como diretor de operações, quero filtrar por classe ABC global, para analisar só os artigos A, B ou C.
33. **[essencial]** Como diretor de operações, quero filtrar por zona, para analisar uma zona do armazém.
34. **[essencial]** Como diretor de operações, quero filtrar por operador nos indicadores de picking, para ver a carga de cada operador.
35. **[essencial]** Como diretor de operações, quero que os filtros se apliquem a todos os elementos da página e se mantenham ao mudar de página, para comparar sempre a mesma seleção.
36. **[essencial]** Como diretor de operações, quero um aviso visível quando um filtro não se aplica a um indicador (por exemplo, o operador nos indicadores de encomenda), para não ler um valor sem filtro como se estivesse filtrado.
37. **[essencial]** Como diretor de operações, quero ver "sem dados" em vez de 0 ou de um erro quando o filtro não deixa nenhuma linha, para não confundir ausência de dados com zero.
38. **[essencial]** Como diretor de operações, quero ver, ao filtrar por período, a classe ABC no período ao lado da classe global, com rótulos claros, para não confundir as duas.

### Tooltip e comparação no tempo

39. **[essencial]** Como diretor de operações, quero passar o rato por um indicador e ver a definição, a fonte (CO ou PW), o valor, a variação face ao período anterior e as linhas excluídas, para confiar no número.
40. **[essencial]** Como diretor de operações, quero que o período anterior seja o intervalo com a mesma duração imediatamente antes, comparado por dia com atividade, para ter uma comparação justa.
41. **[essencial]** Como diretor de operações, quero ver "sem período anterior" quando o período anterior cai antes do início dos dados, para não comparar com um vazio.

### Qualidade dos dados e limitações

42. **[extra]** Como diretor de operações, quero ver o ABC e o tamanho médio da encomenda com e sem as linhas duplicadas, para avaliar a sensibilidade a essa regra.
43. **[essencial]** Como diretor de operações, quero ver a diferença entre unidades encomendadas e recolhidas decomposta por causa, para saber o que está explicado e o que não está.
44. **[essencial]** Como diretor de operações, quero ver a lista de localizações não mapeadas com as unidades de cada uma, para avaliar o seu peso.
45. **[essencial]** Como diretor de operações, quero ver as linhas com tamanho vazio, as linhas e os pedidos com 0 un., os pedidos excluídos e as linhas sem correspondência no picking, para conhecer as exclusões.
46. **[essencial]** Como diretor de operações, quero ver a % de ligações repartidas por várias zonas, para avaliar a ligação entre encomendas e localizações.
47. **[extra]** Como diretor de operações, quero ver as ondas com vários operadores e as ondas com operadores diferentes entre ficheiros, para perceber a limitação do filtro de operador.
48. **[essencial]** Como diretor de operações, quero ver a lista de limitações conhecidas e a lista de perguntas ao docente, separadas, para saber o que ainda falta confirmar.
49. **[essencial]** Como diretor de operações, quero ver que os indicadores de setor dão sempre 100 % / 0 % e porquê, para perceber esta limitação dos dados.

### Equipa de desenvolvimento

50. **[essencial]** Como membro da equipa, quero carregar os CSV para o PostgreSQL com um único comando idempotente, para reproduzir a base de dados em qualquer máquina.
51. **[essencial]** Como membro da equipa, quero que o ETL nunca altere os CSV originais, para cumprir o enunciado.
52. **[essencial]** Como membro da equipa, quero configurar credenciais e caminhos apenas por variáveis de ambiente a partir de um `.env.example`, para não haver segredos no código.
53. **[essencial]** Como membro da equipa, quero um README passo a passo para Windows (instalar o PostgreSQL, criar a base de dados da aplicação, a base de dados de teste e o utilizador, configurar o `.env`, correr o ETL, arrancar o backend e o frontend, correr os testes), para pôr a aplicação a correr localmente.
54. **[essencial]** Como membro da equipa, quero testes automatizados dos indicadores mínimos sobre fixtures com resultados calculados à mão, para validar os cálculos de forma independente.
55. **[essencial]** Como membro da equipa, quero uma lista de verificações manuais "faço X → espero ver Y", para validar as interações de forma independente.

---

## Implementation Decisions

### Arquitetura

- Fluxo: browser → Next.js (frontend) → NestJS (backend, API HTTP) → PostgreSQL.
- O browser nunca lê os CSV nem acede à base de dados.
- Todos os indicadores, filtros, repartições e classificações são calculados no servidor (backend e/ou SQL). O frontend só apresenta os valores.
- Credenciais e configuração ficam só em variáveis de ambiente: `DATABASE_URL`, `DATA_DIR`, uma variável para a base de dados de teste e, no frontend, o URL da API. O repositório tem um `.env.example` com valores de exemplo; os `.env` reais ficam fora do Git.
- O PostgreSQL é instalado localmente no Windows com o instalador oficial, sem Docker.
- O README explica, passo a passo:
  1. instalar o PostgreSQL;
  2. criar a base de dados da aplicação e a base de dados de teste, e o utilizador com acesso às duas;
  3. copiar o `.env.example` para `.env` e preencher `DATABASE_URL`, o URL da base de dados de teste e `DATA_DIR`;
  4. correr `npm run etl`;
  5. arrancar o backend e o frontend;
  6. correr os testes.
- ORM, biblioteca de gráficos e componentes de interface ficam por escolher no primeiro ticket técnico. Têm de respeitar esta especificação.

### Módulos do backend (módulos profundos, interface pequena)

1. **ETL**
   - Comando único `npm run etl`, idempotente: apaga e recarrega tudo dentro de uma transação.
   - Lê os CSV da pasta indicada por `DATA_DIR` e escreve tabelas brutas (fiéis ao CSV, com o nº da linha de origem) e tabelas normalizadas.
   - Os CSV originais nunca são alterados.
   - Carrega apenas `Customer_Order`, `Picking_Wave`, `Product` e `Storage_Location`, mais o ficheiro de configuração do esforço da matriz. `Support_Points_Navigation` e os 4 ficheiros de políticas de armazenagem não são carregados nesta versão (só seriam úteis para a simulação de distâncias, que está fora do âmbito).
2. **Indicadores**
   - Uma interface: recebe um pedido com filtros e devolve os valores, os metadados (definição, fonte, linhas excluídas, avisos de filtro não aplicável) e a comparação com o período anterior.
   - Esconde a limpeza, as ligações, a repartição por zonas e o ABC.
3. **Qualidade dos dados**
   - Contagens de exclusões, sensibilidade dos duplicados, decomposição de "recolhido < encomendado", localizações não mapeadas e divergências de operador.
   - As listas de limitações e de perguntas ao docente são conteúdo estático versionado.

### Regras de limpeza (ETL)

- **Formatos.**
  - Separador `;` no CO, PW e `Product`; `,` no `Storage_Location`.
  - O ETL tem de usar um leitor de CSV que respeite aspas, nunca uma divisão simples pelo separador. O `Storage_Location` tem campos entre aspas com vírgulas dentro (por exemplo, `"368, 0, 1"` na coluna `position`).
  - Remover o BOM; aceitar fins de linha CRLF e CR.
  - Remover espaços à esquerda e à direita em todos os campos de texto (setor `"PF      "`, cliente, localização).
- **Datas.** `creationDate` no formato `dd/mm/aaaa hh:mm`, hora local, sem fuso horário. Período dos dados: 05/01/2023 07:42 a 19/10/2023 07:18.
- **Tamanhos.**
  - Normalizar para número decimal.
  - No CO, os códigos 35, 45, …, 125 passam a 3,5 … 12,5. O PW já escreve 3.5 … 12.5.
  - Os inteiros 1–16 ficam iguais.
  - A escala 215–305 fica tal como está, marcada como "escala por confirmar". Existe nos dois ficheiros: 2 703 linhas no CO e 13 380 no PW.
  - Qualquer outro valor fica tal como está e é marcado como "fora das escalas conhecidas", para ser contado na página de qualidade (decidido no ticket 01; 0 linhas no dataset completo).
  - Tamanho vazio (16 linhas no CO) = `nulo`. A linha conta nas unidades e no ABC, mas não liga ao PW.
- **Duplicados no CO.** As linhas idênticas em todas as colunas são linhas reais e contam todas (2 559 linhas duplicadas). O ETL marca-as, para a sensibilidade "sem duplicados" na página de qualidade.
- **PW: 1 linha = 1 unidade.** As 215 192 linhas têm quantidade 1, e 102 201 são idênticas a outra. Nenhuma regra de duplicados se aplica ao PW.
- **Quantidades a zero no CO** (33 linhas, em 3 pedidos):
  - as linhas com 0 un. não contam em nenhum indicador de pedido;
  - um **pedido válido** é um pedido com total > 0 un. (32 632 dos 32 634);
  - os pedidos com 0 un. (2) ficam fora de todos os denominadores de pedidos e são contados na página de qualidade.
- **Setor.** Vem do `Product`, depois de remover os espaços. As 208 referências são todas "PF".
- **Localizações e zonas.**
  - Uma localização é **mapeada** se existe no `Storage_Location` (2 292 localizações, zonas A–R).
  - Zona = prefixo antes do primeiro hífen, só para localizações mapeadas.
  - Todas as outras (RC-01, RC-03, RC-04, RC-05, C-102, ZN-COR, EX-11, K-26-20, G-25-10, etc.) são **não mapeadas**: contam como paragens e como localizações distintas, ficam fora das percentagens por zona e aparecem sempre como "não mapeada", com o RC-01 em separado.
  - O RC-01 conta como 1 localização, mas é uma área com 155 referências: subestima a dispersão (limitação).
- **Data da onda.** Cada onda tem pedidos de um único dia (verificado). A data da onda é a data dos seus pedidos, e a hora da onda é a hora de criação mais antiga dos seus pedidos. O PW herda a data da onda pelo `waveNumber`.
- **Operadores.**
  - Operador recolhedor = operador do PW (por linha).
  - Operador atribuído = operador do CO.
  - Os dois não coincidem sempre: há ondas com vários operadores no PW, e o Operator_12 e o Operator_13 só existem no CO.

### Ligação CO ↔ PW (zona das unidades encomendadas)

- Chave: onda + referência + tamanho normalizado.
- Para cada chave, o recolhido em cada localização reparte-se pelos pedidos da chave **proporcionalmente às unidades encomendadas** de cada pedido.
- A parte encomendada e não recolhida (falta de picking) reparte-se da mesma forma e fica **"sem zona"**.
- As linhas do CO sem chave correspondente (tamanho vazio, referência nunca recolhida, onda sem picking) ficam inteiras "sem zona".
- As unidades atribuídas a localizações não mapeadas ficam "não mapeada".
- Arredondar só na apresentação, nunca nos cálculos.
- Com filtro de zona, um pedido conta nessa zona se tiver mais de 0 un. atribuídas a ela.
- No dataset completo há 5 661 chaves com mais de um pedido, e em 654 delas foi recolhido menos do que o encomendado (2 087 un.). Não há chaves com recolhido > encomendado, nem chaves do PW sem correspondência no CO.

### Indicadores mínimos

| Indicador | Definição e fórmula | Fonte | Unidade | Casos-limite |
|---|---|---|---|---|
| **Classificação ABC** | Unidades encomendadas por referência (linhas > 0 de pedidos válidos). Ordenar por unidades (decrescente) e, em caso de empate, por código da referência (crescente, ordem de caracteres). Acumulado *antes* da referência = soma das referências anteriores ÷ total. **A** se acumulado antes < 80 %; **B** se < 95 %; **C** no resto. A referência que atravessa um limiar fica na classe superior. | CO | classe por referência; nº de referências e % de unidades por classe | Duplicados contam. Tamanho vazio conta. Referências sem unidades no período não são classificadas nesse período ("sem procura no período"). O ABCCOD do `Product` é só contraste, não verificação. |
| **Tamanho médio da encomenda** | Σ unidades ÷ nº de pedidos válidos. Mostrar também mediana, p90 e histograma. Mediana e p90 são calculados sobre o total de unidades de cada pedido válido, com o **método contínuo** (`percentile_cont` no PostgreSQL), o mesmo das funções MEDIANA e PERCENTIL.INC do Excel. | CO | unidades/pedido | Pedidos com 0 un. fora. Com filtros: unidades das linhas que passam ÷ pedidos com > 0 un. nessas linhas. |
| **Pedidos médios por onda** | Média, sobre as ondas, do nº de pedidos válidos distintos com linhas > 0 na onda. Um pedido dividido conta em cada onda onde aparece. Mostrar mediana e nº de ondas com 1 pedido. | CO | pedidos/onda | Inclui as 77 ondas sem picking, com nota no tooltip: "universo de ondas = CO; a ocupação usa o PW". |
| **Participação por setor** | Unidades do setor ÷ unidades totais × 100. | CO + `Product` | % | Nos dados reais dá sempre PF = 100 %; a limitação é explicada. |
| **Pedidos multissetor** | Pedidos válidos com referências (linhas > 0) de ≥ 2 setores ÷ pedidos válidos × 100. | CO + `Product` | % | Nos dados reais dá sempre 0 %; testado com um 2.º setor na fixture sintética. |

Valores de referência no dataset completo, sem filtros:

| Indicador | Valor |
|---|---|
| ABC | A = 51, B = 49, C = 108 referências (80,47 % / 14,61 % / 4,93 % das unidades) |
| Tamanho médio | 6,993 un./pedido (228 195 ÷ 32 632); mediana 2; p90 13; máximo 2 400 |
| Pedidos por onda | 4,07 (9 784 ondas); mediana 3; 3 751 ondas com 1 pedido; máximo 24 |
| Setor | PF = 100 % |
| Multissetor | 0 % |
| Coincidência ABC ↔ ABCCOD (extra) | 112 de 208 (53,8 %) |

### Indicadores adicionais

| Indicador | Definição e fórmula | Fonte | Unidade | Justificação (perguntas) | Prioridade |
|---|---|---|---|---|---|
| **Ocupação da onda** | Unidades recolhidas na onda ÷ 24 × 100 (capacidade de referência, que é um alvo e não um limite). Mostrar média, distribuição, % de ondas com exatamente 24 e ondas com > 24. | PW | % | P5, P6. Referência no dataset completo: média 92,37 %; 61,0 % das ondas com 24; 1 042 com > 24; máximo 30; mínimo 1. | essencial |
| **Pedidos divididos** | Pedidos válidos presentes em > 1 onda ÷ pedidos válidos × 100, mais o nº absoluto. Separar os pedidos com > 24 un. (divisão inevitável com o alvo de 24) dos pedidos com ≤ 24 un. (evitáveis; é o impacto (b) da matriz). | CO | %, nº | P5, P6. Referência: 4 023 de 32 632 (12,33 %); 1 497 com > 24 un.; 2 526 com ≤ 24 un. (7,74 % dos pedidos válidos). | essencial |
| **Paragens** | Pares distintos (onda, localização). | PW | nº | Critério de prioridade (a). Referência: 103 706. | essencial |
| **Localizações distintas por onda** | Nº de localizações distintas por onda; média, mediana e distribuição. | PW | localizações/onda | P4. Referência: média 10,68; mediana 11; máximo 25. | essencial |
| **Localizações distintas por artigo** | Nº de localizações distintas de onde sai a referência. | PW | localizações | P1, P4, desempate (a). | essencial |
| **Participação por zona** | Unidades recolhidas na zona ÷ unidades recolhidas em localizações mapeadas × 100. As unidades não mapeadas aparecem à parte, com a % sobre o total recolhido. | PW | % | P1, P4. Referência: a zona I tem 18,94 %; Q e R menos de 2 % cada; não mapeadas = 10,97 % do total recolhido. | essencial |
| **Pedidos multizona** | Pedidos válidos com unidades atribuídas a ≥ 2 zonas mapeadas ÷ pedidos válidos × 100 (via ligação CO ↔ PW). | CO + PW | % | P1, P4. | essencial |
| **Estabilidade do ABC** | ABC mensal independente (mesma regra, sobre as unidades de cada mês). % de referências que mudam de classe entre meses consecutivos. Ficam de fora do denominador as combinações referência-mês com menos de 10 un. Sensibilidade para 5, 10 e 20 un., com o nº e a % de combinações excluídas. | CO | % | P3. | essencial (a sensibilidade 5/10/20 é extra) |
| **Carga por período** | Pedidos, unidades e ondas por hora, dia da semana e mês; por dia com atividade. | CO (pedidos), PW via data da onda (ondas, unidades recolhidas) | nº/dia com atividade | P2. | essencial |
| **Ondas incompletas simultâneas** | Ondas com < 24 un. recolhidas criadas no mesmo dia e na mesma hora (hora da onda) que pelo menos outra onda com < 24 un.; nº dessas ondas e nº de pedidos divididos que envolvem. | PW + CO | nº | P6. Referência: 2 745 ondas do PW (28,3 %) têm < 24 un. | extra |
| **Carga por operador** | Unidades e ondas recolhidas por operador recolhedor. Rotulado como "carga, não desempenho". | PW | un., ondas | P2. | essencial |
| **Recolhido vs encomendado** | Diferença decomposta, por esta ordem: (1) unidades em ondas sem picking; (2) unidades de referências nunca recolhidas, em ondas com picking; (3) resto, "sem causa conhecida". | CO, PW | un. | Qualidade. Referência: 13 003 = 745 + 4 929 + 7 329. | essencial |

Outros elementos extra, fora das tabelas de indicadores: comparação ABC ↔ ABCCOD; alternador com/sem duplicados na página de qualidade; secção de divergências de operador. A P6 é uma pergunta de negócio extra: as perguntas essenciais (P1–P5) já cumprem o mínimo de três pedido no enunciado.

### Propriedades das entidades e filtros

- **Medidas aditivas** (unidades, linhas, paragens, localizações) usam só as linhas que passam os filtros.
- **Propriedades de entidade** são calculadas sempre sobre a entidade completa:
  - pedido dividido;
  - pedido multissetor ou multizona;
  - ocupação da onda;
  - classe ABC global.
  
  Os filtros decidem que entidades entram no denominador: entra uma entidade com ≥ 1 linha que passa os filtros. Assim, filtrar uma onda não faz um pedido dividido parecer não dividido.

### Filtros

**Filtros globais** (painel comum às 4 páginas, persistidos no URL e mantidos entre páginas):

| Filtro | Semântica | Indicadores de encomenda (CO) | Indicadores de picking (PW) |
|---|---|---|---|
| Período (intervalo de datas ou mês) | Data de criação do pedido | direto | via data da onda |
| Referência | Linhas da referência | direto | direto |
| Classe ABC | Classe **global** do período completo, fixa | direto | direto |
| Zona | Zona via ligação CO ↔ PW (unidades repartidas) | conta a parte atribuída à zona | zona da localização recolhida |
| Operador | Operador recolhedor (PW) | **desativado**, com aviso "filtro não aplicável" | direto |

**Filtros específicos de página:**
- "Ondas e pedidos": onda (é o destino do drill-through) e pedido.
- "Artigos, ABC e localizações": tamanho, e localização mapeada / não mapeada.
- "Qualidade": alternador "com / sem duplicados".

**Regras de consistência:**
- Os mesmos filtros aplicam-se a todos os gráficos e cartões da página.
- O painel mostra sempre os filtros ativos.
- Cada indicador mostra um aviso quando algum filtro não se lhe aplica.
- Seleção sem linhas → "sem dados".
- O gráfico do ABC recalcula-se no período filtrado e rotula "classe no período". O filtro de classe usa sempre a "classe global", e as duas aparecem lado a lado na tabela de referências.

### Comparação no tempo

- Série mensal (janeiro–outubro de 2023) por dia com atividade. **Dia com atividade** = dia com ≥ 1 pedido criado (178 dias; entre 13 e 21 por mês), domingos incluídos e assinalados.
- Para os indicadores de picking, o dia com atividade é o mesmo, via data da onda.
- Janeiro e outubro são assinalados como meses parciais.
- **Período anterior** = intervalo com a mesma duração imediatamente antes; com um mês selecionado, o mês anterior.
  - Os indicadores de volume comparam-se por dia com atividade. Os rácios (por exemplo, unidades por pedido, ocupação) comparam-se diretamente.
  - Se o período anterior começar antes da data mínima dos dados carregados (05/01/2023 no dataset real), mostra "sem período anterior". Com um mês selecionado, o mês conta como unidade: o mês anterior só falha se for anterior ao mês da data mínima (por isso, no dataset real, fevereiro compara com janeiro parcial e janeiro fica "sem período anterior"; na fixture 4, março compara com fevereiro). Com um intervalo de datas, a regra aplica-se dia a dia (um intervalo que cubra exatamente um mês civil é tratado como esse mês). Sem filtro de período também se mostra "sem período anterior".
  - A variação é (atual − anterior) ÷ anterior × 100; de 0 para 0 é 0 %; sem dados num dos lados, ou de 0 para outro valor, não há variação. Os indicadores sem um valor único (participação por setor, classes ABC) não têm variação.
  - A série mensal aplica todos os filtros (com um mês escolhido mostra só esse mês); as ondas recolhidas vêm do PW pela data da onda. Um mês só em parte coberto pelos dados ou pelo período fica assinalado como parcial.

### Páginas (máximo 4: principal + 3 subpáginas)

**Princípio: resumo primeiro, detalhe a pedido** (ticket 19). Cada página abre com o que importa para o negócio, em poucos números fáceis de ler, e só mostra o detalhe quando o diretor o pede.

- **Ordem fixa das secções em todas as páginas:** (1) faixa de KPI; (2) um gráfico ou resumo visual que explique o principal; (3) detalhe.
- **Primeiro ecrã (1366 × 768, sem scroll):** veem-se a faixa de KPI e o início do resumo visual, sem nenhuma tabela longa aberta. Na Qualidade o resumo cabe inteiro; na Visão geral, em Artigos e em Ondas o resumo começa no fim do primeiro ecrã (cabeçalho e filtros ocupam ~170 px e duas linhas de KPI ~300 px). Decidido não reduzir mais o tamanho do texto, para os números continuarem fáceis de ler (ticket 19).
- **Faixa de KPI:** 3 a 6 cartões no topo, logo a seguir ao título, com o valor principal de cada indicador e o tooltip (definição, fonte, comparação, exclusões). Cada cartão tem uma **leitura de uma linha**, montada só com valores da API (por exemplo, "51 artigos A, 49 com picking"); não há conclusões escritas à mão, que deixariam de ser verdade quando os filtros mudam.
- **Regra das 10 linhas:** qualquer tabela com mais de 10 linhas mostra as 10 primeiras, pela ordem do indicador, e um botão "Ver todas (N)" que a abre por inteiro. Se a linha escolhida (por exemplo, a referência do drill-down) estiver fora das primeiras, a tabela abre já inteira. A lista de ondas, que pode ter milhares de linhas, só é montada por inteiro quando se pede (`ondas=todas` no URL).
- **Detalhe técnico recolhido:** grelhas e decomposições que servem para auditar (grelha referência × mês da estabilidade, listas de localizações não mapeadas, justificações da matriz, linhas de uma onda) ficam num bloco "Ver detalhe" fechado por omissão. Dentro de um "Ver detalhe" a tabela mostra logo todas as linhas, para o detalhe ficar a um só clique.
- **Nada se perde:** todos os valores continuam acessíveis, no máximo a um clique; os filtros aplicam-se a tudo; o drill-down do ABC continua a funcionar.
- **Cores de bom/mau só onde há limiares:** as notas da matriz das alavancas (3 = melhor, pelos limiares desta spec) ficam a verde (3), amarelo (2) e vermelho (1), sempre com o número e uma palavra ao lado. Os outros KPI não têm meta definida e ficam sem cor até a equipa decidir e registar os limiares (ticket 20).

Ordem de cada página:

| Página | (1) KPI | (2) Resumo visual | (3) Detalhe |
|---|---|---|---|
| Visão geral | Tamanho médio; pedidos por onda; volume por dia com atividade; participação por setor; multissetor; ABC | Matriz das duas alavancas (justificações recolhidas) | Série mensal |
| Artigos, ABC e localizações | Artigos A; % das unidades na classe A; estabilidade do ABC; não mapeadas; multizona | Seletor de classes A/B/C (refs e % das unidades) | Referências do ABC e tamanhos; prioridade; estabilidade (grelha recolhida); ABC ↔ ABCCOD; zonas |
| Ondas e pedidos | Pedidos divididos; ocupação; paragens; localizações por onda; ondas incompletas simultâneas | Detalhe da onda (com filtro de onda); gráfico de ocupação | Lista de ondas; divididos e carga por período; carga por operador |
| Qualidade dos dados | Encomendado não recolhido; sem correspondência; não mapeadas; duplicados; ligações repartidas | Barra da decomposição de "recolhido < encomendado" | Contagens; não mapeadas (lista recolhida); ligação e tamanhos; limitações; perguntas ao docente |

1. **Visão geral**
   - Os 5 indicadores mínimos.
   - A matriz das duas alavancas, com justificações.
   - A série mensal por dia com atividade.
   - Ligações para as outras páginas.
2. **Artigos, ABC e localizações (alavanca a)**
   - ABC, com drill-down classe → referência → tamanhos.
   - Comparação com o ABCCOD.
   - Estabilidade mensal, com sensibilidade.
   - Ranking de prioridade dos artigos.
   - Localizações por artigo, participação por zona, não mapeadas (RC-01 em separado), multizona.
3. **Ondas e pedidos (alavanca b)**
   - Distribuição do tamanho da encomenda.
   - Pedidos por onda; ocupação; pedidos divididos (inevitáveis vs ≤ 24 un.) por período, com o ranking de prioridade.
   - Ondas incompletas simultâneas; carga por período e por operador.
   - Vista de detalhe da onda (pedidos, linhas, localizações, zonas, operadores) quando há filtro de onda.
4. **Qualidade dos dados e limitações**
   - Exclusões e contagens; sensibilidade dos duplicados; decomposição de "recolhido < encomendado".
   - Localizações não mapeadas; % de ligações repartidas; divergências de operador.
   - Escala de tamanhos 215–305.
   - Lista de limitações conhecidas e lista de perguntas ao docente.

### Interações obrigatórias (exemplos)

- **Tooltip** (em todos os cartões de indicador): definição; fonte (CO / PW); valor; variação face ao período anterior (ou "sem período anterior"); nº de linhas excluídas e motivo.
- **Drill-down:** ABC → classe → referência → tamanhos, na página 2.
- **Drill-through:** clicar numa onda (no gráfico de ocupação ou na lista de ondas) abre a página "Ondas e pedidos" com o filtro dessa onda e os filtros globais mantidos. Não é criada uma 5.ª página.

### Contrato da API (forma, não código)

- Todos os endpoints recebem os mesmos parâmetros de filtro: período (início, fim), referência, classe ABC, zona, operador, onda e pedido.
- Cada indicador devolve: valor; valor do período anterior ou indicação de que não existe; definição; fonte; nº de linhas consideradas e excluídas por motivo; lista dos filtros não aplicáveis.
- Endpoints agrupados por página: visão geral; artigos/ABC/localizações; ondas e pedidos (incluindo o detalhe da onda); qualidade.
- Valores numéricos sem arredondamento. O frontend arredonda: 2 casas nas percentagens, 2 casas nos rácios.

---

## Testing Decisions

### O que é um bom teste aqui

- Testa só o comportamento externo, numa **única fronteira de teste: a API HTTP do backend** (confirmada pela equipa).
- Cada teste:
  1. escreve os CSV de uma fixture numa pasta temporária;
  2. corre o mesmo ETL de produção (`npm run etl` com `DATA_DIR` a apontar para essa pasta) sobre a **base de dados de teste separada**;
  3. chama os endpoints com filtros;
  4. compara o JSON com os valores esperados, calculados à mão (cada fixture tem uma folha de Excel com o cálculo).
- Assim, num só teste ficam cobertos o ETL, a limpeza, as ligações, os filtros e as fórmulas.
- Não se testam funções internas, nomes de tabelas nem SQL. Comparações numéricas com tolerância de 1e-9 (os valores esperados têm mais casas do que as que a interface mostra).
- Framework: Jest. Não há testes anteriores no repositório; estes são os primeiros.
- As interações do frontend são validadas com as verificações manuais abaixo, sem testes automáticos de frontend.

### Fixture 1: onda 33444 (real)

Composição: as 5 linhas do CO da onda 33444; as 7 linhas do PW dessa onda; as referências AHR20O e Q50W5L do `Product`; as localizações K-07-23, K-03-13, K-05-21 e K-08-22 do `Storage_Location`.

Dados: 10/01/2023 11:05; Operator_8 nos dois ficheiros; pedidos 90412 (2 un.), 90413 (3 un.) e 90414 (2 un.); 7 un. encomendadas = 7 recolhidas.

| Verificação | Esperado |
|---|---|
| Tamanho médio | 7 ÷ 3 = 2,3333… |
| Mediana; p90 do tamanho (método contínuo) | 2; 2,8 (totais por pedido 2, 2, 3 → 2 + 0,8 × (3 − 2)) |
| Pedidos por onda | 3 |
| Setor | PF = 100 % |
| Multissetor | 0 % (0 de 3) |
| Pedidos divididos | 0 % |
| Ocupação | 7 ÷ 24 = 29,1667 % |
| Paragens; localizações distintas | 4; 4 |
| Zonas | K = 100 %; não mapeadas = 0 |
| Normalização de tamanho | CO 95 → 9,5 liga ao PW 9.5 (K-05-21, 2 un.) |
| Ligação partilhada | AHR20O tam. 12: encomendado 1 (90412) + 1 (90413); recolhido 2 em K-07-23 → 1 un. em K para cada pedido |
| ABC (na fixture) | AHR20O 5 un. (antes 0 %) → A; Q50W5L 2 un. (antes 71,43 % < 80 %) → A |
| Filtro referência Q50W5L | 2 un.; 1 pedido (90413); tamanho médio 2 |
| Filtro zona H | "sem dados" |

### Fixture 2: ABC sintético com 2.º setor

Composição (dados inventados):
- Referências SYN01, SYN02, SYN03 no setor "PF"; SYN04, SYN05, SYN06 no setor "SX" (2.º setor só nesta fixture).
- Unidades: SYN01 = 50, SYN02 = 25, SYN03 = 10, SYN04 = 10 (empate com SYN03), SYN05 = 4, SYN06 = 1 (total 100).
- Pedidos: P-A (onda W-A) = SYN01 50; P-B (onda W-B) = SYN02 25 + SYN04 10; P-C (onda W-B) = SYN03 10 + SYN05 4 + SYN06 1.
- Mesma data, mesmo tamanho. PW só com o cabeçalho.

| Verificação | Esperado |
|---|---|
| ABC | SYN01 A (antes 0 %); SYN02 A (antes 50 %); **SYN03 A** (antes 75 %, atravessa 80 % → fica em A; ganha o empate a SYN04 pelo código); **SYN04 B** (antes 85 %); **SYN05 C** (antes exatamente 95 % → não é < 95 %); SYN06 C |
| Nº de referências / % de unidades por classe | A = 3 / 85 %; B = 1 / 10 %; C = 2 / 5 % |
| Setor | PF = 85 %; SX = 15 % |
| Multissetor | 2 de 3 = 66,6667 % |
| Tamanho médio | 100 ÷ 3 = 33,3333… |
| Pedidos por onda | (1 + 2) ÷ 2 = 1,5 |
| Indicadores de picking | "sem dados"; 2 ondas sem picking (100 un.) na página de qualidade |

### Fixture 3: pedido dividido, ondas 35678 e 35679 (real)

Composição: as 8 linhas do CO das ondas 35678 e 35679; as 47 linhas do PW dessas ondas; as referências D05ZS7, QXS5D1 e 05W6TK; as localizações J-09-23, K-04-23, K-04-13, O-10-23 e K-06-12.

Dados: 16/03/2023 06:34; Operator_17 nos dois ficheiros. Pedido 100146 (4 un., só na onda 35678). Pedido 100147 (43 un.: 20 na onda 35678 e 23 na 35679). Encomendado = recolhido = 47.

| Verificação | Esperado |
|---|---|
| Tamanho médio | 47 ÷ 2 = 23,5 |
| Pedidos por onda | (2 + 1) ÷ 2 = 1,5 |
| Pedidos divididos | 1 de 2 = 50 % (100147); com ≤ 24 un.: 0 |
| Ocupação | 35678: 24 ÷ 24 = 100 %; 35679: 23 ÷ 24 = 95,8333 %; média 97,9167 % |
| Paragens | 6 (K-04-13 aparece nas duas ondas e conta 2 vezes) |
| Localizações distintas por onda | 4 e 2 (média 3); distintas no total: 5 |
| Zonas (47 un. recolhidas) | K = 43 (91,4894 %); O = 3 (6,3830 %); J = 1 (2,1277 %) |
| Multizona | 1 de 2 = 50 % (100146: zonas O e J) |
| ABC (na fixture) | D05ZS7 A (antes 0 %); QXS5D1 B (antes 91,49 %); 05W6TK C (antes 97,87 %) |
| Normalização | 85 → 8,5; 125 → 12,5 |
| Filtro onda 35679 | 1 pedido; 23 un.; ocupação 95,8333 %; o 100147 continua "dividido" (propriedade da entidade) |

### Fixture 4: casos difíceis (sintética)

Composição (dados inventados):
- Referências D1, D2, D3 e D4, todas com setor `"PF      "` (com espaços).
- `Storage_Location` só com K-01-01.
- Cliente com espaços à direita.
- Ondas: W10 em 02/02/2023 10:00; W11 em 06/03/2023 09:00; W12 em 02/02/2023 10:00.
- A coluna `operator` do CO usa Operator_1 nas ondas W10 e W12 e Operator_12 na W11. O Operator_12 só existe no CO.

CO:

| Linha | Pedido | Ref. | Tamanho | Qtd. | Onda | Operador | Nota |
|---|---|---|---|---|---|---|---|
| L1 | P1 | D1 | 105 | 2 | W10 | Operator_1 | |
| L2 | P1 | D1 | 105 | 2 | W10 | Operator_1 | idêntica a L1 (duplicado real) |
| L3 | P1 | D2 | 9 | 0 | W10 | Operator_1 | linha a zero num pedido com unidades |
| L4 | P2 | D3 | (vazio) | 1 | W10 | Operator_1 | tamanho vazio |
| L5 | P2 | D1 | 105 | 2 | W10 | Operator_1 | SKU partilhado com P1 |
| L6 | P3 | D2 | 9 | 0 | W10 | Operator_1 | pedido só com zeros |
| L7 | P4 | D2 | 8 | 3 | W11 | Operator_12 | onda sem picking; operador só no CO |
| L8 | P5 | D4 | 7 | 1 | W10 | Operator_1 | pedido dividido com ≤ 24 un. (evitável) |
| L9 | P5 | D4 | 7 | 1 | W12 | Operator_1 | 2.ª onda do pedido P5 |

PW:

| Onda | Ref. | Tamanho | Linhas (1 un. cada) | Localização | Operador |
|---|---|---|---|---|---|
| W10 | D1 | 10.5 | 3 | K-01-01 | Operator_1 |
| W10 | D1 | 10.5 | 1 | `"RC-01     "` | Operator_2 |
| W10 | D4 | 7.0 | 1 | K-01-01 | Operator_1 |
| W12 | D4 | 7.0 | 1 | K-01-01 | Operator_1 |

| Verificação | Esperado |
|---|---|
| Unidades encomendadas | 12 (L1 e L2 contam as duas) |
| Linhas duplicadas; sensibilidade | 1 linha (2 un.); sem duplicados: 10 un., tamanho médio 10 ÷ 4 = 2,5 (L8 e L9 diferem na onda e não são duplicados) |
| Linhas a zero; pedidos com 0 un. | 2; 1 (P3), excluído e contado na qualidade |
| Pedidos válidos | 4 (P1 = 4, P2 = 3, P4 = 3, P5 = 2) |
| Tamanho médio | 12 ÷ 4 = 3,0 |
| Pedidos por onda | W10: 3 (P1, P2, P5); W11: 1; W12: 1 → 5 ÷ 3 = 1,6667 |
| Setor; multissetor | PF = 100 % (após remover espaços); 0 % |
| Pedidos divididos | 1 de 4 = 25 % (P5); com ≤ 24 un.: 1 (25 %); com > 24 un.: 0 |
| Ocupação | W10: 5 ÷ 24 = 20,8333 %; W12: 1 ÷ 24 = 4,1667 %; média 12,5 %; W11 fora (1 onda sem picking, 3 un.) |
| Paragens; localizações distintas por onda | 3 (W10: K-01-01 e RC-01; W12: K-01-01); 2 e 1 (média 1,5) |
| Zonas (picking, 6 un.) | K = 100 % das mapeadas; não mapeadas = 1 un. (16,6667 % do recolhido), RC-01 em separado |
| Tamanhos | 105 → 10,5 liga a `10.5`; 7 liga a `7.0`; 1 linha com tamanho vazio, sem correspondência |
| Repartição do SKU D1 10,5 (W10) | encomendado 6 (P1 4, P2 2); recolhido 4 (K 3, RC-01 1); falta 2. P1: K 2, não mapeada 0,6667, sem zona 1,3333. P2: K 1, não mapeada 0,3333, sem zona 0,6667 (+ 1 da linha D3 = 1,6667) |
| Zonas das unidades encomendadas | K 5 (P1 2, P2 1, P5 2); não mapeada 1; sem zona 6 (falta 2 + D3 1 + W11 3) |
| Multizona | 0 % (nenhum pedido com ≥ 2 zonas mapeadas; "não mapeada" não conta como zona) |
| Filtro zona K (encomenda) | 3 pedidos (P1, P2, P5); 5 un.; tamanho médio 1,6667 |
| Operadores | Ondas com vários operadores no PW: 1 (W10). Ondas com operadores diferentes entre ficheiros: 1 (W10: CO {Operator_1}, PW {Operator_1, Operator_2}). Operadores só no CO: Operator_12. Filtro Operator_1 (picking): 5 un., 2 paragens, 1 localização. Filtro Operator_2: 1 un. no RC-01. Indicadores de encomenda: filtro "não aplicável" |
| Recolhido vs encomendado | 6 vs 12; diferença 6 = ondas sem picking 3 + referências nunca recolhidas 1 (D3) + sem causa conhecida 2 |
| ABC | D1 = 6 → A (antes 0 %); D2 = 3 → A (antes 50 %); D4 = 2 → A (antes 75 %, atravessa 80 %); D3 = 1 → B (antes 91,67 %) |
| Período fevereiro 2023 | P1, P2, P5: 9 un.; tamanho médio 3,0; período anterior antes da data mínima (02/02/2023) → "sem período anterior" |
| Período março 2023 | P4: 3 un.; tamanho médio 3,0; período anterior = fevereiro (3,0) → variação 0 (0 %); por dia com atividade: pedidos 1 vs 3, unidades 3 vs 9 (−66,67 %) |

### Verificações manuais das interações (dataset completo)

1. Abro a Visão geral sem filtros → vejo:
   - tamanho médio 6,99 (mediana 2);
   - pedidos por onda 4,07;
   - setor PF 100 %;
   - multissetor 0 %, com a explicação da limitação;
   - ABC com 51 A, 49 B e 108 C.
2. Passo o rato pelo cartão do tamanho médio → vejo a definição, a fonte "Customer_Order", o valor, "sem período anterior" (sem filtro de período) e "2 pedidos com 0 un. excluídos".
3. Seleciono o mês de março de 2023 → todos os cartões e gráficos da página mudam. O tooltip mostra a variação face a fevereiro, por dia com atividade (17 dias em março, 19 em fevereiro).
4. Seleciono janeiro de 2023 → o tooltip mostra "sem período anterior" e o mês aparece assinalado como parcial.
5. Na página 2, clico na classe A → vejo 51 referências. Clico em D05ZS7 → vejo as unidades por tamanho (drill-down).
6. Filtro por março e vejo uma referência cuja classe no período difere da global → a tabela mostra as duas colunas ("classe no período" e "classe global"), e o filtro de classe continua a usar a global.
7. Escolho o filtro de operador → os indicadores de encomenda mostram "filtro não aplicável" e não mudam; os de picking mudam.
8. Escolho o filtro de zona I → a participação por zona destaca a zona I, e os indicadores de encomenda passam a contar só a parte atribuída a I.
9. No gráfico de ocupação, clico na onda 35679 → abre "Ondas e pedidos" com o filtro onda = 35679: 1 pedido (100147), 23 un., ocupação 95,83 %, localizações K-06-12 e K-04-13, e o pedido marcado como "dividido" (drill-through).
10. Mudo de página com filtros ativos → os filtros mantêm-se (e estão no URL).
11. Escolho uma combinação de filtros sem linhas → vejo "sem dados" em vez de 0.
12. Na página de qualidade, alterno "sem duplicados" → o ABC e o tamanho médio mudam e o resto fica rotulado como regra principal "com duplicados".
13. Na página de qualidade → vejo a decomposição 13 003 = 745 + 4 929 + 7 329, a lista de localizações não mapeadas (RC-01 = 22 979 un.) e as duas listas (limitações; perguntas ao docente).
14. Apago a base de dados, corro `npm run etl` duas vezes seguidas → os valores do ponto 1 são iguais (idempotência). Os CSV em `DATA_DIR` ficam com a mesma data de modificação.

---

## Out of Scope

- **Simulação de distâncias percorridas** com as políticas de armazenagem (Random, Class-based, Dedicated, Hybrid) e os pontos de navegação. É uma extensão opcional futura; se existir, terá de ser rotulada como estimativa.
- Carregar `Support_Points_Navigation` e os 4 ficheiros de políticas de armazenagem.
- Indicadores de produtividade ou de tempo (não há tempos de picking nos dados).
- Comparação entre anos (só há dados de 2023).
- Autenticação, perfis de utilizador e escrita de dados pela interface.
- Docker e deploy em servidor; a aplicação corre localmente.
- Testes automáticos de frontend.

---

## Further Notes

### Limitações conhecidas (mostradas na página de qualidade)

1. O PW não tem data nem número de pedido. A data vem da onda, e a ligação ao pedido é feita por onda + referência + tamanho, com repartição proporcional.
2. Não há tempos de picking: o operador mede carga, não desempenho.
3. 77 ondas do CO não têm picking (745 un.).
4. 10 referências encomendadas nunca aparecem no PW (4 929 un. em ondas com picking), contadas à parte das 7 329 un. sem causa conhecida.
5. Os duplicados do CO são tratados como linhas reais. A sensibilidade com/sem duplicados está disponível.
6. 6 093 linhas do CO (4,98 %) não têm correspondência no PW e ficam "sem zona".
7. Setor sempre "PF": a participação por setor dá 100 % e os pedidos multissetor 0 %.
8. Há pedidos ao domingo (5 dias, 348 pedidos) e um pico às 20h (337 pedidos em apenas 4 dias).
9. Localizações não mapeadas (10,97 % das unidades recolhidas; RC-01 = 22 979 un.). O RC-01 conta como 1 localização, mas tem 155 referências, o que subestima a dispersão.
10. A escala de tamanhos 215–305 é mantida sem interpretação.
11. O operador atribuído (CO) e o operador recolhedor (PW) não coincidem sempre; o Operator_12 e o Operator_13 só existem no CO.
12. Janeiro e outubro de 2023 são meses parciais.
13. A ocupação usa 24 un. como capacidade de referência, que é um alvo e não um limite.

### Perguntas ao docente

1. O que é o RC-01?
2. O que representa a escala de tamanhos 215–305?
3. Qual é a origem e o critério do ABCCOD do `Product`?
4. Qual é a causa das 7 329 un. recolhidas a menos sem causa conhecida?
5. A localização K-23-40 tem z = 3, quando o padrão indica 4: é um erro?
6. A capacidade da onda (24 un.) é um alvo ou um limite?
7. Qual é a diferença entre operador atribuído e operador que recolheu (102 ondas diferem)?
8. O que são C-102, ZN-COR, EX-11 e K-26-20 (e as restantes localizações não mapeadas)?
9. Onde fica o ponto de partida/expedição? (Só é relevante se a distância voltar a entrar no âmbito.)

### Decisões introduzidas nesta especificação (as seis foram aceites pela equipa em 19/11/2026)

- **Pedido válido em todos os indicadores de pedido.** A regra "pedidos com 0 un. fora do denominador" foi alargada a pedidos por onda, pedidos divididos e multissetor/multizona, e as linhas com 0 un. ficam fora. Por isso, os pedidos divididos são 4 023 e não 4 024: com as linhas a zero, um pedido a mais aparece em duas ondas.
- **Propriedades de entidade vs medidas aditivas** nos filtros (secção "Propriedades das entidades e filtros"). Refina a Q10, para que filtrar uma onda não desfaça um pedido dividido nem altere a ocupação de uma onda.
- **Pedidos divididos separados em > 24 un. e ≤ 24 un.** Dos 4 023 pedidos divididos, 1 497 têm mais de 24 un. e seriam divididos com qualquer onda de 24. A parte potencialmente evitável é 2 526 pedidos (7,74 %).
- **Medidas e limiares da matriz.** Impacto (a) = paragens de artigos A fora das 3 localizações mais usadas; impacto (b) = pedidos divididos com ≤ 24 un.; limiares revistos em 19/11/2026. Ainda a confirmar.
- **Hora da onda** = hora de criação mais antiga dos seus pedidos (usada na P6).
- Os indicadores de volume comparam-se por dia com atividade; os rácios comparam-se diretamente.
- **Período anterior com um mês selecionado** (decidido no ticket 08, 22/11/2026): o mês conta como unidade para a regra "antes da data mínima". A regra à letra contradizia a fixture 4 (março comparado com fevereiro, com dados só a partir de 02/02/2023).
- **Regras de pormenor da comparação** (ticket 08, a confirmar pela equipa): variação = (atual − anterior) ÷ anterior × 100, com 0 → 0 = 0 %; os dias com atividade são os da operação toda no período (os filtros de referência, zona, classe e operador não os mudam), para que "por dia" seja sempre por dia de operação.
- **Percentis pelo método contínuo** (decidido no ticket 01, 19/11/2026). A mediana e o p90 usam `percentile_cont`, para coincidirem com MEDIANA e PERCENTIL.INC do Excel, onde as fixtures são validadas. No dataset completo, os métodos contínuo e discreto dão o mesmo resultado: mediana 2 e p90 13. As escolhas técnicas estão registadas em `docs/adr/0001-orm-e-graficos.md`.

### Notas de processo

- O `/setup-matt-pocock-skills` não foi corrido neste repositório. Por isso, esta especificação foi publicada localmente em `docs/` e não num issue tracker.
- O glossário (`CONTEXT.md`) e as ADRs ainda não existem. Os termos usados aqui (pedido válido, paragem, localização mapeada/não mapeada, sem zona, dia com atividade, período anterior, classe global/no período) devem passar para o glossário.
