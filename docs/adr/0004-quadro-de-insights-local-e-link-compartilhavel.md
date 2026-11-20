# ADR 0004 — Quadro de insights local e link compartilhável

- Status: aceito
- Data: 2026-11-19

## Contexto

A síntese gera texto com fontes, mas o valor de verdade está em guardar o que virou decisão, anotar e exportar. A demo roda sem servidor, então o quadro precisa funcionar só no navegador.

## Decisão

- O domínio do quadro (`packages/core/src/insights.ts`) é puro e testado: criar, editar, remover, mesclar, exportar para Markdown e CSV, codificar e decodificar o link.
- A persistência fica em `localStorage`, atrás de um store pequeno (`apps/web/src/lib/board-store.ts`) lido com `useSyncExternalStore`. Toda leitura passa pelo schema Zod: entradas corrompidas ou editadas à mão são descartadas, nunca quebram a tela. Se o armazenamento estiver bloqueado, o quadro vive só em memória.
- **Exclusão com desfazer** (toast com ação) em vez de diálogo de confirmação, para não interromper quem organiza muitos cards.
- **CSV seguro**: toda célula é entre aspas e, se começar com `=`, `+`, `-`, `@` ou tabulação, ganha um apóstrofo, para que planilhas não executem fórmulas vindas de texto de cliente.
- **Link compartilhável sem servidor**: o quadro vai codificado em base64url no parâmetro `share` do hash (`#/s/<id>/quadro?share=...`). Quem abre vê um aviso e escolhe "Importar para o meu quadro" ou "Descartar"; nada é gravado sem o clique. O token é limitado a 60 mil caracteres e validado com Zod; link adulterado mostra "Link de quadro inválido".

## Consequências

- Os insights ficam no navegador de quem os criou; limpar os dados do site apaga o quadro. O botão de exportar é o backup.
- O link carrega o conteúdo, então é longo para quadros grandes. Com um backend, o mesmo domínio passaria a gravar o quadro e o link carregaria só um id.
