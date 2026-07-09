<script setup lang="ts">
const props = defineProps<{ status: string }>();

const map: Record<string, { variant: 'pending' | 'success' | 'neutral' | 'danger' | 'warning'; label: string }> = {
  pending: { variant: 'pending', label: 'Chờ xử lý' },
  confirmed: { variant: 'success', label: 'Đã xác nhận' },
  processing: { variant: 'neutral', label: 'Đang xử lý' },
  shipping: { variant: 'neutral', label: 'Đang giao' },
  delivered: { variant: 'success', label: 'Đã giao' },
  completed: { variant: 'success', label: 'Hoàn thành' },
  cancelled: { variant: 'danger', label: 'Đã hủy' },
};

const badge = computed(() => map[props.status] || { variant: 'neutral' as const, label: props.status });
</script>

<template>
  <UiBadge :variant="badge.variant">{{ badge.label }}</UiBadge>
</template>
