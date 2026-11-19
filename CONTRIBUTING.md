# Contribuindo

1. Faça um fork e crie uma branch a partir de `main`.
2. `npm install` na raiz (npm workspaces).
3. Antes de abrir o PR: `npm run typecheck` e `npm test` devem passar.
4. Commits em uma linha, em inglês, com prefixo convencional (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
5. Regras novas de domínio vão para `packages/core` com teste; validação de entrada sempre com Zod na borda.
6. Nunca commite segredos: use `.env` (ignorado) e documente variáveis novas em `.env.example`.
7. Dados de exemplo devem ser fictícios.
