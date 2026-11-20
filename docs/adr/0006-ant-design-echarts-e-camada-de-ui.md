# ADR 0006 — Ant Design, ECharts e a camada `src/ui`

- Status: aceito (substitui a parte visual do [ADR 0003](0003-identidade-editorial-e-graficos-proprios.md))
- Data: 2026-11-20

## Contexto

O dono pediu para trocar o design feito à mão pelo padrão de UI dele: Ant Design para os componentes, Apache ECharts para os gráficos, wrappers próprios no lugar do uso direto das bibliotecas, tema central e Storybook. A identidade do InsightHub (editorial, calma, Fraunces e Inter, petróleo e coral) continua, agora aplicada como tokens do Ant Design.

## Decisão

- **`apps/web/src/ui/` é a única porta para `antd`, `echarts`, `echarts-for-react`, `@ant-design/icons` e `dayjs`.** Uma regra `no-restricted-imports` no `eslint.config.js` barra essas importações em qualquer outro lugar (o `.storybook/` fica de fora porque só monta o provider). As telas usam `AppButton`, `AppTable`, `AppChart` e os demais.
- **Tema central em `ui/theme.ts`**: a paleta dos dois temas é a fonte única. `buildTheme` a converte em tokens do `ConfigProvider` (`colorPrimary`, `colorBgLayout`, `fontFamily`, `borderRadius`, `controlHeight`, tokens de Layout, Menu, Table, Card...) com `theme.darkAlgorithm` no escuro, e `paletteCss` a escreve como variáveis `--ih-*` antes da primeira pintura (para o CSS próprio e para as opções do ECharts, que não leem variáveis CSS). O teste de contraste calcula os pares a partir dessa mesma paleta e também confere os tokens que o Ant Design deriva sozinho (texto secundário, borda de campo).
- **Alvos de 44 px** em celular e telas de toque: `controlHeight` sobe de 40 para 44 quando `(pointer: coarse), (max-width: 767px)`.
- **Ícones decorativos por padrão**: o pacote de ícones dá `role="img"` e um `aria-label` em inglês a cada ícone, o que vazava para o nome dos botões ("reload Tentar de novo"). `ui/icons.tsx` os reexporta com `aria-hidden`.
- **ECharts enxuto e sob demanda**: `echarts/core` registra só barras, linha, medidor, treemap, grade, tooltip, markLine, aria e o renderizador SVG. A instância (`chart-canvas.tsx`) é um chunk à parte, carregado depois da primeira pintura. Cada gráfico fica exposto como uma imagem com texto alternativo, e a tabela equivalente (carregada só ao alternar) é a versão navegável por teclado. O mapa de temas ganhou uma fileira de botões, um por tema, para quem não usa o mouse.
- **Celular**: o `Sider` fixo (a partir de 1200 px) vira barra inferior mais `Drawer`; tabelas viram listas de cartões abaixo de 768 px; painéis laterais viram folhas inferiores.
- **Datas**: `AppDatePicker` trabalha com strings ISO (o formato dos filtros na URL) e carrega o calendário e o `dayjs` sob demanda.
- **Storybook 10** em `apps/web` com stories ao lado de cada wrapper (estados e controles), tema claro/escuro na barra e o addon de acessibilidade. `build-storybook` roda no CI e o resultado é publicado em `/storybook/` junto da demo.

## Consequências

- O Ant Design pesa: o JavaScript do primeiro carregamento passa de 173,6 kB para o valor do README, e o ECharts (203 kB gzip) vem depois da primeira pintura. Em troca saem Tailwind, `motion` e `lucide-react`, e some a matemática própria de gráficos (`curve.ts`).
- Cada novo componente de tela deve nascer como wrapper em `src/ui`, com story.
- Foram necessários ajustes para testar: `NODE_ENV=development` no Vitest (os pacotes `rc-*` devolvem o id constante `test-id` em `NODE_ENV=test`, o que quebra `aria-labelledby`) e um stub do `chart-canvas`, já que o jsdom não tem layout.
