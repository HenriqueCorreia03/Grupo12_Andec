# Evidência. (site de apresentação)

Página de scroll, ao estilo de uma apresentação, que compara as duas ideias do enunciado (reorganizar as
localizações ou mudar as ondas de picking) em três critérios, com os números reais do projeto.

É uma aplicação **à parte do dashboard**: não importa nada de `apps/frontend`, não está nos workspaces da raiz e só
lê a API do backend. Para a retirar, basta apagar esta pasta e o comando `dev:evidencia` do `package.json` da raiz.

## Como correr

1. O PostgreSQL e o backend têm de estar a correr (`npm run dev:backend` na raiz), como para o dashboard.
2. Copiar `.env.local.example` para `.env.local` (URL da API).
3. Na raiz do repositório: `npm run dev:evidencia` e abrir <http://localhost:3002>.

Usa o Next e o React já instalados na raiz do repositório (não precisa de `npm install` aqui).

A primeira leitura dos números demora cerca de 10 s (a rota `app/api/numeros` junta vários indicadores do backend);
depois fica guardada e a página abre de imediato. Antes de apresentar, abrir a página uma vez e esperar pelos números.

## Apresentar

- **→**, **PageDown** ou **espaço** avançam um passo; **←** ou **PageUp** recuam. Um comando de slides também funciona.
- **F** põe em ecrã inteiro; **Esc** sai.
- O contador no canto inferior direito mostra o passo (13 no total; o duelo tem um passo por critério).
- Com "reduzir movimento" ativo no sistema, as animações desligam-se.

## Conteúdo

- `public/evidencia.html`: a página (HTML, CSS e JavaScript num só ficheiro; three.js pelo jsDelivr).
- `app/api/numeros/route.ts`: os números da página, lidos do backend.
- `public/modelos/evidencia/`: os 4 modelos 3D (gerados com o Hyper3D, texturas reduzidas).
