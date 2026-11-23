# 20: [Extra] Limiares de negócio para os KPI (cores verde/amarelo/vermelho)

**Grupo:** extra (decisão da equipa antes de código)

**Responsável:** por decidir

**What to build:** O diretor vê, em cada KPI, se o valor é bom, aceitável ou mau para o negócio, com cores verde, amarelo e vermelho. Hoje só a matriz das alavancas tem cores, porque só as notas da matriz têm limiares definidos na spec. Para os outros KPI não há meta definida: antes de qualquer cor é preciso decidir e registar os limiares.

**Blocked by:** 19 (Hierarquia da informação); decisão da equipa sobre os limiares (e, se preciso, pergunta ao docente)

**Status:** needs-decision

**Decisões a tomar (uma linha por KPI candidato):**

| KPI | Pergunta | Proposta de partida (a validar) |
|---|---|---|
| Ocupação média das ondas | A partir de que % uma onda está "bem cheia"? | por decidir |
| Pedidos divididos (≤ 24 un., evitáveis) | Que % de divisões evitáveis é aceitável? | por decidir |
| Localizações distintas por artigo A | Quantas localizações por artigo A são aceitáveis? | por decidir |
| Estabilidade do ABC | Que % de mudanças de classe ainda permite confiar no ABC? | por decidir |
| Localizações não mapeadas | Que % do recolhido sem mapeamento invalida a análise por zona? | já existe o limiar da robustez (a) na matriz: reutilizar? |
| Linhas do CO sem correspondência no PW | Idem | já existe o limiar da robustez (b) na matriz (95 %): reutilizar? |

**Áreas do código tocadas (depois da decisão):**
- Backend: os limiares num ficheiro de configuração, como o esforço da matriz, e a classificação (verde/amarelo/vermelho) devolvida pela API, para o frontend não decidir nada
- Frontend: cor no `CartaoIndicador`, sempre com o número e uma palavra ao lado (a cor nunca vai sozinha)
- `docs/spec.md`: tabela de limiares, com a origem de cada um (spec, enunciado, decisão da equipa ou resposta do docente)

**Critérios de aceitação:**

- [ ] Cada limiar está na spec, com a origem.
- [ ] A classificação vem da API (testada pela API com fixtures, como os outros indicadores); o frontend só pinta.
- [ ] Um KPI sem limiar decidido fica sem cor.
- [ ] A cor nunca é a única pista: número e palavra ("bom", "aceitável", "mau") ao lado.

Referência: `docs/spec.md` (secção "Páginas", princípio "resumo primeiro, detalhe a pedido"; matriz das alavancas).
