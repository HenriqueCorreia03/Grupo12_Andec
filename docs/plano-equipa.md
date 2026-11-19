# Plano da equipa: dependências e como avançar

Atualizado em 19/11/2026, depois do ticket 01. A coluna "Blocked by" de cada ticket em `docs/tickets/` é a fonte de verdade; este ficheiro só a organiza.

## Regra de arranque

Um ticket pode começar quando **todos** os tickets de que depende estão no `main`. Cria o ramo a partir do `main` atualizado:

```powershell
git switch main
git pull
git switch -c ticket-NN
```

## Rondas

Cada ronda junta tickets que podem correr em paralelo. "← X" = depende de X. Extras (14–18) só depois das essenciais feitas e verificadas.

| Ronda | Henrique | Eduardo | Pedro |
|---|---|---|---|
| 0 | **01** ✔ feito | | |
| 1 | **02** ← 01 | **04** ← 01 | (preparação, ver abaixo) |
| 2 | **03** ← 02 | (preparação) | **05** ← 02 |
| 3 | extra 16 ← 03 | (preparação) | **06a** ← 03, 04, 05 |
| 4 | **08** ← 03, 06a | (preparação) | **06b** ← 06a |
| 5 | **10** ← 03, 04, 08 | **07** ← 04, 06b | **11** ← 05, 08 |
| 6 | extra 14 ← 10 | **12** ← 03, 05, 07; **13** ← 07 | **09** ← 05, 06b, 07; extra 15 ← 05, 11 |
| 7 | | extra 17 ← 03, 13; extra 18 ← 13 | |

**Caminho crítico:** 01 → 02 → 05 → 06a → 06b → 07 → 12/13/09 → 17/18. Um atraso aqui atrasa tudo. Os tickets mais urgentes são o **02** (desbloqueia o 03 e o 05) e depois o **06a/06b** (desbloqueiam quase tudo o resto).

## Trabalho de preparação (sem bloqueios, sem tocar no código partilhado)

- **Eduardo (rondas 2–4):** fixtures 3 e 4 em `apps/backend/test/fixtures/` (ver "Testing Decisions" na spec) com a folha de Excel do cálculo à mão; conteúdo estático do ticket 13 (limitações e perguntas ao docente, já na spec); ficheiro de configuração do esforço da matriz (ticket 12).
- **Pedro (ronda 1):** desenhar o contrato dos filtros da API para o 06a (parâmetros comuns a todos os endpoints, "sem dados", filtros não aplicáveis), a partir de "Filtros" e "Contrato da API" na spec.

## O que o ticket 01 deixou para reutilizar

| Peça | Onde | Para quê |
|---|---|---|
| Leitor de CSV (aspas, BOM, CRLF/CR, nº da linha de origem) | `apps/backend/src/etl/csv.ts` → `readCsv()` | Todos os ficheiros do ETL (PW, `Product`, `Storage_Location` usa `,`) |
| Normalização (datas, tamanhos, inteiros) | `apps/backend/src/etl/normalize.ts` | CO e PW, para a chave onda + referência + tamanho |
| Carga em lotes | `apps/backend/src/etl/insert-in-batches.ts` | Tabelas grandes (PW tem 215 192 linhas) |
| Padrão de carga de um ficheiro | `apps/backend/src/etl/customer-order.ts` | Modelo para `load…()` novos |
| Indicadores e endpoint da Visão geral | `apps/backend/src/indicadores/` | Acrescentar indicadores ao mesmo módulo |
| Apoio aos testes (fixture → pasta temporária, `npm run etl`, tolerância) | `apps/backend/test/support/` | Todos os testes novos |
| Fixture 1 (onda 33444) | `apps/backend/test/fixtures/fixture-1.ts` | Já inclui as linhas de PW, `Product` e `Storage_Location` |
| Cartão de indicador e página por preencher | `apps/frontend/components/` | Todos os indicadores e páginas |

## Protocolo de merge

1. Antes de abrir o Pull Request: `npm run typecheck`, `npm test`, `npm run etl` (sem erros, valores de referência da spec certos).
2. Atualiza o ramo com o `main` antes do merge (`git pull origin main`) e volta a correr os testes.
3. **Migrações em paralelo:** se outro ramo entrou no `main` com uma migração de número igual ao da tua (por exemplo, duas `0002_…`), apaga a tua migração (o `.sql`, o `meta/NNNN_snapshot.json` e a entrada no `meta/_journal.json`), atualiza com o `main` e volta a correr `npx drizzle-kit generate --name <nome>` em `apps/backend`.
4. Ficheiros onde é normal haver conflitos pequenos: `src/db/schema.ts`, `src/etl/run-etl.ts`, `src/indicadores/indicadores.service.ts`, `apps/frontend/lib/api.ts`. Mantém as duas partes.
5. Faz merge cedo e com frequência: ramos curtos dão conflitos pequenos.

## Prompt para começar um ticket

Cola isto no teu agente (troca NN):

```
Vamos implementar o ticket docs/tickets/NN-....md, seguindo a docs/spec.md, em TDD,
com a skill /mattpocock-skills:implement. Lê primeiro o CLAUDE.md e o docs/plano-equipa.md.
Confirma que todos os tickets de que este depende já estão no main.
Antes de escrever código, dá-me o plano dos passos e as fixtures/valores esperados que vais usar nos testes.
Não leias os CSV inteiros. Responde em português.
```
