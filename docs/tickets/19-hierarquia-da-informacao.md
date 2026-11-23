# 19: Hierarquia da informação: resumo primeiro, detalhe a pedido

**Grupo:** essencial (apresentação)

**Responsável:** Henrique

**What to build:** Cada página abre com o que importa para o negócio, em poucos números fáceis de ler, e só mostra o detalhe (tabelas longas, grelhas, listas completas) quando o diretor o pede. Na Visão geral aparecem primeiro os KPI; o resto vem por baixo. Nenhuma tabela grande ocupa o ecrã por omissão.

**Blocked by:** nenhum (refaz a apresentação das páginas existentes; convém fazer depois dos tickets de página que estejam em curso, para não haver conflitos em `app/*/page.tsx`)

**Status:** ready-for-agent

**Áreas do código tocadas:**
- Frontend: todas as páginas (`app/page.tsx`, `app/artigos`, `app/ondas`, `app/qualidade`) e componentes partilhados
- `docs/spec.md`: secção das páginas e da interface (registar o princípio e a ordem das secções)
- Backend: só se faltar algum valor-resumo à API (os cálculos continuam no servidor; o frontend não calcula indicadores)

**Critérios de aceitação:**

- [ ] **Faixa de KPI no topo de cada página:** 3 a 6 cartões com o valor principal de cada indicador da página, com tooltip (definição, fonte, comparação) como hoje. Na Visão geral, a faixa de KPI é a primeira coisa a seguir ao título, antes da matriz e da série mensal.
- [ ] **Leitura de uma linha por KPI:** frase curta montada a partir dos valores da API (por exemplo, "51 artigos A, 49 com picking"), sem conclusões escritas à mão que deixem de ser verdade quando os filtros mudam.
- [ ] **Ordem fixa em todas as páginas:** (1) KPI, (2) um gráfico ou resumo visual que explique o principal, (3) detalhe.
- [ ] **Tabelas longas recolhidas:** qualquer tabela com mais de 10 linhas mostra as 10 primeiras (pela ordem do indicador) e um botão "Ver todas (N)" que a abre por inteiro. Aplica-se pelo menos à lista de referências do ABC (208), ao ranking de prioridade (198), à grelha referência × mês da estabilidade (208) e às listas de ondas.
- [ ] **Detalhe técnico recolhido por omissão:** grelhas e decomposições que servem para auditar (por exemplo, a grelha da estabilidade, as listas de localizações não mapeadas) ficam num bloco "Ver detalhe" fechado.
- [ ] **Nada se perde:** todos os valores que hoje aparecem continuam acessíveis (no máximo a um clique); os filtros continuam a aplicar-se a tudo; o drill-down do ABC (classe → referência → tamanhos) continua a funcionar.
- [ ] **Spec atualizada** com o princípio "resumo primeiro, detalhe a pedido", a ordem das secções e a regra das 10 linhas.

**Validação (verificações manuais):**
- Abrir cada página sem filtros: no primeiro ecrã (sem fazer scroll, 1366 × 768) veem-se os KPI e o resumo visual, sem tabelas longas abertas.
- "Ver todas" numa tabela mostra exatamente o mesmo nº de linhas que hoje (ABC: 208; prioridade: 198).
- Com um filtro de período, os KPI e as frases de leitura mudam de acordo com os valores da API.
- Testes do backend continuam a passar (o contrato da API não deve mudar, salvo um campo-resumo acrescentado).

Referência: `docs/spec.md`.
