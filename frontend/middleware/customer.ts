import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore();

  if (!authStore.bootstrapped) {
    try {
      await authStore.bootstrap();
    } catch {
      authStore.markBootstrapped();
    }
  }

  if (!authStore.isAuthenticated) {
    return navigateTo('/login', { redirectCode: 302 });
  }
});
