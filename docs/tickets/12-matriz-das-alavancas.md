# 12: Matriz das duas alavancas

**Grupo:** essencial

**Responsável:** Eduardo

**What to build:** O diretor vê na Visão geral a matriz impacto × esforço × robustez, com as notas, a medida que deu origem a cada uma e as justificações.

**Blocked by:** 03 (ABC global e drill-down classe → referência → tamanhos); 05 (Pedidos divididos (inevitáveis vs evitáveis)); 07 (Ligação CO ↔ PW e zona das unidades encomendadas)

**Status:** ready-for-agent

**Áreas do código tocadas:**
- ETL (ficheiro de configuração do esforço)
- Módulo de indicadores (impacto e robustez)
- API (endpoint da Visão geral)
- Frontend: página Visão geral (matriz)
- Testes (valores de referência)

**Critérios de aceitação:**

- [ ] Impacto (a) = % das paragens de artigos A feitas fora das 3 localizações mais usadas do artigo (ranking por paragens, unidades e código), com a sensibilidade para 1 e 5 localizações.
- [ ] Impacto (b) = % dos pedidos válidos divididos com ≤ 24 un., com a sensibilidade em unidades.
- [ ] Robustez (a) = % das unidades recolhidas em localizações mapeadas; robustez (b) = % das linhas do CO com correspondência no PW, com o aviso "colada ao limiar dos 95 %".
- [ ] Limiares do impacto: < 10 % / 10–30 % / ≥ 30 %. Limiares da robustez: < 85 % / 85–95 % / ≥ 95 %.
- [ ] Esforço carregado pelo ETL a partir do ficheiro de configuração versionado ((a) = 1, alto; (b) = 2, médio; com as justificações da especificação), rotulado como juízo da equipa.
- [ ] A matriz mostra potencial observado, nunca ganhos esperados.

**Validação (fixtures e verificações manuais da especificação):**
- Dataset completo: impacto (a) 72,15 % → 3 (89,17 % / 57,84 % com 1 / 5 localizações); impacto (b) 7,74 % → 1 (13,01 % em unidades → 2); robustez (a) 89,03 % → 2; robustez (b) 95,02 % → 3
- Matriz: (a) 3 / 2 / 1; (b) 1 / 3 / 2

Referência: `docs/spec.md`.
