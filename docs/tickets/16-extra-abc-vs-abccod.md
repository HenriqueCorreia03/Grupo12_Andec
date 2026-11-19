# 16: [Extra] Comparação ABC ↔ ABCCOD

**Grupo:** extra

**Responsável:** Henrique (proposto)

**What to build:** O diretor compara a classe ABC calculada com o ABCCOD do ficheiro de produtos, como contraste e não como verificação.

**Blocked by:** 03 (ABC global e drill-down classe → referência → tamanhos)

**Status:** ready-for-agent

**Áreas do código tocadas:**
- Módulo de indicadores (ABC)
- Frontend: página Artigos

**Critérios de aceitação:**

- [ ] Matriz de coincidência ABC × ABCCOD e % de coincidência.
- [ ] Nota a explicar que o ABCCOD usa outro critério ou período (pergunta ao docente).

**Validação (fixtures e verificações manuais da especificação):**
- Dataset completo: 112 de 208 coincidem (53,8 %)

Referência: `docs/spec.md`.
