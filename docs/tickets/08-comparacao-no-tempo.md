# 08: Comparação no tempo e período anterior

**Grupo:** essencial

**Responsável:** Henrique

**What to build:** O diretor vê a evolução mensal por dia com atividade e, no tooltip de cada indicador, a variação face ao período anterior, ou "sem período anterior".

**Blocked by:** 03 (ABC global e drill-down classe → referência → tamanhos); 06a (Filtros globais: período, referência e classe ABC; URL e "sem dados")

**Status:** ready-for-agent

**Áreas do código tocadas:**
- Módulo de indicadores (séries mensais, período anterior)
- API (comparação em todos os endpoints)
- Frontend: página Visão geral (série mensal)
- Frontend: componente de tooltip (variação)
- Frontend: página Artigos (classe no período vs classe global)
- Testes (fixture 4, períodos)

**Critérios de aceitação:**

- [ ] Dia com atividade = dia com ≥ 1 pedido criado (domingos incluídos); é o mesmo para os indicadores de picking, via data da onda.
- [ ] Série mensal janeiro–outubro de 2023, com janeiro e outubro assinalados como meses parciais.
- [ ] Período anterior = intervalo com a mesma duração imediatamente antes (mês selecionado → mês anterior). Os indicadores de volume comparam-se por dia com atividade; os rácios comparam-se diretamente.
- [ ] Período anterior antes da data mínima dos dados → "sem período anterior".
- [ ] O ABC recalcula-se no período, rotulado como "classe no período", ao lado da "classe global"; o filtro de classe continua a usar a global.

**Validação (fixtures e verificações manuais da especificação):**
- Fixture 4: fevereiro → "sem período anterior"; março → tamanho médio 3,0 vs 3,0 (0 %); por dia com atividade: pedidos 1 vs 3, unidades 3 vs 9 (−66,67 %)
- Dataset completo: 178 dias com atividade (17 em março, 19 em fevereiro)
- Verificações manuais 2, 3, 4 e 6

Referência: `docs/spec.md`.
