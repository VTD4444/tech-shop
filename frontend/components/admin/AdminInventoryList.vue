<script setup lang="ts">
import { useFormatPrice } from '~/composables/useFormatPrice';

defineProps<{ items: any[] }>();
const { formatPrice } = useFormatPrice();
</script>

<template>
  <UiCard padding="md">
    <UiText as="h3" size="lg" class="mb-4">Tình trạng tồn kho</UiText>
    <div v-if="!items?.length" class="text-sm text-fg-muted">Chưa có dữ liệu tồn kho.</div>
    <ul v-else class="space-y-4">
      <li v-for="item in items.slice(0, 8)" :key="item.id">
        <div class="flex justify-between text-sm mb-1">
          <span class="text-fg truncate mr-2">{{ item.name }}</span>
          <UiBadge :variant="item.stockQuantity < 5 ? 'warning' : 'inStock'">
            {{ item.stockQuantity < 5 ? 'NHẬP HÀNG' : 'CÒN HÀNG' }}
          </UiBadge>
        </div>
        <UiProgressBar :value="item.stockQuantity" :max="50" />
      </li>
    </ul>
  </UiCard>
</template>
