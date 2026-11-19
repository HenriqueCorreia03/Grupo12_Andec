# 14: [Extra] Sensibilidade da estabilidade do ABC a 5/10/20 un.

**Grupo:** extra

**Responsável:** Henrique (proposto)

**What to build:** O diretor vê como a % de referências que mudam de classe varia com o limiar mínimo de unidades (5, 10, 20), e quantas combinações referência-mês ficam de fora em cada caso.

**Blocked by:** 10 (Alavanca (a): prioridade dos artigos e estabilidade do ABC)

**Status:** ready-for-agent

**Áreas do código tocadas:**
- Módulo de indicadores (ABC mensal)
- Frontend: página Artigos

**Critérios de aceitação:**

- [ ] A estabilidade é calculada para os limiares 5, 10 e 20 un.
- [ ] Para cada limiar aparece o nº e a % de combinações referência-mês excluídas.

**Validação (fixtures e verificações manuais da especificação):**
- Dataset completo (1 683 combinações referência-mês com unidades): excluídas 264 (15,7 %) com 5 un., 411 (24,4 %) com 10 un., 622 (37,0 %) com 20 un.

Referência: `docs/spec.md`.
