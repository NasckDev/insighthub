import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AppDatePicker, type AppDatePickerProps } from './app-date-picker';

function Field(props: Partial<AppDatePickerProps>) {
  const [value, setValue] = useState<string | undefined>(props.value);
  return (
    <div style={{ maxWidth: 260 }}>
      <label htmlFor="story-date" className="ih-label">
        Enviadas a partir de
      </label>
      <AppDatePicker id="story-date" {...props} value={value} onChange={setValue} />
    </div>
  );
}

const meta = {
  title: 'Formulário/AppDatePicker',
  component: AppDatePicker,
  render: (args) => <Field {...args} />,
  args: { id: 'story-date', value: undefined, onChange: () => undefined },
  argTypes: { error: { control: 'boolean' }, min: { control: 'text' }, max: { control: 'text' } },
} satisfies Meta<typeof AppDatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const ComValor: Story = { args: { value: '2026-08-10' } };
export const ComLimites: Story = { args: { value: '2026-09-01', min: '2026-08-01', max: '2026-09-30' } };
export const Erro: Story = { args: { error: true, value: '2026-10-01' } };
