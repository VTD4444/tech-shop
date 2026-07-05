<script setup lang="ts">
import { useFormatPrice } from '~/composables/useFormatPrice';

defineProps<{ orders: any[] }>();
defineEmits<{ 'update-status': [id: string, status: string] }>();

const { formatPrice } = useFormatPrice();

const statusOptions = [
  { label: 'Chờ xử lý', value: 'pending' },
  { label: 'Đã xác nhận', value: 'confirmed' },
  { label: 'Đang giao', value: 'shipping' },
  { label: 'Hoàn thành', value: 'completed' },
  { label: 'Đã hủy', value: 'cancelled' },
];
</script>

<template>
  <UiCard padding="none">
    <div class="p-4 border-b border-subtle">
      <UiText as="h3" size="lg">Giao dịch gần đây</UiText>
    </div>
    <UiTable>
      <template #head>
        <UiTableHead>Mã đơn</UiTableHead>
        <UiTableHead>Khách hàng</UiTableHead>
        <UiTableHead>Trạng thái</UiTableHead>
        <UiTableHead align="right">Số tiền</UiTableHead>
        <UiTableHead align="right">Thanh toán</UiTableHead>
        <UiTableHead align="right">Chi tiết</UiTableHead>
      </template>
      <UiTableRow v-for="order in orders" :key="order.id">
        <UiTableCell>
          <NuxtLink
            :to="`/admin/orders/${order.id}`"
            class="text-accent font-mono text-xs hover:underline"
          >
            #{{ order.id }}
          </NuxtLink>
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
        <UiTableCell align="right">
          <NuxtLink
            :to="`/admin/orders/${order.id}`"
            class="text-accent text-sm hover:underline"
          >
            Xem
          </NuxtLink>
        </UiTableCell>
      </UiTableRow>
    </UiTable>
  </UiCard>
</template>
