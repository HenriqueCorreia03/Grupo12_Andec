# Dashboard de prioridades de operação: armazém de calçado

TP3 ANDEC/PROPL 2026/2027 (ISEP × Deloitte). Aplicação web interna para o diretor de operações comparar duas alavancas de melhoria: (a) reorganizar as localizações de armazenagem e (b) mudar a constituição das ondas de picking.

- Especificação: [`docs/spec.md`](docs/spec.md)
- Tickets: [`docs/tickets/`](docs/tickets/)
- Decisões técnicas: [`docs/adr/`](docs/adr/)

## Arquitetura

```
browser → Next.js (apps/frontend, porta 3000) → NestJS (apps/backend, porta 3001) → PostgreSQL
```

- O browser nunca lê os CSV nem acede à base de dados. Todos os indicadores são calculados no backend.
- O ETL (`npm run etl`) carrega os CSV da pasta `DATA_DIR` para o PostgreSQL. Os CSV originais nunca são alterados.
- O repositório é um monorepo com npm workspaces: um só `npm install` e um só `node_modules`, na raiz.

### Escolhas técnicas

| Área | Escolha | Justificação curta |
|---|---|---|
| ORM | Drizzle ORM com `pg` | Próximo do SQL: as agregações (`percentile_cont`, CTEs) ficam explícitas e com tipos. Não tem motor binário nem geração de código. |
| Gráficos | Recharts | React declarativo, com tooltips personalizados e cliques nos gráficos (drill-down e drill-through). |
| Leitor de CSV | `csv-parse` | Respeita aspas, remove o BOM e aceita CRLF/CR. |
| Testes | Jest + supertest | Uma única fronteira de teste: a API HTTP do backend, com fixtures calculadas à mão. |

Detalhes em [`docs/adr/0001-orm-e-graficos.md`](docs/adr/0001-orm-e-graficos.md).

## Versões (a confirmar pelo docente)

| Ferramenta | Versão |
|---|---|
| Node.js | 24 LTS (a confirmar) |
| PostgreSQL | versão estável atual (testado com a 19; a confirmar) |

## Pôr a aplicação a correr no Windows

Os comandos são para o PowerShell, a partir da raiz do repositório (por exemplo, `C:\dev\Projeto3_Andec`).

### 1. Instalar o PostgreSQL

1. Descarregar o instalador oficial para Windows em <https://www.postgresql.org/download/windows/>.
2. Correr o instalador com as opções por omissão (porta 5432). Guardar a palavra-passe do superutilizador `postgres`.
3. O `psql` normalmente não fica no PATH. Nos passos seguintes usa-se o caminho completo (troca `19` pela versão instalada):

   ```powershell
   $psql = "C:\Program Files\PostgreSQL\19\bin\psql.exe"
   ```

### 2. Criar o utilizador, a base de dados da aplicação e a de teste

```powershell
& $psql -U postgres -h localhost
```

Dentro do `psql`, uma linha de cada vez:

```sql
CREATE ROLE andec LOGIN;
\password andec
CREATE DATABASE andec OWNER andec;
CREATE DATABASE andec_test OWNER andec;
\l andec*
\q
```

- O `\password` pede a palavra-passe duas vezes e não mostra o que escreves. Se aparecer `Passwords didn't match.`, repete o `\password andec`.
- Os testes apagam e recarregam a base `andec_test`. Nunca uses a mesma base para a aplicação e para os testes.

### 3. Configurar as variáveis de ambiente

```powershell
Copy-Item .env.example .env
Copy-Item apps/frontend/.env.local.example apps/frontend/.env.local
code .env
```

- No `.env` da raiz (backend), troca `ALTERAR` pela palavra-passe do `andec` em `DATABASE_URL` e em `TEST_DATABASE_URL`. Se a palavra-passe tiver `@`, `:`, `/`, `#` ou `%`, escreve-a codificada no URL (por exemplo, `@` → `%40`).
- `DATA_DIR` aponta para a pasta dos CSV. Por omissão é `./data`, relativo à raiz do repositório.
- `apps/frontend/.env.local` tem o URL da API (`NEXT_PUBLIC_API_URL`), porque o Next.js não lê o `.env` da raiz.
- Os ficheiros `.env` e `.env.local` ficam fora do Git. Nunca escrevas credenciais no código.

### 4. Instalar as dependências e correr o ETL

Coloca os CSV originais em `data/` (a pasta está fora do Git) e corre:

```powershell
npm install
npm run etl
```

Deves ver `ETL concluído em … s. Customer_Order: 122370 linhas (2559 duplicadas, 33 a zero).`

O ETL é idempotente: aplica as migrações em falta e depois apaga e recarrega tudo numa transação. Pode ser corrido as vezes que forem precisas.

### 5. Arrancar o backend e o frontend

Em dois terminais:

```powershell
npm run dev:backend
```

```powershell
npm run dev:frontend
```

Abre <http://localhost:3000>. A API responde em <http://localhost:3001/api/visao-geral>.

### 6. Correr os testes e a verificação de tipos

```powershell
npm test
npm run typecheck
```

Cada teste escreve os CSV de uma fixture numa pasta temporária, corre o ETL contra `andec_test`, chama a API e compara o JSON com os valores calculados à mão.

## Estrutura do repositório

- `apps/backend`: NestJS (API, ETL, indicadores). Migrações SQL em `apps/backend/drizzle/`.
- `apps/frontend`: Next.js (4 páginas: Visão geral; Artigos, ABC e localizações; Ondas e pedidos; Qualidade dos dados).
- `apps/historia`: site de apresentação "Evidência.", à parte do dashboard (`npm run dev:evidencia`, <http://localhost:3002>). Ver o README da pasta.
- `docs`: especificação, tickets, ADRs e notas.
- `data`: CSV originais (fora do Git).

## Workshop: Claude Code

Para ligar o Claude Code à API do workshop, define `ANTHROPIC_FOUNDRY_BASE_URL` e `ANTHROPIC_FOUNDRY_API_KEY` em `.claude/settings.local.json`, que está fora do Git. Usa o URL e a chave fornecidos pela Deloitte e segue o guia `practice_class.html`. Nunca coloques o URL nem a chave em `.claude/settings.json` ou noutro ficheiro do Git.
