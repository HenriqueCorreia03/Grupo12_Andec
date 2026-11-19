# 09: Drill-through: onda → Ondas e pedidos com detalhe

**Grupo:** essencial

**Responsável:** Pedro

**What to build:** O diretor clica numa onda no gráfico de ocupação, ou na lista de ondas, e abre a página Ondas e pedidos filtrada por essa onda, com os pedidos, as linhas, as localizações, as zonas e os operadores. Não é criada uma 5.ª página.

**Blocked by:** 05 (Pedidos divididos (inevitáveis vs evitáveis)); 06b (Filtro de operador e regra das medidas aditivas vs propriedades de entidade); 07 (Ligação CO ↔ PW e zona das unidades encomendadas)

**Status:** ready-for-agent

**Áreas do código tocadas:**
- API (endpoint de detalhe da onda)
- Frontend: página Ondas e pedidos (vista de detalhe)
- Frontend: gráfico de ocupação (clique)
- Frontend: painel de filtros (filtro de onda)
- Testes (fixture 3)

**Critérios de aceitação:**

- [ ] O clique abre Ondas e pedidos com o filtro de onda e mantém os filtros globais.
- [ ] A vista de detalhe mostra os pedidos (marcados como divididos quando o são), as linhas, as localizações, as zonas e os operadores dos dois ficheiros.
- [ ] O filtro de onda pode ser retirado no painel.

**Validação (fixtures e verificações manuais da especificação):**
- Fixture 3: onda 35679 → 1 pedido (100147, dividido), 23 un., ocupação 95,8333 %, localizações K-06-12 e K-04-13
- Verificação manual 9

Referência: `docs/spec.md`.
