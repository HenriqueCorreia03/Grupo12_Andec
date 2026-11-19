# 02: Restantes indicadores mínimos de encomenda

**Grupo:** essencial

**Responsável:** Henrique

**What to build:** O diretor vê na Visão geral os pedidos médios por onda, a participação por setor e a % de pedidos multissetor, cada um com um tooltip que diz a definição, a fonte e as linhas excluídas.

**Blocked by:** 01 (Fatia ponta a ponta: tamanho médio da encomenda)

**Status:** ready-for-agent

**Áreas do código tocadas:**
- ETL (`Product`)
- Módulo de indicadores (encomenda)
- API (endpoint da Visão geral)
- Frontend: componente de cartão + tooltip básico
- Frontend: página Visão geral
- Testes (fixtures 1, 2 e 4)

**Critérios de aceitação:**

- [ ] O ETL carrega o `Product`, com o setor sem espaços.
- [ ] Pedidos por onda = média, sobre as ondas do CO, dos pedidos válidos distintos com linhas > 0 (um pedido dividido conta em cada onda). Inclui a mediana e o nº de ondas com 1 pedido. O tooltip avisa que o universo de ondas é o do CO.
- [ ] Participação por setor = unidades do setor ÷ total × 100.
- [ ] Pedidos multissetor = pedidos válidos com ≥ 2 setores ÷ pedidos válidos × 100. Na interface aparece a explicação da limitação (todo o dataset real é "PF").
- [ ] O tooltip básico de cada cartão mostra a definição, a fonte (CO) e o nº de linhas excluídas com o motivo. A variação face ao período anterior chega no ticket 08.
- [ ] O ETL continua idempotente.

**Validação (fixtures e verificações manuais da especificação):**
- Fixture 1: pedidos por onda 3; PF 100 %; multissetor 0 %
- Fixture 2: PF 85 % / SX 15 %; multissetor 66,6667 %; pedidos por onda 1,5; tamanho médio 33,3333
- Fixture 4 (parte CO): pedidos por onda 1,6667; tamanho médio 3,0; pedidos válidos 4; linhas a zero 2; PF 100 % após remover espaços
- Verificação manual 1 (sem a parte do ABC)

Referência: `docs/spec.md`.
