export interface PromptDialogOptions {
  title?: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface PromptDialogState {
  open: boolean;
  title: string;
  message: string;
  value: string;
  placeholder: string;
  confirmLabel: string;
  cancelLabel: string;
  resolve: ((value: string | null) => void) | null;
}

const defaultState = (): PromptDialogState => ({
  open: false,
  title: 'Nhập thông tin',
  message: '',
  value: '',
  placeholder: '',
  confirmLabel: 'Lưu',
  cancelLabel: 'Hủy',
  resolve: null,
});

export function usePromptDialog() {
  const state = useState<PromptDialogState>('app-prompt-dialog', defaultState);

  function prompt(options: string | PromptDialogOptions, defaultValue = ''): Promise<string | null> {
    const opts: PromptDialogOptions =
      typeof options === 'string' ? { message: options, defaultValue } : options;

    return new Promise((resolve) => {
      state.value = {
        open: true,
        title: opts.title ?? 'Nhập thông tin',
        message: opts.message ?? '',
        value: opts.defaultValue ?? defaultValue,
        placeholder: opts.placeholder ?? '',
        confirmLabel: opts.confirmLabel ?? 'Lưu',
        cancelLabel: opts.cancelLabel ?? 'Hủy',
        resolve,
      };
    });
  }

  function settle(value: string | null) {
    state.value.resolve?.(value);
    state.value = defaultState();
  }

  function setValue(value: string) {
    state.value = { ...state.value, value };
  }

  return {
    state,
    prompt,
    setValue,
    accept: () => settle(state.value.value.trim() || null),
    cancel: () => settle(null),
  };
}
