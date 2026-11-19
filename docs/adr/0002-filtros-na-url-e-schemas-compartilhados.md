# ADR 0002 — Filtros na URL e schemas Zod compartilhados

- Status: aceito
- Data: 2026-11-19

## Contexto

Visões de análise precisam ser compartilháveis ("olha o NPS do plano free no Nordeste") e a validação de filtros não pode divergir entre front e back.

## Decisão

- Os filtros (`plan`, `region`, `role`, `nps`, `q`) e a paginação são definidos uma única vez em `packages/core/src/filters.ts` com Zod.
- A API valida a query string com `responseFiltersQuerySchema` (listas separadas por vírgula) e o corpo da síntese com `responseFiltersSchema`.
- A web usará o mesmo schema no `validateSearch` do TanStack Router, mantendo o estado de filtros na URL.

## Consequências

- Um filtro novo exige mudança em um só lugar, coberta por teste.
- `packages/core` é consumido como fonte TypeScript (sem build), o que simplifica o monorepo mas exige ferramentas com suporte a TS (tsx, Vite, Vitest).
