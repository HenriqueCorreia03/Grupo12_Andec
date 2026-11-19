# 06b: Filtro de operador e regra das medidas aditivas vs propriedades de entidade

**Grupo:** essencial

**Responsável:** Pedro

**What to build:** O diretor filtra por operador recolhedor nos indicadores de picking. Os indicadores de encomenda mostram "filtro não aplicável" e não mudam. Filtrar nunca faz uma propriedade de entidade (pedido dividido, ocupação) mudar de valor.

**Blocked by:** 06a (Filtros globais: período, referência e classe ABC; URL e "sem dados")

**Status:** ready-for-agent

**Áreas do código tocadas:**
- Contrato de filtros da API (operador, onda, pedido, avisos de "não aplicável")
- Módulo de indicadores (regra das medidas aditivas vs propriedades de entidade)
- Frontend: painel de filtros
- Frontend: componente de cartão (aviso de filtro não aplicável)
- Testes (fixtures 3 e 4)

**Critérios de aceitação:**

- [ ] Operador = operador recolhedor (PW); nos indicadores de encomenda o filtro fica desativado e a API devolve-o na lista de filtros não aplicáveis.
- [ ] Medidas aditivas (unidades, linhas, paragens, localizações) usam só as linhas filtradas.
- [ ] Propriedades de entidade (pedido dividido, multissetor/multizona, ocupação da onda, classe global) são calculadas sobre a entidade completa; os filtros só escolhem que entidades entram (≥ 1 linha que passa os filtros).
- [ ] Os cartões mostram o aviso de filtro não aplicável.
- [ ] A API aceita também os parâmetros de onda e de pedido (usados no teste da fixture 3 e, mais tarde, pelo drill-through do ticket 09).

**Validação (fixtures e verificações manuais da especificação):**
- Fixture 4: Operator_1 (picking) → 5 un., 2 paragens, 1 localização; Operator_2 → 1 un. no RC-01; encomenda → "não aplicável"
- Fixture 3: filtro de onda 35679 → o 100147 continua dividido; ocupação 95,8333 %
- Verificação manual 7

Referência: `docs/spec.md`.
