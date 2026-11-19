# ADR 0001 — `InsightProvider` com fallback local determinístico

- Status: aceito
- Data: 2026-11-19

## Contexto

A síntese assistida por IA é o recurso central, mas o projeto precisa rodar sem chave de API (avaliação, CI, demo estática) e sem custo, e a síntese precisa ser rastreável até as respostas-fonte.

## Decisão

- Definir o contrato `InsightProvider.stream(input, signal): AsyncGenerator<SynthesisEvent>` em `packages/core`.
- Implementação padrão **local extrativa**: NPS, temas por dicionário de palavras-chave e uma citação representativa por tema (id real da resposta). Determinística e testável.
- Implementação **Claude** (`@anthropic-ai/sdk`) ativada apenas quando `ANTHROPIC_API_KEY` existe no ambiente. O modelo cita fontes como `[#id]`; a API valida cada id contra o conjunto enviado e descarta ids inexistentes.
- Retry com backoff exponencial próprio (`withRetry`), apenas para erros transitórios e antes do primeiro token; o SDK fica com `maxRetries: 0` para que o abort do cliente seja respeitado.
- Transporte via SSE com eventos tipados (`meta`, `delta`, `citation`, `done`, `error`).

## Consequências

- A demo e os testes não dependem de rede.
- Trocar de provedor é implementar uma interface.
- O provider local é limitado (dicionário fixo de temas), o que é aceitável como baseline e fallback.
