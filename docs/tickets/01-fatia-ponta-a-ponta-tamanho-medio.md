# 01: Fatia ponta a ponta: tamanho médio da encomenda

**Grupo:** essencial

**Responsável:** Henrique (feito primeiro, antes de todos os outros)

**What to build:** O diretor abre a Visão geral e vê o tamanho médio da encomenda, calculado no servidor a partir do `Customer_Order` carregado pelo ETL. É a primeira fatia completa (CSV → PostgreSQL → NestJS → Next.js) e deixa preparadas as bases que os outros tickets reutilizam.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Áreas do código tocadas:**
- Esquema da BD (tabelas brutas e normalizadas do CO)
- ETL (leitura de CSV, normalização, `npm run etl`)
- Módulo de indicadores (encomenda)
- API (endpoint da Visão geral)
- Frontend: esqueleto Next.js, layout e navegação entre as 4 páginas
- Frontend: componente de cartão de indicador
- Frontend: página Visão geral
- Testes (preparação Jest na fronteira da API + fixtures)
- README e `.env.example`

**Critérios de aceitação:**

- [ ] A equipa escolhe o ORM e a biblioteca de gráficos, e a escolha fica registada com uma justificação curta (ADR ou secção no README).
- [ ] `npm run etl` lê o `Customer_Order` da pasta indicada por `DATA_DIR`, com um leitor de CSV que respeita aspas, remove o BOM e aceita CRLF/CR. Escreve tabelas brutas (com o nº da linha de origem) e tabelas normalizadas, sem alterar o CSV original.
- [ ] O ETL normaliza: remove espaços nos campos de texto, converte as datas `dd/mm/aaaa hh:mm`, normaliza os tamanhos (35…125 → 3,5…12,5; 1–16 e 215–305 ficam iguais; vazio → nulo), mantém os duplicados como linhas reais (marcados) e marca as linhas a zero.
- [ ] O ETL é idempotente: corrido duas vezes seguidas dá o mesmo resultado (apaga e recarrega dentro de uma transação).
- [ ] A API devolve o tamanho médio da encomenda = Σ unidades ÷ nº de pedidos válidos (total > 0), junto com a mediana, o p90, a definição, a fonte e o nº de pedidos excluídos. Os valores vão sem arredondamento.
- [ ] A Visão geral mostra o número num cartão, que obtém exclusivamente pela API do backend.
- [ ] As 4 páginas existem (vazias exceto a Visão geral) e é possível navegar entre elas.
- [ ] O `.env.example` tem `DATABASE_URL`, o URL da base de dados de teste, `DATA_DIR` e o URL da API para o frontend; não há credenciais no código.
- [ ] O README inicial explica, para Windows: instalar o PostgreSQL; criar a base de dados da aplicação, a de teste e o utilizador; configurar o `.env`; correr o ETL; arrancar o backend e o frontend; correr os testes. As versões (Node 24 LTS, PostgreSQL estável atual) estão marcadas como a confirmar.
- [ ] O teste Jest escreve os CSV da fixture numa pasta temporária, corre o ETL de produção contra a base de dados de teste, chama a API e compara o JSON.

**Validação (fixtures e verificações manuais da especificação):**
- Fixture 1 (onda 33444): tamanho médio = 7 ÷ 3 = 2,3333…
- Dataset completo: 6,993 (228 195 ÷ 32 632); mediana 2; p90 13
- Verificação manual 14 (idempotência, só a parte do CO)

Referência: `docs/spec.md`.
