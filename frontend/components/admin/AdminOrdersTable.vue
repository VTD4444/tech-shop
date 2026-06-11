<script setup lang="ts">
import { useFormatPrice } from '~/composables/useFormatPrice';

defineProps<{ orders: any[] }>();
defineEmits<{ 'update-status': [id: string, status: string] }>();

const { formatPrice } = useFormatPrice();

const statusOptions = [
  { label: 'pending', value: 'pending' },
  { label: 'confirmed', value: 'confirmed' },
  { label: 'shipping', value: 'shipping' },
  { label: 'completed', value: 'completed' },
  { label: 'cancelled', value: 'cancelled' },
];
</script>

<template>
  <UiCard padding="none">
    <div class="p-4 border-b border-subtle">
      <UiText as="h3" size="lg">Recent Transaction Flow</UiText>
    </div>
    <UiTable>
      <template #head>
        <UiTableHead>Order ID</UiTableHead>
        <UiTableHead>Client</UiTableHead>
        <UiTableHead>Status</UiTableHead>
        <UiTableHead align="right">Amount</UiTableHead>
        <UiTableHead align="right">Payment</UiTableHead>
      </template>
      <UiTableRow v-for="order in orders" :key="order.id">
        <UiTableCell>
          <span class="text-accent font-mono text-xs">#{{ order.id }}</span>
        </UiTableCell>
        <UiTableCell>
          <span class="text-text-muted text-sm">{{ order.user?.email || order.customerName }}</span>
        </UiTableCell>
        <UiTableCell>
          <UiSelect
            :model-value="order.status"
            :options="statusOptions"
            class="!py-1.5 text-xs max-w-[140px]"
            @update:model-value="$emit('update-status', order.id, $event)"
          />
        </UiTableCell>
        <UiTableCell align="right">
          <span class="font-semibold text-accent">{{ formatPrice(order.totalAmount) }}</span>
        </UiTableCell>
        <UiTableCell align="right">
          <PaymentStatusBadge :status="order.paymentStatus" />
        </UiTableCell>
      </UiTableRow>
    </UiTable>
  </UiCard>
</template>
