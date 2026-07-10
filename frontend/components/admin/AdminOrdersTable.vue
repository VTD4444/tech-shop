<script setup lang="ts">
import { useFormatPrice } from '~/composables/useFormatPrice';

withDefaults(
  defineProps<{
    orders: any[];
    count?: number;
    loading?: boolean;
  }>(),
  { loading: false },
);

defineEmits<{ 'update-status': [id: string, status: string] }>();

const { formatPrice } = useFormatPrice();

const statusOptions = [
  { label: 'Chờ xử lý', value: 'pending' },
  { label: 'Đã xác nhận', value: 'confirmed' },
  { label: 'Đang giao', value: 'shipping' },
  { label: 'Đã giao', value: 'delivered' },
  { label: 'Đã hủy', value: 'cancelled' },
];
</script>

<template>
  <UiDataTable
    title="Giao dịch gần đây"
    description="Theo dõi và cập nhật trạng thái đơn hàng"
    :loading="loading"
    :count="count ?? orders.length"
    :empty="!loading && orders.length === 0"
    empty-title="Chưa có đơn hàng"
    empty-description="Đơn hàng mới sẽ hiển thị tại đây."
  >
    <template #head>
      <UiTableHead>Mã đơn</UiTableHead>
      <UiTableHead>Khách hàng</UiTableHead>
      <UiTableHead>Trạng thái</UiTableHead>
      <UiTableHead align="right">Số tiền</UiTableHead>
      <UiTableHead align="right">Thanh toán</UiTableHead>
      <UiTableHead align="right" width="sm">Chi tiết</UiTableHead>
    </template>

    <UiTableRow v-for="order in orders" :key="order.id">
      <UiTableCell variant="emphasis">
        <UiTableAction :to="`/admin/orders/${order.id}`">
          <span class="font-mono text-xs">#{{ order.id }}</span>
        </UiTableAction>
      </UiTableCell>
      <UiTableCell variant="muted">
        {{ order.user?.email || order.customerName || '—' }}
      </UiTableCell>
      <UiTableCell>
        <UiSelect
          :model-value="order.status"
          :options="statusOptions"
          class="!max-w-[150px] !py-1.5 text-xs"
          @update:model-value="$emit('update-status', order.id, $event)"
        />
      </UiTableCell>
      <UiTableCell align="right" variant="numeric">
        <span class="font-semibold text-accent">{{ formatPrice(order.totalAmount) }}</span>
      </UiTableCell>
      <UiTableCell align="right">
        <PaymentStatusBadge :status="order.paymentStatus" />
      </UiTableCell>
      <UiTableCell variant="actions">
        <UiTableAction :to="`/admin/orders/${order.id}`">Xem</UiTableAction>
      </UiTableCell>
    </UiTableRow>

    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UiDataTable>
</template>
