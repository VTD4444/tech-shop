import { useAuthStore } from '~/stores/auth';
import { isPublicAuthPath } from '~/utils/auth-paths';

async function handleGoogleAuthReturn(nuxtApp: any) {
  const authStore = useAuthStore();
  try {
    await authStore.fetchProfile();
    authStore.markBootstrapped();
    useToast().success('Đăng nhập Google thành công!');
  } catch {
    authStore.markBootstrapped();
  }
  const route = nuxtApp.$router.currentRoute.value;
  await nuxtApp.$router.replace({ path: route.path, query: {} });
}

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
    const route = nuxtApp.$router.currentRoute.value;
    if (route.query.auth === 'google') {
      void handleGoogleAuthReturn(nuxtApp);
      return;
    }
    void initAuth(route.path);
  });

  nuxtApp.$router.afterEach((to) => {
    if (to.query.auth === 'google') {
      void handleGoogleAuthReturn(nuxtApp);
      return;
    }
    void initAuth(to.path);
  });
});
