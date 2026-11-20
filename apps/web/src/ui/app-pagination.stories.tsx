import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AppPagination, type AppPaginationProps } from './app-pagination';

function Demo(args: AppPaginationProps) {
  const [page, setPage] = useState(args.current);
  const [size, setSize] = useState(args.pageSize);
  return <AppPagination {...args} current={page} pageSize={size} onChange={(nextPage, nextSize) => { setPage(nextSize === size ? nextPage : 1); setSize(nextSize); }} />;
}

const meta = {
  title: 'Navegação/AppPagination',
  component: AppPagination,
  render: (args) => <Demo {...args} />,
  args: { current: 2, pageSize: 20, total: 640, onChange: () => undefined },
  argTypes: { total: { control: { type: 'number', min: 0, max: 5000 } } },
} satisfies Meta<typeof AppPagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const PrimeiraPagina: Story = { args: { current: 1 } };
export const UmaSoPagina: Story = { args: { current: 1, total: 8 } };
