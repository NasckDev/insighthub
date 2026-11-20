import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppAvatar } from './app-avatar';
import { UserOutlined } from './icons';

const meta = {
  title: 'Dados/AppAvatar',
  component: AppAvatar,
  args: { children: 'CB', size: 'md', background: '#0b6b63' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] }, background: { control: 'color' } },
} satisfies Meta<typeof AppAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Iniciais: Story = {};
export const Pequeno: Story = { args: { size: 'sm' } };
export const Grande: Story = { args: { size: 'lg', background: '#7a4e8c', children: 'DC' } };
export const Icone: Story = { args: { children: <UserOutlined />, label: 'Conta' } };
