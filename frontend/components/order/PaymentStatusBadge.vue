<script setup lang="ts">
const props = defineProps<{ status: string }>();

const map: Record<string, 'success' | 'pending' | 'danger' | 'neutral'> = {
  paid: 'success',
  unpaid: 'pending',
  failed: 'danger',
  refunded: 'neutral',
};
</script>

<template>
  <UiBadge :variant="map[status] || 'neutral'">{{ status }}</UiBadge>
</template>
