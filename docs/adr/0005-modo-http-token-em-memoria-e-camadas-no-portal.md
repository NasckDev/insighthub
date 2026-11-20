# ADR 0005 — Modo http com token em memória, ordenação na API e camadas em portal

- Status: aceito
- Data: 2026-11-20

## Contexto

Uma revisão independente achou três problemas de fundo:

1. O diálogo de Filtros abria fora da tela. O `Modal` era renderizado dentro da barra de filtros, que usa `backdrop-filter`; um ancestral com `backdrop-filter` (ou `transform`) vira o bloco de contenção de `position: fixed`, então o "tela cheia" passava a medir a barra. O axe não detecta isso.
2. O adaptador `http` ignorava o `sort`, não mandava o token do `POST /synthesis` (o provider Claude ficava inalcançável) e disparava dezenas de requisições por troca de filtro, repetindo 400 e 429.
3. A busca era uma substring em ASCII no SQLite e uma substring com acento na demo, e o nome de um tema ("desempenho") não achava nada.

## Decisão

- **Portal para tudo que cobre a página**: `Modal`, folhas, paleta de comandos e toasts usam `createPortal(document.body)`. Um registro de camadas (`modal-layer.ts`) deixa só a camada de cima reagir ao `Esc` e marca `#root` como `inert` enquanto houver camada aberta (foco, ponteiro e leitor de tela ficam dentro). O E2E agora mede a caixa de cada diálogo (`getBoundingClientRect`) em desktop, tablet e celular.
- **`sort` no contrato da API**: `RESPONSE_SORTS`, `sortResponses` e o `sort` do `paginationSchema` vivem no `core`; a API ordena em SQL (ou em memória, quando há busca) e a demo usa a mesma função.
- **Conectar à API**: um diálogo recebe o endereço (só http/https) e um token opcional. Antes de trocar de adaptador ele lê `/api/surveys`, então endereço errado ou CORS bloqueado falham dentro do diálogo. O token fica numa `ref` do `ClientHost`: nunca vai para storage, URL ou bundle, só é enviado no `POST /synthesis` e some ao fechar a aba. 401 e 403 viram `DataError('AUTH')` com a ação "Informar token".
- **Erros**: 4xx não é repetido (só rede e 5xx, com backoff). 429 vira mensagem própria.
- **Carga compartilhada**: sem endpoints de agregação, visão geral, evolução, temas e facetas dividem uma promessa por pesquisa e filtro (60 s, 8 entradas, falha não é guardada). As páginas seguintes são pedidas em paralelo.
- **Busca com a mesma regra nos dois lados**: texto normalizado (minúsculas, sem acento) e temas por palavra inteira, em `core`. A API aplica busca e tema em memória com as mesmas funções do navegador, em vez de `lower()` do SQLite; um teste de paridade compara os dois. Buscar o nome de um tema casa os comentários do tema.
- **Honestidade nos números**: o evento `meta` da síntese traz `sourceCount` (lidas pelo modelo) e `totalCount` (que casam com o filtro), e a API avisa `truncated` quando o limite de 5.000 linhas cortou a seleção.
- **Comentários são dados, nunca instruções**: antes de entrar no prompt ou no texto gerado, o comentário é reduzido a uma linha, sem `<`, `>`, `**` nem `[#` (que forjaria uma citação). O prompt do Claude usa um delimitador aleatório por requisição, citado no system prompt.

## Consequências

- Colocar a camada no `body` exige que estilos globais (tema, fontes) não dependam de estar dentro do `#root`; eles vivem em `html`/`:root`, então nada mudou.
- O cache do adaptador `http` é por instância: trocar de API recria o cliente e começa limpo.
- A ordenação em memória (busca ativa) é limitada pelas 5.000 linhas; acima disso o aviso `truncated` aparece.
