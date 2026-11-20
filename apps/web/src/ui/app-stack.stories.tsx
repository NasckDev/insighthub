import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppCard } from './app-card';
import { AppBand, AppGrid, AppGridItem, AppKbd, AppLegend, AppParagraph, AppRow, AppStack, AppText, AppTitle } from './app-stack';

const meta = {
  title: 'Layout/Pilha, grade e texto',
  component: AppStack,
  args: { children: null, gap: 3 },
  argTypes: { gap: { control: 'inline-radio', options: [1, 2, 3, 4, 5] } },
} satisfies Meta<typeof AppStack>;

export default meta;
type Story = StoryObj<typeof meta>;

const Box = ({ children }: { children: string }) => <AppCard>{children}</AppCard>;

export const Pilha: Story = {
  render: (args) => (
    <AppStack {...args}>
      <Box>Primeiro bloco</Box>
      <Box>Segundo bloco</Box>
    </AppStack>
  ),
};
export const Linha: Story = {
  render: (args) => (
    <AppRow gap={args.gap}>
      <Box>A</Box>
      <Box>B</Box>
      <Box>C</Box>
    </AppRow>
  ),
};
export const Grade: Story = {
  render: () => (
    <AppGrid columns={{ base: 1, md: 2, lg: 4 }}>
      {['Respostas', 'Promotores', 'Neutros', 'Detratores'].map((label) => <Box key={label}>{label}</Box>)}
    </AppGrid>
  ),
};
export const GradeDe12Colunas: Story = {
  render: () => (
    <AppGrid columns={{ base: 1 }} twelve>
      <AppGridItem span={5}><Box>Medidor (5 colunas)</Box></AppGridItem>
      <AppGridItem span={7}><Box>Evolução (7 colunas)</Box></AppGridItem>
    </AppGrid>
  ),
};
export const Tipografia: Story = {
  render: () => (
    <AppStack gap={2}>
      <AppTitle level={1}>Da pesquisa à decisão</AppTitle>
      <AppTitle level={2}>Do que as pessoas falam</AppTitle>
      <AppTitle level={3}>O que dizem</AppTitle>
      <AppParagraph>Parágrafo de corpo, em Inter, com números tabulares: 1.280 respostas.</AppParagraph>
      <AppParagraph tone="muted" small>Texto de apoio em tom discreto.</AppParagraph>
      <AppText tone="promoter" strong>+24 pts acima do geral</AppText>
      <AppText tone="detractor" strong>−12 pts abaixo do geral</AppText>
      <span>Atalho: <AppKbd>Ctrl</AppKbd> + <AppKbd>K</AppKbd></span>
    </AppStack>
  ),
};
export const FaixaEmPartes: Story = {
  render: () => (
    <AppStack gap={3}>
      <AppBand
        label="Detratores 22%, neutros 29%, promotores 49%"
        parts={[
          { key: 'd', label: 'Detratores 22%', value: 22, color: 'var(--ih-detractor-bar)' },
          { key: 'n', label: 'Neutros 29%', value: 29, color: 'var(--ih-passive-bar)' },
          { key: 'p', label: 'Promotores 49%', value: 49, color: 'var(--ih-promoter-bar)' },
        ]}
      />
      <AppLegend label="Legenda" items={[{ key: 'a', label: 'Positivo (NPS ≥ +15)', color: 'var(--ih-promoter-bar)' }, { key: 'b', label: 'Negativo (NPS ≤ −15)', color: 'var(--ih-detractor-bar)' }]} />
    </AppStack>
  ),
};
