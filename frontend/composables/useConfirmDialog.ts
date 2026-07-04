export type ConfirmVariant = 'default' | 'danger';

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: ConfirmVariant;
  resolve: ((value: boolean) => void) | null;
}

const defaultState = (): ConfirmDialogState => ({
  open: false,
  title: 'Xác nhận',
  message: '',
  confirmLabel: 'Xác nhận',
  cancelLabel: 'Hủy',
  variant: 'danger',
  resolve: null,
});

export function useConfirmDialog() {
  const state = useState<ConfirmDialogState>('app-confirm-dialog', defaultState);

  function confirm(options: string | ConfirmDialogOptions): Promise<boolean> {
    const opts = typeof options === 'string' ? { message: options } : options;

    return new Promise((resolve) => {
      state.value = {
        open: true,
        title: opts.title ?? 'Xác nhận',
        message: opts.message,
        confirmLabel: opts.confirmLabel ?? 'Xác nhận',
        cancelLabel: opts.cancelLabel ?? 'Hủy',
        variant: opts.variant ?? 'danger',
        resolve,
      };
    });
  }

  function settle(confirmed: boolean) {
    state.value.resolve?.(confirmed);
    state.value = defaultState();
  }

  return {
    state: readonly(state),
    confirm,
    accept: () => settle(true),
    cancel: () => settle(false),
  };
}
