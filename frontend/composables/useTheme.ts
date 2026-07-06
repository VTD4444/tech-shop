export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'techshop-theme';

function applyThemeToDocument(theme: Theme) {
  if (!import.meta.client) return;
  document.documentElement.dataset.theme = theme;
}

function readStoredTheme(): Theme | null {
  if (!import.meta.client) return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* private browsing */
  }
  return null;
}

function resolveSystemTheme(): Theme {
  if (!import.meta.client) return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const theme = useState<Theme>('app-theme', () => readStoredTheme() ?? resolveSystemTheme());

  function setTheme(next: Theme, persist = true) {
    theme.value = next;
    if (!import.meta.client) return;
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
    }
    applyThemeToDocument(next);
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark');
  }

  function initTheme() {
    const resolved = readStoredTheme() ?? resolveSystemTheme();
    theme.value = resolved;
    applyThemeToDocument(resolved);
  }

  if (import.meta.client) {
    onMounted(() => {
      initTheme();
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => {
        if (readStoredTheme()) return;
        const next = mq.matches ? 'dark' : 'light';
        theme.value = next;
        applyThemeToDocument(next);
      };
      mq.addEventListener('change', onChange);
      onUnmounted(() => mq.removeEventListener('change', onChange));
    });
  }

  return {
    theme: readonly(theme),
    setTheme,
    toggleTheme,
    initTheme,
  };
}
