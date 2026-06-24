import { useAuthStore } from '~/stores/auth';
import { isPublicAuthPath } from '~/utils/auth-paths';

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();

  try {
    const path = useRequestURL().pathname;

    if (isPublicAuthPath(path)) {
      authStore.markBootstrapped();
      return;
    }

    // Client-only routes (admin, auth forms) handle session restore themselves.
    if (path.startsWith('/admin')) {
      return;
    }

    await authStore.bootstrap();
  } catch {
    authStore.markBootstrapped();
  }
});
