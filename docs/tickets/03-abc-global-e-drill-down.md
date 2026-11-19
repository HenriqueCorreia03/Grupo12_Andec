# 03: ABC global e drill-down classe → referência → tamanhos

**Grupo:** essencial

**Responsável:** Henrique

**What to build:** O diretor vê na Visão geral quantas referências e que % das unidades cabem em A, B e C. Na página Artigos, clica numa classe para ver as referências e numa referência para ver as unidades por tamanho.

**Blocked by:** 02 (Restantes indicadores mínimos de encomenda)

**Status:** ready-for-agent

**Áreas do código tocadas:**
- Módulo de indicadores (ABC)
- API (endpoints da Visão geral e de Artigos)
- Frontend: página Visão geral (cartão ABC)
- Frontend: página Artigos, ABC e localizações
- Testes (fixtures 1–4, parte ABC)

**Critérios de aceitação:**

- [ ] Unidades por referência sobre as linhas > 0 de pedidos válidos, com duplicados.
- [ ] Ordenação por unidades (decrescente) e, em empate, por código da referência (crescente). A se acumulado antes < 80 %, B se < 95 %, C no resto; a referência que atravessa um limiar fica na classe superior.
- [ ] A classe global (período completo) fica disponível para o filtro de classe (ticket 06a).
- [ ] O drill-down classe → referência → tamanhos funciona na página Artigos; os tamanhos aparecem normalizados.
- [ ] A API devolve, por classe, o nº de referências e a % de unidades.

**Validação (fixtures e verificações manuais da especificação):**
- Fixture 1: AHR20O A, Q50W5L A
- Fixture 2: SYN01–SYN03 A, SYN04 B, SYN05–SYN06 C (limiar, empate, 95 % exato); A 3/85 %, B 1/10 %, C 2/5 %
- Fixture 3: D05ZS7 A, QXS5D1 B, 05W6TK C
- Fixture 4: D1, D2, D4 A; D3 B
- Dataset completo: A 51, B 49, C 108
- Verificações manuais 1 e 5

Referência: `docs/spec.md`.
