import { useAuthStore } from '~/stores/auth';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const api = $fetch.create({
    baseURL: config.public.apiBaseUrl,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    onRequest({ options }) {
      if (import.meta.server) {
        const headers = useRequestHeaders(['cookie']);
        if (headers.cookie) {
          options.headers = {
            ...(options.headers as Record<string, string>),
            cookie: headers.cookie,
          };
        }
      }
    },
    async onResponseError({ response, request, options }) {
      if (response.status !== 401) return;

      const url = typeof request === 'string' ? request : request.url;
      if (url.includes('/auth/')) return;

      if (import.meta.client) {
        const authStore = useAuthStore();
        const refreshed = await authStore.refreshAccessToken();
        if (refreshed) {
          return api(request, options as Parameters<typeof api>[1]);
        }
        await authStore.logout();
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
