<script setup lang="ts">
import { AlertTriangle, RefreshCw, X } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useSystemStore } from '~/stores/system';

const systemStore = useSystemStore();
const { apiDegraded, degradedMessage } = storeToRefs(systemStore);
const dismissed = ref(false);
const retrying = ref(false);

watch(apiDegraded, (degraded) => {
  if (degraded) dismissed.value = false;
});

async function retry() {
  retrying.value = true;
  try {
    await systemStore.checkBackendHealth();
    if (!systemStore.apiDegraded) {
      const productStore = useProductStore();
      await Promise.all([
        productStore.fetchCategories(),
        productStore.fetchBrands(),
        productStore.fetchProducts({ limit: 20 }),
      ]);
    }
  } finally {
    retrying.value = false;
  }
}
</script>

<template>
  <div
    v-if="apiDegraded && !dismissed"
    class="border-b border-warning/30 bg-warning/10 text-text-primary"
    role="status"
  >
    <UiContainer class="flex items-start gap-3 py-3">
      <AlertTriangle class="w-5 h-5 text-warning shrink-0 mt-0.5" />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium">Chế độ hạn chế</p>
        <p class="text-sm text-text-muted">
          {{ degradedMessage || 'Một số tính năng không khả dụng. Bạn vẫn có thể duyệt sản phẩm mẫu.' }}
        </p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <UiButton variant="secondary" size="sm" :disabled="retrying" @click="retry">
          <RefreshCw class="w-4 h-4" :class="retrying ? 'animate-spin' : ''" />
          Thử lại
        </UiButton>
        <button
          type="button"
          class="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-2"
          aria-label="Đóng"
          @click="dismissed = true"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </UiContainer>
  </div>
</template>
