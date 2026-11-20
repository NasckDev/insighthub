import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppSkeleton, AppSkeletonCards } from './app-skeleton';

const meta = {
  title: 'Feedback/AppSkeleton',
  component: AppSkeleton,
  args: { label: 'Carregando respostas', rows: 4 },
  argTypes: { rows: { control: { type: 'number', min: 1, max: 10 } } },
} satisfies Meta<typeof AppSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Bloco: Story = {};
export const Curto: Story = { args: { rows: 1 } };
export const Cartoes: Story = { render: () => <AppSkeletonCards count={4} /> };
