# 10: Alavanca (a): prioridade dos artigos e estabilidade do ABC

**Grupo:** essencial

**Responsável:** Henrique

**What to build:** O diretor vê as referências ordenadas pelo critério de prioridade da alavanca (a), de quantas localizações sai cada artigo A, e a estabilidade mensal da classificação ABC.

**Blocked by:** 03 (ABC global e drill-down classe → referência → tamanhos); 04 (ETL do picking e indicadores de onda); 08 (Comparação no tempo e período anterior)

**Status:** ready-for-agent

**Áreas do código tocadas:**
- Módulo de indicadores (ABC mensal, ranking de artigos)
- API (endpoint de Artigos)
- Frontend: página Artigos, ABC e localizações
- Testes (fixture 3 + valores de referência)

**Critérios de aceitação:**

- [ ] Ranking por nº de paragens do artigo (pares distintos onda × localização), por ordem decrescente; desempate pelo nº de localizações distintas e depois pelo código.
- [ ] Localizações distintas por artigo, com o RC-01 contado como 1 e a limitação indicada.
- [ ] ABC mensal independente; % de referências que mudam de classe entre meses consecutivos; ficam de fora as combinações referência-mês com < 10 un. (nº e % excluídos visíveis).

**Validação (fixtures e verificações manuais da especificação):**
- Fixture 3: paragens por artigo coerentes com as 6 paragens da fixture
- Dataset completo: 51 artigos A (49 com picking)
- Verificação manual: ranking e estabilidade apresentados com o limiar de 10 un.

Referência: `docs/spec.md`.
