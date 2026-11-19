# 05: Pedidos divididos (inevitáveis vs evitáveis)

**Grupo:** essencial

**Responsável:** Pedro

**What to build:** O diretor vê a % e o nº de pedidos divididos entre ondas, separando os que têm > 24 un. (divisão inevitável) dos que têm ≤ 24 un. (evitáveis).

**Blocked by:** 02 (Restantes indicadores mínimos de encomenda)

**Status:** ready-for-agent

**Áreas do código tocadas:**
- Módulo de indicadores (encomenda: propriedades de pedido)
- API (endpoint de Ondas e pedidos)
- Frontend: página Ondas e pedidos
- Testes (fixtures 3 e 4)

**Critérios de aceitação:**

- [ ] Pedido dividido = pedido válido presente em > 1 onda (linhas > 0), calculado sobre o pedido completo, como propriedade da entidade.
- [ ] Os indicadores mostram a %, o nº absoluto, e o nº de divididos com > 24 un. e com ≤ 24 un.
- [ ] São mostrados na página Ondas e pedidos.

**Validação (fixtures e verificações manuais da especificação):**
- Fixture 3: 1 de 2 = 50 % (100147); ≤ 24 un.: 0
- Fixture 4: 1 de 4 = 25 % (P5), com ≤ 24 un.
- Dataset completo: 4 023 (12,33 %); 1 497 com > 24 un.; 2 526 com ≤ 24 un. (7,74 %)

Referência: `docs/spec.md`.
