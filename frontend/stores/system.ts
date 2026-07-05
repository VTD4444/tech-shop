import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useSystemStore = defineStore('system', () => {
  const apiDegraded = ref(false);
  const degradedMessage = ref('');
  const lastCheckedAt = ref<string | null>(null);

  function markDegraded(message = 'Máy chủ tạm thời không khả dụng. Đang hiển thị danh mục đã lưu.') {
    apiDegraded.value = true;
    degradedMessage.value = message;
    lastCheckedAt.value = new Date().toISOString();
  }

  function markHealthy() {
    apiDegraded.value = false;
    degradedMessage.value = '';
    lastCheckedAt.value = new Date().toISOString();
  }

  return {
    apiDegraded,
    degradedMessage,
    lastCheckedAt,
    markDegraded,
    markHealthy,
  };
});
