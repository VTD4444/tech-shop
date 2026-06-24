<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'customer'] });

const route = useRoute();
const { $api } = useNuxtApp();
const { formatPrice } = useFormatPrice();
const toast = useToast();

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

async function payWithVNPay() {
  const data: any = await $api(`/payments/vnpay/create-url?orderId=${order.value.id}`, { method: 'POST' });
  if (data.data?.paymentUrl) window.location.href = data.data.paymentUrl;
}

async function cancelOrder() {
  if (!confirm('Cancel this order?')) return;
  await $api(`/orders/${order.value.id}/cancel`, { method: 'PATCH' });
  order.value.status = 'cancelled';
  toast.info('Order cancelled');
}
</script>

<template>
  <UiContainer size="narrow" class="py-8">
    <div v-if="loading" class="space-y-4"><UiSkeleton class="h-8 w-1/3" /><UiSkeleton class="h-48" /></div>
    <UiEmptyState v-else-if="!order" title="Order not found">
      <template #action><UiButton to="/orders" variant="secondary">Back to Orders</UiButton></template>
    </UiEmptyState>
    <div v-else>
      <NuxtLink to="/orders" class="text-accent text-sm hover:underline mb-4 inline-block">← Back to Orders</NuxtLink>
      <UiText as="h1" size="2xl" class="mb-1">Order #{{ order.id }}</UiText>
      <UiText variant="muted" size="sm" class="mb-6">{{ new Date(order.createdAt).toLocaleDateString('vi-VN') }}</UiText>
      <div class="grid md:grid-cols-2 gap-6 mb-8">
        <UiCard padding="md">
          <UiText as="h2" size="lg" class="mb-3">Status</UiText>
          <div class="flex gap-2 mb-4">
            <OrderStatusBadge :status="order.status" />
            <PaymentStatusBadge :status="order.paymentStatus" />
          </div>
        </UiCard>
        <UiCard padding="md">
          <UiText as="h2" size="lg" class="mb-3">Shipping</UiText>
          <p class="text-sm text-text-primary">{{ order.customerName }} · {{ order.customerPhone }}</p>
          <p class="text-sm text-text-muted mt-1">{{ order.shippingAddress }}</p>
        </UiCard>
      </div>
      <UiCard padding="md" class="mb-8">
        <UiText as="h2" size="lg" class="mb-4">Order Timeline</UiText>
        <OrderTimeline :order="order" />
      </UiCard>

      <UiCard padding="none">
        <div class="p-4 border-b border-subtle"><UiText as="h2" size="lg">Items</UiText></div>
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
          <UiText variant="accent" size="2xl" class="font-bold">Total: {{ formatPrice(order.totalAmount) }}</UiText>
        </div>
      </UiCard>
      <div v-if="order.paymentStatus === 'unpaid' && order.status === 'pending'" class="mt-6 flex flex-wrap gap-4">
        <UiButton variant="primary" @click="payWithVNPay">Pay with VNPAY</UiButton>
        <UiButton variant="danger" @click="cancelOrder">Cancel Order</UiButton>
      </div>
    </div>
  </UiContainer>
</template>
