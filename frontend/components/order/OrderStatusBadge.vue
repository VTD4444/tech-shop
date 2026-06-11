<script setup lang="ts">
const props = defineProps<{ status: string }>();

const map: Record<string, { variant: 'pending' | 'success' | 'neutral' | 'danger' | 'warning'; label: string }> = {
  pending: { variant: 'pending', label: 'Pending' },
  confirmed: { variant: 'success', label: 'Confirmed' },
  shipping: { variant: 'neutral', label: 'Shipping' },
  completed: { variant: 'success', label: 'Completed' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
};

const badge = computed(() => map[props.status] || { variant: 'neutral' as const, label: props.status });
</script>

<template>
  <UiBadge :variant="badge.variant">{{ badge.label }}</UiBadge>
</template>
