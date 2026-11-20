import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppStatus, AppTag } from './app-tag';
import { WarningOutlined } from './icons';

const meta = {
  title: 'Dados/AppTag',
  component: AppTag,
  args: { children: 'Preço', tone: 'neutral' },
  argTypes: { tone: { control: 'select', options: ['neutral', 'primary', 'promoter', 'passive', 'detractor', 'info'] } },
} satisfies Meta<typeof AppTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const ComIcone: Story = { args: { tone: 'passive', icon: <WarningOutlined />, children: 'Amostra pequena' } };
export const TodosOsTons: Story = {
  render: () => (
    <div className="ih-row ih-gap-2">
      {(['neutral', 'primary', 'promoter', 'passive', 'detractor', 'info'] as const).map((tone) => (
        <AppTag key={tone} tone={tone}>{tone}</AppTag>
      ))}
    </div>
  ),
};
export const StatusDeNps: Story = {
  render: () => (
    <div className="ih-row ih-gap-2">
      <AppStatus status="promoter" value={10} label="Promotor" />
      <AppStatus status="passive" value={8} label="Neutro" />
      <AppStatus status="detractor" value={3} label="Detrator" />
    </div>
  ),
};
