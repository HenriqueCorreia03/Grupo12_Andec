# 20: [Extra] Diagnóstico na Visão geral: o que está bem, o que está mal e o que fazer

**Grupo:** extra (apresentação)

**Responsável:** Henrique

**What to build:** Na página inicial, o diretor percebe num relance o que está bem, o que está mal e o que pode fazer, sem ter de ler a matriz. Cores verde/amarelo/vermelho só onde a spec define limiares; o resto fica descritivo, sem cor. O detalhe continua disponível por baixo.

**Blocked by:** 19 (Hierarquia da informação)

**Status:** ready-for-agent

**Decisões (tomadas com a equipa em 23/11/2026):**
- Não se inventam metas. Os limiares de bom/mau são os que a spec já tem: impacto e robustez das duas alavancas (matriz). Os KPI sem meta (tamanho médio, pedidos por onda, volume, estabilidade, ocupação…) ficam sem cor, rotulados "descritivos".
- Uma só regra de cores: vermelho = precisa de ação; amarelo = atenção; verde = está bem. No impacto a escala inverte-se (nota 3 = muito a melhorar = vermelho). A matriz usa a mesma regra.
- A frase "o que fazer" é fixa por estado e fica na spec; o estado vem da nota que a API já calcula.

**Áreas do código tocadas:**
- Frontend: `components/diagnostico.tsx` (novo), `lib/estado.ts` (novo: nota → estado, palavra e cor), `components/matriz-alavancas.tsx`, `app/page.tsx`, âncora em `app/artigos/page.tsx`
- `docs/spec.md`: regra das cores e tabela do diagnóstico (secção "Páginas")
- Backend: nenhum (as notas já vêm da API e estão testadas)

**Critérios de aceitação:**

- [ ] Na Visão geral, o diagnóstico é a primeira coisa a seguir ao título: 4 cartões (dispersão dos artigos A, divididos evitáveis, dados das localizações, ligação encomenda ↔ picking), cada um com o valor, o estado (cor + palavra) e o que fazer, com ligação para o detalhe.
- [ ] As cores seguem a regra única e vêm da nota da API; a cor nunca vai sozinha.
- [ ] A matriz usa a mesma regra de cores (impacto 3 a vermelho).
- [ ] Os indicadores sem meta ficam sem cor e rotulados "descritivos".
- [ ] A spec tem a regra das cores e a tabela das ações.

**Validação (verificações manuais):**
- Dataset completo: dispersão (a) 72,15 % vermelho; divididos evitáveis 7,74 % verde; localizações mapeadas 89,03 % amarelo; ligação 95,02 % verde com aviso "colado ao limiar".
- As ligações abrem a secção certa (ranking de prioridade, pedidos divididos por período, qualidade) e mantêm os filtros.
- Testes do backend continuam a passar.

Referência: `docs/spec.md` (secção "Páginas", "Diagnóstico da Visão geral"; matriz em "Critérios de prioridade").
