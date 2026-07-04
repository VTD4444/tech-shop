<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'customer'] });

const route = useRoute();
const { $api } = useNuxtApp();
const { formatPrice } = useFormatPrice();
const toast = useToast();
const confirmDialog = useConfirmDialog();

const order = ref<any>(null);
const loading = ref(true);

try {
  const data: any = await $api(`/orders/${route.params.id}`);
  order.value = data.data;
} catch {
  order.value = null;
} finally {
  loading.value = false;
}

const { redirectToSePay } = useSePayCheckout();

async function payWithSePay() {
  try {
    await redirectToSePay(order.value.id);
  } catch (e: any) {
    toast.error(e.data?.message || e.message || 'Không thể khởi tạo thanh toán SePay');
  }
}

async function cancelOrder() {
  const ok = await confirmDialog.confirm({
    title: 'Hủy đơn hàng',
    message: 'Bạn có chắc muốn hủy đơn hàng này?',
    confirmLabel: 'Hủy đơn',
  });
  if (!ok) return;
  await $api(`/orders/${order.value.id}/cancel`, { method: 'PATCH' });
  order.value.status = 'cancelled';
  toast.info('Đã hủy đơn hàng');
}
</script>

<template>
  <UiContainer size="narrow" class="py-8">
    <div v-if="loading" class="space-y-4"><UiSkeleton class="h-8 w-1/3" /><UiSkeleton class="h-48" /></div>
    <UiEmptyState v-else-if="!order" title="Không tìm thấy đơn hàng">
      <template #action><UiButton to="/orders" variant="secondary">Quay lại đơn hàng</UiButton></template>
    </UiEmptyState>
    <div v-else>
      <NuxtLink to="/orders" class="text-accent text-sm hover:underline mb-4 inline-block">← Quay lại đơn hàng</NuxtLink>
      <UiText as="h1" size="2xl" class="mb-1">Đơn hàng #{{ order.id }}</UiText>
      <UiText variant="muted" size="sm" class="mb-6">{{ new Date(order.createdAt).toLocaleDateString('vi-VN') }}</UiText>
      <div class="grid md:grid-cols-2 gap-6 mb-8">
        <UiCard padding="md">
          <UiText as="h2" size="lg" class="mb-3">Trạng thái</UiText>
          <div class="flex gap-2 mb-4">
            <OrderStatusBadge :status="order.status" />
            <PaymentStatusBadge :status="order.paymentStatus" />
          </div>
        </UiCard>
        <UiCard padding="md">
          <UiText as="h2" size="lg" class="mb-3">Giao hàng</UiText>
          <p class="text-sm text-text-primary">{{ order.customerName }} · {{ order.customerPhone }}</p>
          <p class="text-sm text-text-muted mt-1">{{ order.shippingAddress }}</p>
        </UiCard>
      </div>
      <UiCard padding="md" class="mb-8">
        <UiText as="h2" size="lg" class="mb-4">Tiến trình đơn hàng</UiText>
        <OrderTimeline :order="order" />
      </UiCard>

      <UiCard padding="none">
        <div class="p-4 border-b border-subtle"><UiText as="h2" size="lg">Sản phẩm</UiText></div>
        <div v-for="item in order.items" :key="item.id" class="flex justify-between items-center px-4 py-4 border-b border-subtle last:border-0">
          <div class="flex items-center gap-4">
            <img :src="item.productImageUrl || '/placeholder.svg'" class="w-16 h-16 object-cover rounded-lg bg-surface-3" />
            <div>
              <NuxtLink :to="`/products/${item.productSlug}`" class="font-medium text-text-primary hover:text-accent">{{ item.productName }}</NuxtLink>
              <p class="text-sm text-text-muted">× {{ item.quantity }}</p>
            </div>
          </div>
          <span class="font-semibold text-accent">{{ formatPrice(item.subtotal) }}</span>
        </div>
        <div class="p-4 text-right">
          <UiText variant="accent" size="2xl" class="font-bold">Tổng cộng: {{ formatPrice(order.totalAmount) }}</UiText>
        </div>
      </UiCard>
      <div v-if="order.paymentStatus === 'unpaid' && order.status === 'pending'" class="mt-6 flex flex-wrap gap-4">
        <UiButton variant="primary" @click="payWithSePay">Thanh toán bằng SePay</UiButton>
        <UiButton variant="danger" @click="cancelOrder">Hủy đơn hàng</UiButton>
      </div>
    </div>
  </UiContainer>
</template>
