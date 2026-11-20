import { App } from 'antd';
import { useCallback } from 'react';
import { AppButton } from './app-button';

export type ToastKind = 'success' | 'info' | 'error';

export interface ToastInput {
  message: string;
  kind?: ToastKind;
  action?: { label: string; onClick: () => void };
  durationMs?: number;
}

const DEFAULT_SECONDS = 6;

/**
 * Feedback that leaves on its own and pauses while the pointer or focus is on it (so nobody loses the
 * "Desfazer" button while reaching for it). Plain messages use `message`; ones with an action use
 * `notification`.
 */
export function useToast(): (toast: ToastInput) => void {
  const { message, notification } = App.useApp();
  return useCallback(
    ({ message: text, kind = 'success', action, durationMs }: ToastInput) => {
      const seconds = (durationMs ?? DEFAULT_SECONDS * 1000) / 1000;
      if (!action) {
        void message.open({ type: kind, content: text, duration: seconds });
        return;
      }
      const key = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      notification.open({
        key,
        type: kind,
        title: text,
        duration: seconds,
        pauseOnHover: true,
        placement: 'bottomRight',
        role: kind === 'error' ? 'alert' : 'status',
        actions: (
          <AppButton
            size="sm"
            variant="primary"
            onClick={() => {
              action.onClick();
              notification.destroy(key);
            }}
          >
            {action.label}
          </AppButton>
        ),
      });
    },
    [message, notification],
  );
}
