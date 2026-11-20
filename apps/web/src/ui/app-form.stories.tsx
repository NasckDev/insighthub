import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { AppButton } from './app-button';
import { AppForm, AppFormItem } from './app-form';
import { AppInput, AppTextArea } from './app-input';

interface Values {
  title: string;
  note?: string;
}

const meta = {
  title: 'Formulário/AppForm',
  component: AppForm<Values>,
  args: { onSubmit: fn(), name: 'story-form' },
  decorators: [(Story) => <div style={{ maxWidth: 420 }}><Story /></div>],
} satisfies Meta<typeof AppForm<Values>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  args: { children: null },
  render: (args) => (
    <AppForm<Values> {...args}>
      <AppFormItem label="Título do insight" name="title" rules={[{ required: true, message: 'Dê um título para encontrar este insight depois.' }]}>
        <AppInput />
      </AppFormItem>
      <AppFormItem label="Sua nota (opcional)" name="note">
        <AppTextArea rows={3} />
      </AppFormItem>
      <AppButton variant="primary" htmlType="submit">Salvar insight</AppButton>
    </AppForm>
  ),
};

export const ComErro: Story = {
  args: { children: null },
  render: (args) => (
    <AppForm<Values> {...args} initialValues={{ title: '' }}>
      <AppFormItem label="Título do insight" validateStatus="error" help="Dê um título para encontrar este insight depois.">
        <AppInput error />
      </AppFormItem>
      <AppButton variant="primary" htmlType="submit" disabled>Salvar insight</AppButton>
    </AppForm>
  ),
};

export const Enviando: Story = {
  args: { children: null },
  render: (args) => (
    <AppForm<Values> {...args} initialValues={{ title: 'Suporte pesa na nota' }}>
      <AppFormItem label="Título do insight" name="title">
        <AppInput disabled />
      </AppFormItem>
      <AppButton variant="primary" htmlType="submit" loading>Salvando…</AppButton>
    </AppForm>
  ),
};
