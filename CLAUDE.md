# Projeto 3: dashboard do armazém de calçado

Responde em português (PT-PT). A fonte de verdade do produto é `docs/spec.md`; cada tarefa é um ticket em `docs/tickets/`. Decisões técnicas em `docs/adr/`.

**Plano da equipa:** antes de começar ou escolher um ticket, lê `docs/plano-equipa.md` (dependências, quem faz o quê, protocolo de merge e de migrações).

## Ambiente

- Windows, PowerShell, PostgreSQL local (sem Docker), Node 24. Monorepo com npm workspaces: `apps/backend` (NestJS + Drizzle) e `apps/frontend` (Next.js 16).
- Credenciais só no `.env` da raiz (backend) e em `apps/frontend/.env.local` (URL da API). Escreve-as sempre via variáveis de ambiente; os ficheiros de exemplo são `.env.example` e `apps/frontend/.env.local.example`.
- Quando não podes correr comandos, dá ao humano um bloco PowerShell de cada vez, com o que deve ver.

## Como se trabalha (regras que o código não mostra)

- **TDD numa única fronteira: a API HTTP do backend.** Cada teste escreve os CSV de uma fixture numa pasta temporária (`test/support/fixture-files.ts`), corre `npm run etl` contra a base de teste (`test/support/run-etl-command.ts`), chama o endpoint e compara o JSON com valores calculados à mão (da spec ou da folha de Excel da fixture), com `expectClose` (tolerância 1e-9). Testa só pela API: SQL, tabelas e funções internas ficam por trás da fronteira.
- **Fixtures reais** copiam as linhas do CSV byte a byte (BOM, CRLF, espaços), como em `test/fixtures/fixture-1.ts`. Para extrair linhas, pesquisa por valor (onda, referência); os CSV têm ~10 MB, por isso nunca os leias inteiros.
- **Valores sem arredondamento na API**; o frontend arredonda (2 casas) em `lib/formatar.ts` e obtém dados só através de `apps/frontend/lib/api.ts`.
- **Percentis com `percentile_cont`** (igual a MEDIANA/PERCENTIL.INC do Excel).
- **Identificadores de pedido e de onda são texto** (as fixtures sintéticas usam `P1`, `W10`).
- **Tamanhos:** usa `normalizeSize()` de `src/etl/normalize.ts` em qualquer ficheiro (CO e PW), para que a chave onda + referência + tamanho ligue.
- **ETL:** cada ficheiro tem um `load…()` próprio chamado em `run-etl.ts`, dentro da mesma transação, e grava tabela bruta (texto + `source_line`) e tabela normalizada. Lê os CSV sempre com `readCsv()`.
- **Migrações:** muda `src/db/schema.ts` e gera com `npx drizzle-kit generate --name <nome>` dentro de `apps/backend`. Uma coluna `NOT NULL` nova leva `.default(...)`, porque a migração corre sobre tabelas com dados. Nunca edites uma migração que já está no `main`.
- **Next.js 16** com `cacheComponents`: dados vindos da API ficam num componente assíncrono dentro de `<Suspense>`. Lê `node_modules/next/dist/docs/` antes de usar uma API do Next que não conheças.
- **Verifica antes de dar por feito:** `npm run typecheck`, `npm test` (os testes partilham a base de teste e correm em série) e, para o dataset completo, `npm run etl` + os valores de referência da spec.
