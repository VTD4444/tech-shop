<script setup lang="ts">
const props = defineProps<{ status: string }>();

const variantMap: Record<string, 'success' | 'pending' | 'danger' | 'neutral'> = {
  paid: 'success',
  unpaid: 'pending',
  failed: 'danger',
  refunded: 'neutral',
};

const labelMap: Record<string, string> = {
  paid: 'Đã thanh toán',
  unpaid: 'Chưa thanh toán',
  failed: 'Thất bại',
  refunded: 'Đã hoàn tiền',
};

const badge = computed(() => ({
  variant: variantMap[props.status] || 'neutral' as const,
  label: labelMap[props.status] || props.status,
}));
</script>

<template>
  <UiBadge :variant="badge.variant">{{ badge.label }}</UiBadge>
</template>
