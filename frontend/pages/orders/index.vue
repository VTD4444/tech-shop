<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'customer'] });

const { $api } = useNuxtApp();
const { formatPrice } = useFormatPrice();
const orders = ref<any[]>([]);
const page = ref(1);
const totalPages = ref(1);
const loading = ref(true);

async function loadOrders() {
  loading.value = true;
  try {
    const data: any = await $api(`/orders?page=${page.value}&limit=10`);
    orders.value = data.data || [];
    totalPages.value = data.meta?.totalPages || 1;
  } finally {
    loading.value = false;
  }
}

await loadOrders();

function goToPage(p: number) {
  page.value = p;
  loadOrders();
}
</script>

<template>
  <UiContainer size="narrow" class="py-8">
    <UiText as="h1" size="2xl" class="mb-8">My Orders</UiText>

    <div v-if="loading" class="space-y-4">
      <UiSkeleton v-for="i in 3" :key="i" class="h-32" />
    </div>

    <UiEmptyState v-else-if="!orders.length" title="No orders yet" description="Your order history will appear here.">
      <template #action><UiButton to="/products" variant="primary">Start Shopping</UiButton></template>
    </UiEmptyState>

    <template v-else>
      <UiCard v-for="order in orders" :key="order.id" padding="md" class="mb-4">
        <div class="flex flex-wrap justify-between gap-4 mb-4">
          <div>
            <p class="text-accent font-mono text-sm">#{{ order.id }}</p>
            <p class="text-text-muted text-xs">{{ new Date(order.createdAt).toLocaleDateString('vi-VN') }}</p>
          </div>
          <div class="flex gap-2">
            <OrderStatusBadge :status="order.status" />
            <PaymentStatusBadge :status="order.paymentStatus" />
          </div>
        </div>
        <div v-for="item in order.items" :key="item.id" class="flex justify-between text-sm py-1 border-b border-subtle last:border-0">
          <span class="text-text-muted">{{ item.productName }} × {{ item.quantity }}</span>
          <span class="text-text-primary">{{ formatPrice(item.subtotal) }}</span>
        </div>
        <div class="flex justify-between items-center mt-4 pt-3 border-t border-subtle">
          <NuxtLink :to="`/orders/${order.id}`" class="text-accent text-sm hover:underline">View Details →</NuxtLink>
          <UiText variant="accent" size="lg" class="font-bold">{{ formatPrice(order.totalAmount) }}</UiText>
        </div>
      </UiCard>

      <UiPagination
        v-if="totalPages > 1"
        :page="page"
        :total-pages="totalPages"
        @update:page="goToPage"
      />
    </template>
  </UiContainer>
</template>
