import { useAuthStore } from '~/stores/auth';
import { isPublicAuthPath } from '~/utils/auth-paths';
import { getAccessToken } from '~/utils/auth-token';

export default defineNuxtPlugin((nuxtApp) => {
  const initAuth = async (path: string) => {
    const authStore = useAuthStore();

    if (path === '/auth/google/callback') {
      return;
    }

    if (isPublicAuthPath(path)) {
      authStore.markBootstrapped();
      return;
    }

    if (authStore.bootstrapped) {
      if (!authStore.user && getAccessToken()) {
        await authStore.fetchProfile();
      }
      return;
    }

    try {
      await authStore.bootstrap();
    } catch {
      authStore.markBootstrapped();
    }
  };

  nuxtApp.hook('app:mounted', () => {
    void initAuth(nuxtApp.$router.currentRoute.value.path);
  });

  nuxtApp.$router.afterEach((to) => {
    void initAuth(to.path);
  });
});
