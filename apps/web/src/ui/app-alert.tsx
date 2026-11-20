import Alert from 'antd/es/alert';
import Result from 'antd/es/result';
import type { ReactNode } from 'react';
import { Illustration } from './illustrations';

export type AlertKind = 'info' | 'success' | 'warning' | 'error';

export interface AppAlertProps {
  kind?: AlertKind;
  title: ReactNode;
  description?: ReactNode;
  /** Buttons shown after the text. */
  action?: ReactNode;
  closable?: boolean;
  onClose?: () => void;
  /** `alert` interrupts the reader; `status` waits for a pause. */
  live?: 'alert' | 'status';
  showIcon?: boolean;
}

/** Inline message (partial result, warning, error). */
export function AppAlert({ kind = 'info', title, description, action, closable, onClose, live = 'status', showIcon = true }: AppAlertProps) {
  return (
    <Alert
      type={kind}
      role={live}
      showIcon={showIcon}
      title={title}
      description={description}
      action={action}
      closable={closable ? { onClose } : undefined}
    />
  );
}

export interface AppResultProps {
  status?: 'error' | 'warning' | 'info' | 'success' | '404';
  title: ReactNode;
  subTitle?: ReactNode;
  extra?: ReactNode;
  /** Draws the app illustration instead of the library icon. */
  illustrated?: boolean;
}

/** Full-block result page: something failed or something finished, and what to do next. */
export function AppResult({ status = 'error', title, subTitle, extra, illustrated = false }: AppResultProps) {
  return (
    <div role={status === 'error' ? 'alert' : 'status'}>
      <Result
        status={status === '404' ? 'warning' : status}
        icon={illustrated ? <Illustration name="error" /> : undefined}
        title={title}
        subTitle={subTitle}
        extra={extra}
      />
    </div>
  );
}
