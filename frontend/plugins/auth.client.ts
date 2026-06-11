import { useAuthStore } from '~/stores/auth';

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore();
  if (!authStore.bootstrapped) {
    await authStore.bootstrap();
  }
});
