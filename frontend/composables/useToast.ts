import { translateApiMessage } from '~/utils/translateApiMessage';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

export function useToast() {
  const toasts = useState<ToastItem[]>('app-toasts', () => []);
  const nextId = useState('app-toast-next-id', () => 0);

  function push(type: ToastType, message: string, durationMs = 4000) {
    const id = ++nextId.value;
    const localized = translateApiMessage(message);
    toasts.value = [...toasts.value, { id, type, message: localized }];
    if (import.meta.client) {
      setTimeout(() => dismiss(id), durationMs);
    }
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return {
    toasts: readonly(toasts),
    success: (msg: string) => push('success', msg),
    error: (msg: string) => push('error', msg),
    info: (msg: string) => push('info', msg),
    dismiss,
  };
}
