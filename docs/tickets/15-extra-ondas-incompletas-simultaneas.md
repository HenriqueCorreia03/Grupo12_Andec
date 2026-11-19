# 15: [Extra] Ondas incompletas simultâneas (P6)

**Grupo:** extra

**Responsável:** Pedro (proposto)

**What to build:** O diretor vê quantas ondas com < 24 un. foram criadas no mesmo dia e na mesma hora que outras ondas incompletas, e quantos pedidos divididos envolvem. É uma observação medida, não uma simulação.

**Blocked by:** 05 (Pedidos divididos (inevitáveis vs evitáveis)); 11 (Alavanca (b): carga e pedidos divididos por período)

**Status:** ready-for-agent

**Áreas do código tocadas:**
- Módulo de indicadores (picking + encomenda)
- Frontend: página Ondas e pedidos

**Critérios de aceitação:**

- [ ] Onda incompleta = < 24 un. recolhidas; hora da onda = hora de criação mais antiga dos seus pedidos.
- [ ] Mostra o nº de ondas incompletas simultâneas e o nº de pedidos divididos que as envolvem.
- [ ] Rótulo explícito: observação, não ganho esperado.

**Validação (fixtures e verificações manuais da especificação):**
- Dataset completo: 2 745 ondas do PW (28,3 %) com < 24 un.

Referência: `docs/spec.md`.
