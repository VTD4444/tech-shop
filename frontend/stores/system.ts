import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useSystemStore = defineStore('system', () => {
  const apiDegraded = ref(false);
  const degradedMessage = ref('');
  const lastCheckedAt = ref<string | null>(null);

  function markDegraded(message = 'Backend is temporarily unavailable. Showing cached catalog.') {
    apiDegraded.value = true;
    degradedMessage.value = message;
    lastCheckedAt.value = new Date().toISOString();
  }

  function markHealthy() {
    apiDegraded.value = false;
    degradedMessage.value = '';
    lastCheckedAt.value = new Date().toISOString();
  }

  async function checkBackendHealth() {
    try {
      const { $api } = useNuxtApp();
      const result: any = await $api('/health', { timeout: 5000 });
      const health = result?.data ?? result;
      if (health?.database === 'connected') {
        markHealthy();
        return true;
      }
      markDegraded('Backend is running but the database may be offline.');
      return false;
    } catch {
      markDegraded();
      return false;
    }
  }

  return {
    apiDegraded,
    degradedMessage,
    lastCheckedAt,
    markDegraded,
    markHealthy,
    checkBackendHealth,
  };
});
