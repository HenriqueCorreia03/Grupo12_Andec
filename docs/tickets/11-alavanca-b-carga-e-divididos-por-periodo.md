# 11: Alavanca (b): carga e pedidos divididos por período

**Grupo:** essencial

**Responsável:** Pedro

**What to build:** O diretor vê os pedidos divididos por mês, dia da semana e hora, ordenados pelo critério de prioridade da alavanca (b), a carga por período com os domingos assinalados e a carga por operador rotulada "carga, não desempenho".

**Blocked by:** 05 (Pedidos divididos (inevitáveis vs evitáveis)); 08 (Comparação no tempo e período anterior)

**Status:** ready-for-agent

**Áreas do código tocadas:**
- Módulo de indicadores (agregação por período, carga por operador)
- API (endpoint de Ondas e pedidos)
- Frontend: página Ondas e pedidos
- Testes (fixture 4)

**Critérios de aceitação:**

- [ ] Ranking por nº absoluto de pedidos divididos por período; segundo critério = ocupação média, por ordem crescente; meses por dia com atividade.
- [ ] Carga (pedidos, unidades, ondas) por hora, dia da semana e mês, com os domingos assinalados.
- [ ] Carga por operador recolhedor (unidades e ondas), com o rótulo "carga, não desempenho".

**Validação (fixtures e verificações manuais da especificação):**
- Fixture 4: 1 pedido dividido (P5) em 02/02/2023, às 10h
- Dataset completo: pedidos por dia da semana (domingo = 348 pedidos em 5 dias)
- Verificação manual da carga por período e por operador

Referência: `docs/spec.md`.
