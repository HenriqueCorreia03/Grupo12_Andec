# Prompt inicial

Somos uma equipa de estudantes a desenvolver uma aplicação web interna de
análise para o armazém de um fabricante de calçado (ISEP ANDEC/PROPL,
"Trabalho prático 3").

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

Gerais:

1. A procura está suficientemente concentrada (ABC) para justificar
   aproximar os artigos A das zonas mais acessíveis?
2. Como varia a carga ao longo do dia, da semana e do ano, e há picos que
   justifiquem regras de operação diferentes?

Hipótese (a), localizações:

3. A classificação ABC é estável ao longo dos meses, ou os artigos mudam
   de classe (o que reduziria o valor de uma reorganização fixa)?
4. Quão dispersa é a recolha: por quantas localizações e zonas passa cada
   onda e cada pedido?

Hipótese (b), ondas:

5. As ondas saem cheias ou desaproveitadas, e quantos pedidos são
   divididos entre várias ondas?
6. Juntar pedidos criados no mesmo período reduziria o número de ondas ou
   a divisão de pedidos?

## Indicadores

Mínimos (obrigatórios):

- Classificação ABC de produtos por volume encomendado (classes A, B, C).
- Tamanho médio da encomenda: unidades por pedido.
- Pedidos médios por onda.
- Participação por setor: % de unidades por Sector.
- Pedidos multissetor: % de pedidos com referências de setores distintos.

Adicionais (a validar e justificar na especificação):

- **Taxa de ocupação da onda:** unidades da onda ÷ capacidade da onda
  (aparentemente 24 unidades). Apoia as perguntas 5 e 6.
- **% de pedidos divididos:** pedidos presentes em mais de uma onda ÷ total
  de pedidos. Apoia as perguntas 5 e 6.
- **Localizações distintas por onda:** medida real de dispersão da recolha
  (não é uma estimativa). Apoia a pergunta 4.
- **Participação por zona e % de pedidos multizona:** zona = letra da
  localização (ex.: "I" em I-18-23). Alternativa justificada aos
  indicadores de setor, porque todos os produtos estão no setor "PF".
  Apoia as perguntas 1 e 4.
- **Estabilidade do ABC:** classe de cada artigo por mês e % de artigos que
  mudam de classe. Apoia as perguntas 1 e 3.

Mostrar distribuições (ex.: histogramas) e não apenas médias quando a
média esconder variação relevante.

## Contexto técnico

- Enunciado: `ENUNCIADO/Enunciado_3_Armazem_Calcado-20261116/Enunciado_03_Armazem_Calcado.pdf`
- CSV originais em `data/` (nunca os alterar; não estão no Git).
- Stack: Next.js (`apps/frontend`), NestJS (`apps/backend`), PostgreSQL.
  Browser -> Next.js -> NestJS -> PostgreSQL. Todos os indicadores e
  filtros são calculados no servidor. ETL dos CSV reprodutível.
  Credenciais apenas em variáveis de ambiente.

## Requisitos funcionais

Página principal + até 3 subpáginas com navegação; filtros dinâmicos
consistentes (produto, período, zona, operador, ...); comparação dos
indicadores ao longo do tempo; pelo menos um tooltip, um drill-down e um
drill-through; testes automatizados para os indicadores mínimos.

## Problemas conhecidos nos dados (resolver na especificação)

- Todos os produtos estão no setor "PF".
- `Product.csv` já traz um ABCCOD, mas o ABC tem de ser calculado por nós
  (comparar os dois pode servir de verificação).
- Códigos de tamanho como 105/95 (10,5/9,5?) e 235–280; 16 linhas sem
  tamanho.
- 2559 linhas duplicadas e 33 quantidades a zero.
- Separadores diferentes (`;` e `,`), BOM e valores com espaços a mais.
- Totais de unidades de `Picking_Wave` (215 192) e `Customer_Order`
  (228 195) não coincidem; 77 ondas existem em `Customer_Order` mas não em
  `Picking_Wave`.

## Análise preliminar (confirmar antes de usar)

- As ondas parecem limitadas a 24 unidades (mediana e quartis = 24).
- ~12% dos pedidos (4024) estão divididos entre ondas.
- 25% das ondas têm um único pedido; o máximo é 24 pedidos.
- 51 dos 208 artigos representam 80% das unidades.
- Cada onda passa em média por ~11 localizações distintas (máx. 25).
- O picking concentra-se nas zonas I–R.
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
quando forem relevantes, desafia as nossas perguntas de negócio e
indicadores, e propõe alternativas quando os dados não os suportarem.

## Resultado esperado agora

NÃO escrevas código. Entrevista-nos com grill-with-docs até concordarmos
no que construir; depois corremos to-spec. Responde em português.
