import { useAuthStore } from '~/stores/auth';

function isAuthSessionRequest(url: string) {
  return url.includes('/auth/') || url.includes('/users/profile');
}

function readServerCookie() {
  if (!import.meta.server) return undefined;
  try {
    return useRequestHeaders(['cookie']).cookie;
  } catch {
    return undefined;
  }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const serverCookie = readServerCookie();

  const api = $fetch.create({
    baseURL: config.public.apiBaseUrl,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(serverCookie ? { cookie: serverCookie } : {}),
    },
    onRequest({ options }) {
      if (serverCookie) {
        options.headers = {
          ...(options.headers as Record<string, string>),
          cookie: serverCookie,
        };
      }
    },
    async onResponseError({ response, request, options }) {
      if (response.status !== 401) return;

      const url = typeof request === 'string' ? request : request.url;
      if (isAuthSessionRequest(url)) return;
      if (!import.meta.client) return;

      try {
        const authStore = useAuthStore();
        const refreshed = await authStore.refreshAccessToken();
        if (refreshed) {
          return api(request, options as Parameters<typeof api>[1]);
        }
        authStore.clearSession();
      } catch {
        // Never fail hydration because of auth refresh.
      }
    },
  });

  const aiApi = $fetch.create({
    baseURL: config.public.aiApiUrl,
    headers: { 'Content-Type': 'application/json' },
  });

  return {
    provide: { api, aiApi },
  };
});
