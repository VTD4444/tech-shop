import { useAuthStore } from '~/stores/auth';
import { isPublicAuthPath } from '~/utils/auth-paths';

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();

  if (!authStore.bootstrapped && !isPublicAuthPath(to.path)) {
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
