# 07: Ligação CO ↔ PW e zona das unidades encomendadas

**Grupo:** essencial

**Responsável:** Eduardo

**What to build:** O diretor filtra por zona também nos indicadores de encomenda, e vê a % de pedidos multizona, a partir da ligação onda + referência + tamanho com repartição proporcional.

**Blocked by:** 04 (ETL do picking e indicadores de onda); 06b (Filtro de operador e regra das medidas aditivas vs propriedades de entidade)

**Status:** ready-for-agent

**Áreas do código tocadas:**
- Módulo de indicadores (ligação e repartição)
- Contrato de filtros da API (zona)
- Frontend: painel de filtros (zona)
- Frontend: página Artigos (multizona)
- Testes (fixtures 3 e 4)

**Critérios de aceitação:**

- [ ] Para cada chave (onda, referência, tamanho normalizado), o recolhido em cada localização reparte-se pelos pedidos proporcionalmente às unidades encomendadas.
- [ ] A falta de picking reparte-se da mesma forma e fica "sem zona"; as linhas sem chave (tamanho vazio, referência nunca recolhida, onda sem picking) ficam inteiras "sem zona"; as unidades em localizações não mapeadas ficam "não mapeada".
- [ ] Arredondamento só na apresentação.
- [ ] Filtro de zona: um pedido conta na zona se tiver mais de 0 un. atribuídas a ela.
- [ ] Pedidos multizona = pedidos válidos com ≥ 2 zonas mapeadas ÷ pedidos válidos ("não mapeada" não conta como zona).

**Validação (fixtures e verificações manuais da especificação):**
- Fixture 3: multizona 50 % (100146: zonas O e J)
- Fixture 4: repartição do D1 10,5 (P1: K 2, não mapeada 0,6667, sem zona 1,3333; P2: K 1, não mapeada 0,3333, sem zona 1,6667); zona K: 3 pedidos, 5 un., tamanho médio 1,6667; multizona 0 %
- Verificação manual 8

Referência: `docs/spec.md`.
