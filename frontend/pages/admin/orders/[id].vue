<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] });

const route = useRoute();
const { $api } = useNuxtApp();
const { formatPrice } = useFormatPrice();
const toast = useToast();

const order = ref<any>(null);
const loading = ref(true);
const saving = ref(false);

const statusOptions = [
  { label: 'Chờ xử lý', value: 'pending' },
  { label: 'Đã xác nhận', value: 'confirmed' },
  { label: 'Đang giao', value: 'shipping' },
  { label: 'Đã giao', value: 'delivered' },
  { label: 'Đã hủy', value: 'cancelled' },
];

async function loadOrder() {
  loading.value = true;
  try {
    const res: any = await $api(`/admin/orders/${route.params.id}`);
    order.value = res.data ?? res;
  } catch {
    order.value = null;
  } finally {
    loading.value = false;
  }
}

await loadOrder();

async function updateStatus(status: string) {
  if (!order.value || order.value.status === status) return;
  saving.value = true;
  try {
    await $api(`/admin/orders/${order.value.id}/status?status=${status}`, {
      method: 'PATCH',
    });
    order.value.status = status;
    toast.success('Đã cập nhật trạng thái đơn hàng');
  } catch (e: any) {
    toast.error(e.data?.message || 'Không thể cập nhật trạng thái');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <NuxtLink
      to="/admin/orders"
      class="text-accent text-sm hover:underline mb-4 inline-block"
    >
      ← Quay lại danh sách đơn hàng
    </NuxtLink>

    <div v-if="loading" class="space-y-4">
      <UiSkeleton class="h-8 w-1/3" />
      <UiSkeleton class="h-48" />
    </div>

    <UiEmptyState v-else-if="!order" title="Không tìm thấy đơn hàng">
      <template #action>
        <UiButton to="/admin/orders" variant="secondary">Quay lại</UiButton>
      </template>
    </UiEmptyState>

    <div v-else>
      <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <UiText as="h1" size="2xl" class="mb-1">Đơn hàng #{{ order.id }}</UiText>
          <UiText variant="muted" size="sm">
            {{ new Date(order.createdAt).toLocaleString('vi-VN') }}
          </UiText>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <OrderStatusBadge :status="order.status" />
          <PaymentStatusBadge :status="order.paymentStatus" />
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-6 mb-8">
        <UiCard padding="md" class="lg:col-span-2">
          <UiText as="h2" size="lg" class="mb-4">Khách hàng & giao hàng</UiText>
          <dl class="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt class="text-fg-muted mb-1">Họ tên</dt>
              <dd class="text-fg font-medium">{{ order.customerName }}</dd>
            </div>
            <div>
              <dt class="text-fg-muted mb-1">Số điện thoại</dt>
              <dd class="text-fg">{{ order.customerPhone }}</dd>
            </div>
            <div v-if="order.user" class="sm:col-span-2">
              <dt class="text-fg-muted mb-1">Tài khoản</dt>
              <dd class="text-fg">
                {{ order.user.fullName }} · {{ order.user.email }}
              </dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-fg-muted mb-1">Địa chỉ giao hàng</dt>
              <dd class="text-fg">{{ order.shippingAddress }}</dd>
            </div>
            <div v-if="order.note" class="sm:col-span-2">
              <dt class="text-fg-muted mb-1">Ghi chú</dt>
              <dd class="text-fg">{{ order.note }}</dd>
            </div>
          </dl>
        </UiCard>

        <UiCard padding="md">
          <UiText as="h2" size="lg" class="mb-4">Cập nhật trạng thái</UiText>
          <UiSelect
            :model-value="order.status"
            :options="statusOptions"
            :disabled="saving"
            class="mb-4"
            @update:model-value="updateStatus"
          />
          <UiText variant="muted" size="xs">
            Chọn trạng thái mới để cập nhật tiến trình xử lý đơn.
          </UiText>
        </UiCard>
      </div>

      <UiCard padding="md" class="mb-8">
        <UiText as="h2" size="lg" class="mb-4">Tiến trình</UiText>
        <OrderTimeline :order="order" />
      </UiCard>

      <UiCard v-if="order.paymentTxn" padding="md" class="mb-8">
        <UiText as="h2" size="lg" class="mb-4">Thanh toán SePay</UiText>
        <dl class="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-fg-muted mb-1">Mã hóa đơn</dt>
            <dd class="font-mono text-xs text-fg break-all">
              {{ order.paymentTxn.invoiceNumber }}
            </dd>
          </div>
          <div>
            <dt class="text-fg-muted mb-1">Trạng thái giao dịch</dt>
            <dd>
              <UiBadge variant="neutral">{{ order.paymentTxn.status }}</UiBadge>
            </dd>
          </div>
          <div>
            <dt class="text-fg-muted mb-1">Số tiền</dt>
            <dd class="text-accent font-semibold">{{ formatPrice(order.paymentTxn.amount) }}</dd>
          </div>
          <div v-if="order.paymentTxn.paymentDate">
            <dt class="text-fg-muted mb-1">Thời gian thanh toán</dt>
            <dd class="text-fg">
              {{ new Date(order.paymentTxn.paymentDate).toLocaleString('vi-VN') }}
            </dd>
          </div>
          <div v-if="order.paymentTxn.externalTxnId" class="sm:col-span-2">
            <dt class="text-fg-muted mb-1">Mã giao dịch SePay</dt>
            <dd class="font-mono text-xs text-fg break-all">
              {{ order.paymentTxn.externalTxnId }}
            </dd>
          </div>
        </dl>
      </UiCard>

      <UiDataTable
        :title="`Sản phẩm (${order.items?.length || 0})`"
        :empty="!order.items?.length"
        empty-title="Không có sản phẩm"
      >
        <template #head>
          <UiTableHead>Sản phẩm</UiTableHead>
          <UiTableHead align="right">Đơn giá</UiTableHead>
          <UiTableHead align="right">SL</UiTableHead>
          <UiTableHead align="right">Thành tiền</UiTableHead>
        </template>

        <UiTableRow v-for="item in order.items" :key="item.id">
          <UiTableCell>
            <div class="flex min-w-0 items-center gap-3">
              <img
                :src="item.productImageUrl || '/placeholder.svg'"
                :alt="item.productName"
                class="h-12 w-12 shrink-0 rounded-lg bg-surface-3 object-cover"
              />
              <div class="min-w-0">
                <UiTableAction
                  v-if="item.productSlug"
                  :to="`/products/${item.productSlug}`"
                  external
                >
                  <span class="line-clamp-2 text-left">{{ item.productName }}</span>
                </UiTableAction>
                <span v-else class="font-medium text-fg">{{ item.productName }}</span>
              </div>
            </div>
          </UiTableCell>
          <UiTableCell align="right" variant="numeric">{{ formatPrice(item.price) }}</UiTableCell>
          <UiTableCell align="right" variant="numeric">{{ item.quantity }}</UiTableCell>
          <UiTableCell align="right" variant="numeric">
            <span class="font-semibold text-accent">{{ formatPrice(item.subtotal) }}</span>
          </UiTableCell>
        </UiTableRow>

        <template #footer>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center justify-between gap-4 text-sm sm:justify-start">
              <UiText variant="muted" size="sm">Phí vận chuyển</UiText>
              <UiText size="sm" class="tabular-nums">{{ formatPrice(order.shippingFee) }}</UiText>
            </div>
            <UiText variant="accent" size="xl" class="font-bold tabular-nums sm:text-right">
              Tổng cộng: {{ formatPrice(order.totalAmount) }}
            </UiText>
          </div>
        </template>
      </UiDataTable>
    </div>
  </div>
</template>
