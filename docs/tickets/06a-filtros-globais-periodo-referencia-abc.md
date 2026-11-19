# 06a: Filtros globais: período, referência e classe ABC; URL e "sem dados"

**Grupo:** essencial

**Responsável:** Pedro

**What to build:** O diretor filtra por período, referência e classe ABC global num painel comum às 4 páginas. A seleção mantém-se ao mudar de página e fica no URL, e uma seleção sem linhas mostra "sem dados".

**Blocked by:** 03 (ABC global e drill-down classe → referência → tamanhos); 04 (ETL do picking e indicadores de onda); 05 (Pedidos divididos (inevitáveis vs evitáveis))

**Status:** ready-for-agent

**Áreas do código tocadas:**
- Contrato de filtros da API (parâmetros comuns)
- Módulo de indicadores (aplicação dos filtros)
- Frontend: painel de filtros
- Frontend: todas as páginas (ligação ao painel)
- Testes (fixtures 1 e 4, filtros)

**Critérios de aceitação:**

- [ ] Todos os endpoints aceitam os mesmos parâmetros de filtro (período início/fim, referência, classe ABC).
- [ ] Período = data de criação do pedido; nos indicadores de picking, a data da onda.
- [ ] A classe ABC do filtro é a classe global do período completo, fixa.
- [ ] Os filtros aplicam-se a todos os cartões e gráficos da página e o painel mostra sempre os filtros ativos.
- [ ] Os filtros persistem no URL e mantêm-se entre páginas.
- [ ] Uma seleção sem linhas devolve e mostra "sem dados", nunca 0 nem um erro.

**Validação (fixtures e verificações manuais da especificação):**
- Fixture 1: filtro de referência Q50W5L → 2 un., 1 pedido, tamanho médio 2
- Fixture 4: filtro de fevereiro → 9 un., tamanho médio 3,0
- Verificações manuais 10 e 11

Referência: `docs/spec.md`.
