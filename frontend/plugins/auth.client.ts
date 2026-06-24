import { useAuthStore } from '~/stores/auth';
import { isPublicAuthPath } from '~/utils/auth-paths';

export default defineNuxtPlugin((nuxtApp) => {
  const initAuth = async (path: string) => {
    const authStore = useAuthStore();

    if (isPublicAuthPath(path)) {
      authStore.markBootstrapped();
      return;
    }

    if (authStore.bootstrapped) return;

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
