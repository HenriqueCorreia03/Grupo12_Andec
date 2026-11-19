# ADR 0001: ORM, biblioteca de gráficos e leitor de CSV

**Estado:** aceite
**Data:** 19/11/2026
**Ticket:** 01 (fatia ponta a ponta: tamanho médio da encomenda)

## Contexto

A especificação (`docs/spec.md`) deixou para o primeiro ticket técnico a escolha do ORM e da biblioteca de gráficos. O que pesa nesta escolha:

- Quase todo o trabalho do backend são agregações em SQL: mediana e p90, CTEs, a repartição proporcional da ligação entre CO e PW, o ABC e as séries por dia com atividade.
- O ETL carrega dezenas de milhares de linhas (122 370 no CO e 215 192 no PW) e tem de ser idempotente: apaga e recarrega tudo dentro de uma transação.
- A equipa trabalha em Windows, com o PostgreSQL instalado localmente e sem Docker. Os testes Jest correm o ETL de produção contra uma base de dados de teste.
- O frontend precisa de histogramas, barras, linhas, tooltips personalizados e cliques nos gráficos (drill-down e drill-through).
- Os CSV têm campos entre aspas com o separador lá dentro, BOM, fins de linha CRLF/CR e separadores diferentes consoante o ficheiro (`;` ou `,`).

## Decisão

1. **ORM: Drizzle ORM com o driver `pg` (node-postgres).** As migrações fazem-se com `drizzle-kit`.
2. **Gráficos: Recharts.**
3. **Leitor de CSV: `csv-parse`.**

## Justificação

**Drizzle**
- Não se usam os pacotes `@nestjs/drizzle` nem `@nestjs/config`: o ETL corre fora do Nest (`npm run etl`), por isso a ligação e a leitura do `.env` ficam em funções simples (`src/db/connection.ts`, `src/config/env.ts`) partilhadas pela API e pelo ETL.
- Está próximo do SQL e mantém os tipos. As agregações (`percentile_cont`, CTEs, funções de janela) escrevem-se com `sql\`...\`` sem sair do ORM.
- Não tem motor binário nem passo de geração de código, ao contrário do Prisma. Isso dá menos atrito no Windows e no Jest.
- Inserções em lote e transações são diretas, que é o que o ETL idempotente precisa.
- O TypeORM é o mais comum em NestJS, mas as entidades com decoradores pouco ajudam numa aplicação analítica e só de leitura.

**Recharts**
- É React declarativo e funciona em *client components* do Next.js.
- Cobre o que a especificação pede: barras (histograma, ABC, carga), linhas (série mensal), tooltips personalizados e `onClick` nos elementos do gráfico.
- O ECharts é mais potente (heatmaps, grandes volumes), mas é mais pesado e menos idiomático em React. As necessidades da especificação não o justificam.

**csv-parse**
- Respeita aspas, remove o BOM (`bom: true`), aceita CRLF e CR e permite escolher o separador para cada ficheiro.
- Garante a regra da especificação: nunca dividir as linhas por uma simples procura do separador.

## Consequências

- O SQL das agregações fica explícito no módulo de indicadores. Os testes cobrem-no pela fronteira da API, sem testar o SQL diretamente.
- Mediana e p90 usam `percentile_cont` (método contínuo), decisão tomada pela equipa no ticket 01 e registada na especificação. É o mesmo método das funções MEDIANA e PERCENTIL.INC do Excel, onde as fixtures são validadas.
- Se for preciso trocar de biblioteca de gráficos, a troca fica limitada aos componentes de gráfico do frontend, porque os valores vêm sempre já calculados pela API.
