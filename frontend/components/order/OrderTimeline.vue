<script setup lang="ts">
const props = defineProps<{
  order: {
    createdAt: string;
    status: string;
    paymentStatus: string;
    updatedAt?: string;
  };
}>();

const steps = computed(() => {
  const o = props.order;
  const paid = o.paymentStatus === 'paid';
  const processing = ['confirmed', 'processing'].includes(o.status);
  const shipping = o.status === 'shipping';
  const delivered = o.status === 'completed';

  return [
    { key: 'created', label: 'Đã tạo', done: true, date: o.createdAt },
    { key: 'paid', label: 'Đã thanh toán', done: paid, date: paid ? o.updatedAt : null },
    { key: 'processing', label: 'Đang xử lý', done: processing || shipping || delivered, date: null },
    { key: 'shipping', label: 'Đang giao', done: shipping || delivered, date: null },
    { key: 'delivered', label: 'Đã giao', done: delivered, date: delivered ? o.updatedAt : null },
  ];
});
</script>

<template>
  <ol class="relative border-l border-subtle ml-3 space-y-6">
    <li v-for="step in steps" :key="step.key" class="ml-6">
      <span
        class="absolute -left-1.5 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-surface-1"
        :class="step.done ? 'bg-accent' : 'bg-surface-3 border border-subtle'"
      />
      <UiText
        size="sm"
        class="font-medium"
        :class="step.done ? 'text-text-primary' : 'text-text-muted'"
      >
        {{ step.label }}
      </UiText>
      <p v-if="step.date" class="text-xs text-text-muted mt-0.5">
        {{ new Date(step.date).toLocaleString('vi-VN') }}
      </p>
    </li>
  </ol>
</template>
