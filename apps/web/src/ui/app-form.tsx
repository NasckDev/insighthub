import { Form, type FormInstance, type FormItemProps, type FormProps } from 'antd';
import type { ReactNode } from 'react';

export interface AppFormProps<Values> extends Omit<FormProps<Values>, 'layout' | 'requiredMark' | 'onFinish'> {
  onSubmit: (values: Values) => void | Promise<void>;
  children: ReactNode;
}

/** Vertical form with inline validation. Fields are named for screen readers and errors are linked to them. */
export function AppForm<Values extends object>({ onSubmit, children, ...rest }: AppFormProps<Values>) {
  return (
    <Form<Values> layout="vertical" requiredMark={false} validateTrigger={['onChange', 'onBlur']} onFinish={(values) => void onSubmit(values)} {...rest}>
      {children}
    </Form>
  );
}

export type AppFormItemProps = Omit<FormItemProps, 'colon'>;

export function AppFormItem(props: AppFormItemProps) {
  return <Form.Item {...props} />;
}

export function useAppForm<Values extends object>(): FormInstance<Values> {
  return Form.useForm<Values>()[0];
}
