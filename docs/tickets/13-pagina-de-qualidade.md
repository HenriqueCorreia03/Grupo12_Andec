# 13: Página de qualidade dos dados (essencial)

**Grupo:** essencial

**Responsável:** Eduardo

**What to build:** O diretor vê as exclusões, a decomposição de "recolhido < encomendado", as localizações não mapeadas, a % de ligações repartidas, a escala de tamanhos 215–305 e as duas listas: limitações conhecidas e perguntas ao docente.

**Blocked by:** 07 (Ligação CO ↔ PW e zona das unidades encomendadas)

**Status:** ready-for-agent

**Áreas do código tocadas:**
- Módulo de qualidade
- API (endpoint de Qualidade)
- Frontend: página Qualidade dos dados e limitações
- Conteúdo estático (listas de limitações e de perguntas ao docente)
- Testes (fixture 4)

**Critérios de aceitação:**

- [ ] Contagens: linhas duplicadas, linhas a zero, pedidos com 0 un., linhas com tamanho vazio, linhas do CO sem correspondência no PW, ondas sem picking.
- [ ] Decomposição recolhido vs encomendado: ondas sem picking → referências nunca recolhidas em ondas com picking → sem causa conhecida.
- [ ] Lista de localizações não mapeadas com as unidades (RC-01 primeiro).
- [ ] % de ligações repartidas por várias zonas.
- [ ] Linhas com a escala de tamanhos 215–305, marcadas "por confirmar".
- [ ] As listas de limitações e de perguntas ao docente, iguais às da especificação.

**Validação (fixtures e verificações manuais da especificação):**
- Fixture 4: diferença 6 = 3 + 1 + 2; 1 linha duplicada; 2 linhas a zero; 1 pedido com 0 un.
- Dataset completo: 13 003 = 745 + 4 929 + 7 329; RC-01 = 22 979 un.; 6 093 linhas do CO sem correspondência (4,98 %)
- Verificação manual 13

Referência: `docs/spec.md`.
