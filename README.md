# InsightHub · da pesquisa à decisão

[![CI](https://github.com/NasckDev/insighthub/actions/workflows/ci.yml/badge.svg)](https://github.com/NasckDev/insighthub/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
![Node](https://img.shields.io/badge/Node-%3E%3D22-339933)
![License](https://img.shields.io/badge/license-MIT-green)

Workspace editorial para times de pesquisa e produto: ler o NPS, ouvir o que as pessoas dizem, comparar segmentos, pedir uma síntese **com fontes clicáveis** e guardar o que virou decisão. Toda afirmação da síntese aponta para o id da resposta que a sustenta.

> Todos os dados são **100% fictícios** (seed determinístico com o produto inventado "Atlas Analytics").

## Demo no navegador

A interface roda **100% no navegador**, sem servidor: o mesmo `core` (NPS, filtros, temas, comparação, síntese extrativa) processa o seed fictício localmente, com latência simulada. Demo publicada: <https://nasckdev.github.io/insighthub/>.

| Painel: NPS em medidor, evolução, temas e falas | Comparar segmentos com aviso de amostra pequena |
| --- | --- |
| ![Painel da pesquisa no desktop](docs/prints/visao-geral-desktop.png) | ![Comparação de segmentos com barras divergentes e aviso de amostra pequena](docs/prints/comparar-amostra-pequena-desktop.png) |

| Síntese com a citação aberta ao lado | Celular (390 px) |
| --- | --- |
| ![Síntese com citação clicável abrindo a resposta-fonte](docs/prints/sintese-citacao-desktop.png) | ![Painel no celular](docs/prints/visao-geral-celular.png) ![Síntese no celular](docs/prints/sintese-celular.png) |

| Mapa de temas com drill-down | Tema escuro | Quadro de insights |
| --- | --- | --- |
| ![Mapa de temas com o tema Suporte aberto](docs/prints/temas-desktop.png) | ![Painel no tema escuro](docs/prints/visao-geral-escuro-desktop.png) | ![Quadro com um insight salvo](docs/prints/quadro-desktop.png) |

Outros prints em [`docs/prints/`](docs/prints): diálogo de Filtros (`filtros-desktop.png`, `filtros-celular.png`), respostas com facetas (`respostas-desktop.png`), temas no escuro (`temas-escuro-desktop.png`) e as telas de celular (`temas-celular.png`, `quadro-celular.png`, `visao-geral-escuro-celular.png`).

## O que existe em cada tela

- **Painel**: medidor de NPS com as quatro zonas de leitura, evolução semanal em área suave, distribuição das notas, temas principais com sentimento e **falas em destaque**. Filtros de período, plano, região, função, tema e busca vivem na URL (`#/s/s-atlas-q3/visao-geral?plan=pro&theme=suporte&from=2026-08-10`) e são validados pelos schemas Zod do `core`.
- **Respostas**: tabela com **facetas e contagens ao vivo**, busca com o termo destacado, ordenação, paginação, tags de tema e sentimento, e **painel lateral de detalhe** (folha inferior no celular). No celular a tabela vira lista de cartões.
- **Temas**: **treemap** em que a área é o volume e a cor/ícone é o sentimento. Clicar abre o drill-down com as falas, e dali você vai para a tabela filtrada ou pede a síntese só daquele tema.
- **Comparar**: segmentos por plano, região ou função em **barras divergentes** contra o NPS geral, cartões lado a lado, destaque da maior diferença e **aviso de amostra pequena** (menos de 10 respostas): o segmento aparece listrado e com selo, nunca escondido.
- **Síntese com IA**: cinco **modelos de pergunta** (resumo executivo, por que há detratores, o que os promotores valorizam, risco no plano Free, oportunidades), streaming com **cancelar** e **tentar de novo**, citações `[#id]` clicáveis que abrem a resposta e **salvar no quadro**.
- **Quadro de insights**: cards com título e nota editáveis, exclusão com **desfazer**, exportação em **Markdown e CSV** e **link compartilhável** que outra pessoa pode importar.
- **Em todo lugar**: paleta de comandos (`Ctrl/⌘ K`) com busca real nos comentários, atalhos documentados no modal `?` (`G` e uma letra para ir a cada tela, `/` para buscar, `T` para o tema), tour opcional de 3 passos (um chip discreto no Painel, que nunca abre sozinho), tema claro/escuro com a escolha lembrada, toasts, esqueletos com brilho e ilustrações próprias nos estados vazios e de erro.
- **Estados**: carregando, vazio, erro com "Tentar de novo" e resultado parcial em todas as telas. O seletor **Simular** na faixa da demo força "falhar a próxima chamada" e "respostas parciais".

## Identidade

Fraunces nos títulos, nos números de destaque e nas falas dos clientes; Inter na interface. Papel `#FBF8F3`, tinta `#1B1B3A`, petróleo `#0F766E`, coral `#E8604C`, âmbar e ameixa de apoio; escuro com fundo `#0E1514`. Cantos de 10 a 14 px, linhas finas e sombras leves. As decisões estão no [ADR 0003](docs/adr/0003-identidade-editorial-e-graficos-proprios.md).

## Acessibilidade

Meta WCAG 2.2 AA, verificada com ferramenta e não por impressão:

- **Contraste calculado nos dois temas**: `apps/web/src/lib/contrast.test.ts` lê os tokens de `styles.css` e confere 29 pares (4,5:1 para texto, 3:1 para gráficos e controles). Ele provou que o âmbar da marca falhava (2,4:1) e o gráfico passou a usar um tom mais escuro.
- **axe-core sem violações** em todas as telas, nos dois temas, em 360, 768, 1024 e 1440 px, e nos diálogos (a geometria de cada um, dentro da viewport, também é medida no E2E, porque o axe não vê um diálogo fora da tela); alvos de toque de 44 px em dispositivos de toque, e no painel de detalhe e na paleta de comandos (E2E com `@axe-core/playwright`).
- Teclado completo: link "Pular para o conteúdo", foco visível, modais com foco preso, `Esc` fecha e devolve o foco a quem abriu; gráficos focáveis que se percorrem com as setas.
- Cor nunca é o único sinal (ícone e palavra em faixas e sentimentos), alvos de 44 px em dispositivos de toque, `safe-area-inset` respeitado, sem rolagem horizontal de 320 a 1440 px.
- Todo gráfico tem descrição para leitor de tela e **alternativa em tabela**. Animações desligam com `prefers-reduced-motion`.

### Camada de dados e "Conectar à API"

A UI só conhece a interface `DataClient` (`apps/web/src/data/types.ts`), com dois adaptadores:

- `demo` (padrão): roda o `core` no navegador sobre o seed, com latência e falhas simuláveis.
- `http`: fala com a `apps/api`. Entra pelo botão **Conectar à API** (sidebar, menu "Mais" ou paleta de comandos) ou por `VITE_API_URL`.

No diálogo você informa o endereço (só `http://` ou `https://`) e, se a API exigir, o token. O diálogo confere o endereço lendo `/api/surveys` antes de trocar de adaptador. **O token fica só na memória da aba**: não vai para storage, para a URL nem para o bundle, e só é enviado no `POST /synthesis`. Um 401 ou 403 vira uma mensagem clara com a ação "Informar token"; erros 4xx não são repetidos (só falha de rede e 5xx, com backoff). A ordenação da tabela, a busca e o tema são resolvidos na API com as mesmas funções do navegador, e as telas que dependem de todas as respostas dividem uma única carga por pesquisa e filtro.

```bash
npm run dev:mock -w @insighthub/web      # demo, mesmo que exista VITE_API_URL
npm run dev -w @insighthub/web           # demo; com VITE_API_URL em apps/web/.env.local usa a API
```

### Build portátil (qualquer subpath)

O build usa `base: './'` e roteamento por **hash** (`#/...`), então funciona em qualquer subpath e recarrega em qualquer rota sem regra de rewrite no servidor:

```bash
npm run build:portable      # gera apps/web/dist e falha se o index.html tiver URL absoluta
```

Copie `apps/web/dist` para onde quiser (ex.: `<site>/projetos/insighthub/`) e sirva como arquivos estáticos. O workflow [`pages.yml`](.github/workflows/pages.yml) publica essa mesma pasta no GitHub Pages a cada push em `main` que toque o web ou o core.

## Desempenho

Rotas carregadas sob demanda: cada tela é um chunk próprio. A paleta de comandos, o modal de atalhos, o cartão do tour e o motor de animação (`LazyMotion` com features assíncronas) só são baixados quando precisam. O seed fictício vem em um chunk à parte (`import()` no `main.tsx`), e o contador animado usa `requestAnimationFrame` em vez da função `animate` da biblioteca de animação, o que tirou esse motor do primeiro carregamento. O pacote `core` declara `sideEffects: false` e os chunks de vendor têm nomes próprios (`vendor-react`, `vendor-tanstack`, `vendor-zod`).

Medido com gzip nível 9 sobre o `apps/web/dist` do build portátil:

| | Antes da revisão | Agora |
| --- | --- | --- |
| JavaScript do primeiro carregamento (os arquivos que o `index.html` baixa) | 199,5 kB | **173,6 kB** (−13%) |
| Seed e cliente da demo (chunk à parte, lido logo no início) | dentro dos 199,5 kB | 8,0 kB |
| Motor de animação (depois da primeira pintura) | dentro dos 199,5 kB | 18,3 kB |
| CSS | 8,2 kB | 8,3 kB |
| Telas sob demanda: Painel / Síntese / Quadro / Comparar / Temas / Respostas | 6,4 / 4,3 / 2,9 / 3,0 / 2,4 / 2,0 kB | 6,4 / 4,8 / 3,3 / 3,1 / 2,6 / 2,2 kB |
| Paleta de comandos (sob demanda) | no primeiro carregamento | 2,5 kB |
| Fontes WOFF2 (latim, sem CDN) | 130,5 kB | 130,5 kB |

Os vendors principais continuam necessários para desenhar a primeira tela: React 65,8 kB, TanStack 34,8 kB e Zod 23,1 kB (valida os filtros da URL). `apps/web/dist` inteiro: 836 kB em disco, 46 arquivos.

## Arquitetura

```mermaid
flowchart LR
  subgraph web[apps/web - React 19]
    R[TanStack Router<br/>filtros tipados na URL] --> Q[TanStack Query<br/>cache e invalidação]
    S[Síntese<br/>AbortController]
    B[Quadro de insights<br/>localStorage + Zod]
  end
  subgraph api[apps/api - Hono]
    V[Zod na borda] --> REP[Repositório Drizzle]
    SSE[POST /synthesis<br/>SSE] --> P{InsightProvider}
    P -->|sem chave| L[Local extrativo<br/>determinístico]
    P -->|ANTHROPIC_API_KEY| C[Claude<br/>retry + backoff]
  end
  core[(packages/core<br/>regras puras + schemas)]
  DB[(SQLite / libSQL)]
  Q -->|REST paginado| V
  S -->|fetch + stream| SSE
  REP --> DB
  web -.-> core
  api -.-> core
```

`packages/core` concentra as regras puras e os **schemas Zod compartilhados**: o mesmo schema de filtros valida a query string na API e os search params da URL na web. Também vivem ali a análise de temas e sentimento, as facetas, as falas em destaque, os modelos de pergunta da síntese, o treemap (`squarify`) e o domínio do quadro de insights (exportação Markdown/CSV e link compartilhável).

## Rodando localmente

Pré-requisito: Node 22+.

```bash
npm install
cp .env.example .env            # opcional
npm run db:setup -w @insighthub/api   # cria o SQLite e aplica o seed fictício
npm run start -w @insighthub/api      # http://localhost:3333
npm run dev:mock                      # só a interface, com dados no navegador
```

### Variáveis de ambiente

Veja [.env.example](.env.example). Nenhum segredo fica no código: `ANTHROPIC_API_KEY` é lida do ambiente e é **opcional** — sem ela a API usa o provider local determinístico.

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3333` | Porta da API |
| `DATABASE_URL` | `file:./insighthub.db` | URL libSQL (arquivo local por padrão) |
| `CORS_ORIGINS` | `http://localhost:5173` | Origens permitidas (lista separada por vírgula) |
| `RATE_LIMIT_PER_MINUTE` | `120` | Limite geral por cliente |
| `SYNTHESIS_LIMIT_PER_MINUTE` | `10` | Limite do endpoint de síntese |
| `ANTHROPIC_API_KEY` | — | Ativa o provider Claude |
| `ANTHROPIC_MODEL` | `claude-sonnet-5-5` | Modelo usado pelo provider Claude (configurável; o padrão é o mais leve da família que atende a tarefa) |
| `INSIGHTHUB_API_TOKEN` | — | Token Bearer (mín. 16 caracteres) exigido no `POST /synthesis`. **Obrigatório** com `ANTHROPIC_API_KEY`: a API se recusa a subir sem ele |
| `VITE_API_URL` | — | Só no web (`apps/web/.env.local`). Vazio: demo no navegador |

## API

Todas as respostas JSON usam o envelope `{ success, data, error, meta }`.

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/health` | Status e provider ativo |
| GET | `/api/surveys` | Pesquisas com total de respostas e NPS |
| GET | `/api/surveys/:id` | Pesquisa com perguntas (NPS, escolha única, múltipla, aberta) |
| GET | `/api/surveys/:id/responses` | Respostas paginadas. Filtros: `plan`, `region`, `role` (listas por vírgula), `nps`, `theme`, `from`, `to` (datas reais `AAAA-MM-DD`), `q` (sem acento e por tema), `sort` (`recent`, `oldest`, `score-desc`, `score-asc`), `page`, `pageSize` (≤ 100). `meta.truncated` avisa quando o limite de 5.000 linhas cortou a busca |
| GET | `/api/surveys/:id/responses/:responseId` | Resposta-fonte (destino das citações) |
| GET | `/api/surveys/:id/compare?dimension=plan\|region\|role` | NPS e distribuição por segmento, com flag de amostra pequena |
| POST | `/api/surveys/:id/synthesis` | Síntese em **SSE** (`meta`, `delta`, `citation`, `done`, `error`). Corpo: `{ "filters": {...}, "focus": "overview\|problems\|strengths\|opportunities" }`. O evento `meta` traz `sourceCount` (lidas pelo modelo) e `totalCount` (que casam com o filtro). Com `INSIGHTHUB_API_TOKEN` definido exige `Authorization: Bearer <token>` (401 sem ele). Corpo que não é JSON responde 400 |

Exemplo:

```bash
curl "http://localhost:3333/api/surveys/s-atlas-q3/compare?dimension=plan&region=sul,sudeste"
curl -N -X POST http://localhost:3333/api/surveys/s-atlas-q3/synthesis \
  -H "content-type: application/json" -d '{"filters":{"plan":["free"]},"focus":"problems"}'
```

## Decisões

- **Filtros persistidos na URL** para visões compartilháveis — o schema de filtros vive no `core` e é reutilizado na borda da API. ([ADR 0002](docs/adr/0002-filtros-na-url-e-schemas-compartilhados.md))
- **`InsightProvider`** como contrato da síntese: provider local extrativo (temas, sentimento e citação representativa com id da resposta) e provider Claude opcional. ([ADR 0001](docs/adr/0001-insight-provider-com-fallback-local.md))
- **Identidade editorial, contraste provado em teste e gráficos em SVG próprio.** ([ADR 0003](docs/adr/0003-identidade-editorial-e-graficos-proprios.md))
- **Quadro de insights local, exportação segura e link compartilhável sem servidor.** ([ADR 0004](docs/adr/0004-quadro-de-insights-local-e-link-compartilhavel.md))
- **Modo http com token em memória, `sort` na API, carga compartilhada e camadas em portal**: ([ADR 0005](docs/adr/0005-modo-http-token-em-memoria-e-camadas-no-portal.md))
- **Rastreabilidade**: citações `[#id]` geradas pelo modelo são validadas contra o conjunto de fontes enviado; ids inexistentes são descartados e a citação usa o texto real da resposta, nunca o texto do modelo. Na interface, só id confirmado por um evento `citation` vira botão.
- **Cancelamento e retry**: o cancelamento do cliente aborta o stream (AbortController ponta a ponta); o retry com backoff exponencial só reexecuta erros transitórios (429, 5xx, conexão) e respeita o abort.
- **Segurança**: o `POST /synthesis` exige token Bearer (comparação em tempo constante, checada antes do rate limit) e a API **não sobe** com `ANTHROPIC_API_KEY` sem `INSIGHTHUB_API_TOKEN`, para que ninguém dispare chamadas pagas. O token é segredo de servidor: o front estático **não** o embute (variáveis `VITE_*` vão para o bundle público), então a demo publicada usa o provider local. Além disso: validação Zod em toda entrada (inclusive o link compartilhado do quadro), ids com regex restrita, busca parametrizada com `instr()`, CORS por lista de origens, `secureHeaders`, limite de corpo de 16 KB, rate limit por IP, comentários tratados como dados no prompt, texto de síntese renderizado como React (nunca HTML), CSV com neutralização de fórmulas e comentários reduzidos a uma linha, sem `<`, `>`, `**` nem `[#`, antes de entrar no prompt ou no texto gerado (o prompt do Claude usa um delimitador aleatório por requisição).

## Testes

Números reais da última rodada (Vitest 5 e Playwright 1.65):

| Camada | Arquivos | Testes | O que cobre |
| --- | --- | --- | --- |
| `packages/core` | 8 | 79 | NPS (arredondamento simétrico), filtros (tema por palavra inteira, busca sem acento e por tema, datas reais, período invertido), ordenação, facetas, temas e sentimento com aviso de amostra pequena, falas em destaque sem quase-duplicatas, síntese e modelos de pergunta, texto sem NPS tautológico, saneamento de comentários, citações, treemap, domínio do quadro (escape de Markdown, CSV seguro, ids duplicados, link e seu limite), seed |
| `apps/api` | 2 | 26 | Envelope, paginação, `sort` (SQL e em memória), paridade de busca com o navegador (acento, caixa, tema), 400/404, JSON inválido, `meta` honesto e `truncated`, SSE, CORS, preflight que não gasta limite, 429, token Bearer, prompt do Claude (delimitador por requisição, comentário hostil neutralizado) |
| `apps/web` (unitários e de componente, app inteiro sobre a história em memória) | 17 | 167 | 59 pares de contraste nos dois temas; adaptador http (sort, 401/403, 4xx sem retry, carga compartilhada, token só na síntese, SSE malformado); "Conectar à API" (token só em memória, URL inválida, API fora do ar, voltar para a demo); síntese que não fica presa em "Gerando"; store do quadro (versão, migração, dedupe, outras abas); destaque com acento; camadas em portal, `inert` e Esc só na camada de cima; tour que nunca abre sozinho; busca sincronizada com a URL; datas inválidas; estados de carregando/vazio/erro/parcial; mapa de temas; quadro (editar com foco, desfazer, importar link, link grande demais); paleta e atalhos |
| `apps/web` E2E (Playwright + axe) | 3 | 31 | axe sem violações nas 6 telas × 2 temas; **geometria dos diálogos** (Filtros, paleta, atalhos, Mais, Conectar e detalhe da resposta dentro da viewport, em 1440, 768 e 390 px); axe e **alvos de toque de 44 px** em 6 telas a 390 px com toque; fluxos de painel, filtro, resposta, síntese e quadro; busca por tema; tour como chip; primeiro Tab no "Pular para o conteúdo"; reload em rota interna sem erro de console nem 404 |

Total: **272 testes em Vitest** (79 + 26 + 167) e **31 E2E**, todos passando. Lint, typecheck e build portátil limpos.

## Roadmap

- [x] Filtros na URL, comparação, síntese em streaming com cancelar e citações clicáveis, gráficos com tabela alternativa.
- [x] Deploy do front com dados mock no GitHub Pages.
- [x] Identidade editorial, temas com treemap, quadro de insights, paleta de comandos, atalhos e tour.
- [x] Playwright + `@axe-core/playwright` nos fluxos principais, com geometria dos diálogos e alvos de toque.
- [x] Modo http com "Conectar à API", token só em memória e `sort` no contrato da API.
- [ ] Endpoints de agregação na API (hoje painel, temas e facetas do adaptador `http` agregam no cliente, com uma carga compartilhada).
- [ ] Persistir o quadro no servidor e compartilhar por id curto.
- [ ] OpenAPI.

## Licença

[MIT](LICENSE) © Alexandre Diogo Nascimento
