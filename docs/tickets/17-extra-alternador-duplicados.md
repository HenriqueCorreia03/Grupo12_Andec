# 17: [Extra] Alternador com/sem duplicados

**Grupo:** extra

**Responsável:** Eduardo (proposto)

**What to build:** Na página de qualidade, o diretor alterna "sem duplicados" e vê o ABC e o tamanho médio da encomenda recalculados, mantendo a regra principal "com duplicados" no resto da aplicação.

**Blocked by:** 03 (ABC global e drill-down classe → referência → tamanhos); 13 (Página de qualidade dos dados (essencial))

**Status:** ready-for-agent

**Áreas do código tocadas:**
- Módulo de qualidade (sensibilidade)
- Frontend: página Qualidade dos dados e limitações

**Critérios de aceitação:**

- [ ] O alternador recalcula o ABC e o tamanho médio sem as linhas duplicadas.
- [ ] O resto da aplicação continua com duplicados, e isso é indicado.

**Validação (fixtures e verificações manuais da especificação):**
- Fixture 4: sem duplicados → 10 un., tamanho médio 2,5
- Verificação manual 12

Referência: `docs/spec.md`.
