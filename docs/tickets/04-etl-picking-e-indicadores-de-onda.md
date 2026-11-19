# 04: ETL do picking e indicadores de onda

**Grupo:** essencial

**Responsável:** Eduardo

**What to build:** O diretor vê a ocupação das ondas face à capacidade de referência de 24 un., as paragens, as localizações distintas por onda, a participação por zona e as unidades recolhidas em localizações não mapeadas (RC-01 em separado).

**Blocked by:** 01 (Fatia ponta a ponta: tamanho médio da encomenda)

**Status:** ready-for-agent

**Áreas do código tocadas:**
- Esquema da BD (PW, `Storage_Location`)
- ETL (PW, `Storage_Location`)
- Módulo de indicadores (picking)
- API (endpoint de Ondas e pedidos)
- Frontend: página Ondas e pedidos (gráfico de ocupação)
- Frontend: página Artigos (participação por zona)
- Testes (fixtures 1, 3 e 4, parte PW)

**Critérios de aceitação:**

- [ ] O ETL carrega o PW (1 linha = 1 un.; não se aplica nenhuma regra de duplicados) e o `Storage_Location`, com um leitor de CSV que respeita aspas (`"368, 0, 1"`).
- [ ] Localização mapeada = existe no `Storage_Location`; zona = prefixo antes do 1.º hífen, só nas mapeadas; as outras são "não mapeada", com o RC-01 em separado.
- [ ] Data da onda = data dos seus pedidos (CO); hora da onda = hora de criação mais antiga.
- [ ] Ocupação = unidades recolhidas ÷ 24 × 100: média, distribuição, % de ondas com 24 e ondas com > 24.
- [ ] Paragens = pares distintos (onda, localização); localizações distintas por onda: média, mediana e distribuição.
- [ ] Participação por zona sobre as unidades recolhidas em localizações mapeadas; as não mapeadas aparecem à parte, com a % sobre o total recolhido.
- [ ] O ETL continua idempotente.

**Validação (fixtures e verificações manuais da especificação):**
- Fixture 1: ocupação 29,1667 %; 4 paragens; K 100 %
- Fixture 3: ocupação 100 % e 95,8333 % (média 97,9167 %); 6 paragens; zonas K 91,4894 %, O 6,3830 %, J 2,1277 %
- Fixture 4 (parte PW): ocupação 20,8333 % e 4,1667 % (média 12,5 %); 3 paragens; não mapeadas 1 un. (16,6667 %)
- Dataset completo: ocupação média 92,37 %; 103 706 paragens; 10,97 % das unidades em localizações não mapeadas

Referência: `docs/spec.md`.
