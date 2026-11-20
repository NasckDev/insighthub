# ADR 0003 — Identidade editorial e gráficos em SVG próprio

- Status: aceito (a parte visual foi substituída pelo [ADR 0006](0006-ant-design-echarts-e-camada-de-ui.md))
- Data: 2026-11-19

## Contexto

A primeira versão da interface parecia um tutorial: tipografia do sistema, paleta genérica, cards iguais e gráficos mínimos. O produto precisa ter identidade própria ("uma revista de dados, não um painel genérico"), contraste AA provado nos dois temas e carga leve.

## Decisão

- **Tipografia auto-hospedada**: Fraunces (variável, só o subconjunto latino, normal e itálico) nos títulos, números de destaque e falas dos clientes; Inter variável na interface. Declaradas com `@font-face` apontando para os arquivos de `@fontsource-variable/*`, sem requisição externa.
- **Paleta por tokens CSS**: papel `#FBF8F3`, tinta `#1B1B3A`, petróleo `#0F766E`, coral `#E8604C`, âmbar e ameixa de apoio; escuro com fundo `#0E1514`. Variações de texto (`--promoter`, `--passive`, `--detractor`) são mais escuras que as de preenchimento (`--*-bar`), porque coral e âmbar puros não chegam a 4,5:1 como texto.
- **Contraste calculado, não presumido**: `src/lib/contrast.test.ts` lê `styles.css` e verifica 29 pares de tokens nos dois temas (4,5:1 para texto, 3:1 para gráficos e controles). Esse teste forçou o âmbar de gráfico a escurecer (`#B57C0C`), pois `#D99A1E` fica em 2,4:1 sobre branco.
- **Gráficos em SVG/HTML próprios** em vez de uma biblioteca: medidor de NPS, área com curva monotônica (Fritsch-Carlson, sem picos inexistentes), barras de distribuição, barras divergentes e treemap squarified. Cada um desenha em pixels reais (sem distorcer texto), tem tooltip desenhado, navegação por setas, descrição textual e alternativa em tabela. O custo é escrever e testar a matemática (`curve.ts`, `squarify` no `core`); o ganho é bundle menor e controle total da acessibilidade.
- **Movimento via `motion`** com `LazyMotion` e `MotionConfig reducedMotion="user"`; animações de CSS (gráficos que se desenham, shimmer) também desligam em `prefers-reduced-motion`.
- **Cor nunca é o único sinal**: sentimento e faixas NPS têm ícone e palavra; segmentos de amostra pequena aparecem listrados e com selo.

## Consequências

- O JavaScript inicial fica em torno de 199 kB gzip (React, roteador, query e motion) mais 8 kB de CSS, com cada tela em um chunk próprio de 1 a 10 kB gzip carregado sob demanda.
- Trocar a paleta exige rodar o teste de contraste, que aponta o par que falhou.
