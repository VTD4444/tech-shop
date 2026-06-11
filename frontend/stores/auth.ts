import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

interface User {
  id: string;
  username: string;
  email?: string;
  role: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const bootstrapped = ref(false);
  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  async function bootstrap() {
    if (bootstrapped.value) return;
    await fetchProfile();
    bootstrapped.value = true;
  }

  async function login(email: string, password: string) {
    const { $api } = useNuxtApp();
    const data: any = await $api('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    user.value = data.data.user;
    bootstrapped.value = true;
    return data.data.user;
  }

  async function register(username: string, email: string, password: string) {
    const { $api } = useNuxtApp();
    const data: any = await $api('/auth/register', {
      method: 'POST',
      body: { username, email, password },
    });
    user.value = data.data.user;
    bootstrapped.value = true;
    return data.data.user;
  }

  async function refreshAccessToken() {
    try {
      const { $api } = useNuxtApp();
      const data: any = await $api('/auth/refresh', { method: 'POST', body: {} });
      user.value = data.data.user;
      return true;
    } catch {
      user.value = null;
      return false;
    }
  }

  async function fetchProfile() {
    try {
      const { $api } = useNuxtApp();
      const data: any = await $api('/users/profile');
      user.value = data.data;
      return data.data;
    } catch {
      user.value = null;
      return null;
    }
  }

  async function logout() {
    try {
      const { $api } = useNuxtApp();
      await $api('/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    user.value = null;
    bootstrapped.value = true;
    if (import.meta.client) {
      navigateTo('/login');
    }
  }

  return {
    user,
    bootstrapped,
    isAuthenticated,
    isAdmin,
    bootstrap,
    login,
    register,
    refreshAccessToken,
    fetchProfile,
    logout,
  };
});
