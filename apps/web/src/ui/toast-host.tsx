import message from 'antd/es/message';
import notification from 'antd/es/notification';
import { useEffect } from 'react';
import { AppButton } from './app-button';
import { registerToastHost, type ToastInput } from './app-toast';

const DEFAULT_SECONDS = 6;

/** Renders the holders of `message` and `notification` inside the themed tree and exposes them to `useToast`. */
export default function ToastHost() {
  const [messageApi, messageHolder] = message.useMessage();
  const [notificationApi, notificationHolder] = notification.useNotification();

  useEffect(() => {
    registerToastHost(({ message: text, kind = 'success', action, durationMs }: ToastInput) => {
      const seconds = (durationMs ?? DEFAULT_SECONDS * 1000) / 1000;
      if (!action) {
        void messageApi.open({ type: kind, content: text, duration: seconds });
        return;
      }
      const key = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      notificationApi.open({
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
              notificationApi.destroy(key);
            }}
          >
            {action.label}
          </AppButton>
        ),
      });
    });
    return () => registerToastHost(null);
  }, [messageApi, notificationApi]);

  return (
    <>
      {messageHolder}
      {notificationHolder}
    </>
  );
}
