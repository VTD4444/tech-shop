<script setup lang="ts">
import { useCartStore } from '~/stores/cart';

definePageMeta({ middleware: ['auth', 'customer'] });

const cartStore = useCartStore();
const { formatPrice } = useFormatPrice();
const toast = useToast();
const { $api } = useNuxtApp();

const addresses = ref<any[]>([]);
const selectedAddressId = ref('');
const note = ref('');
const loading = ref(false);
const payLaterLoading = ref(false);

await cartStore.fetchCart();
const addrRes: any = await $api('/users/addresses');
addresses.value = addrRes.data || [];
if (addresses.value.length) selectedAddressId.value = addresses.value[0].id;

async function createOrder() {
  if (!selectedAddressId.value) {
    toast.error('Vui lòng chọn địa chỉ giao hàng');
    return null;
  }
  const res: any = await $api('/orders/checkout', {
    method: 'POST',
    body: { shippingAddressId: selectedAddressId.value, note: note.value },
  });
  return res.data;
}

const { redirectToSePay } = useSePayCheckout();

async function placeOrderAndPay() {
  loading.value = true;
  try {
    const order = await createOrder();
    if (!order?.id) return;
    toast.success('Đã tạo đơn hàng! Đang chuyển đến SePay...');
    await redirectToSePay(order.id);
  } catch (e: any) {
    toast.error(e.data?.message || e.message || 'Thanh toán thất bại');
    loading.value = false;
  }
}

async function placeOrderPayLater() {
  payLaterLoading.value = true;
  try {
    const order = await createOrder();
    if (!order?.id) return;
    toast.success('Đã đặt hàng! Bạn có thể thanh toán sau từ trang chi tiết đơn hàng.');
    await navigateTo(`/orders/${order.id}`);
  } catch (e: any) {
    toast.error(e.data?.message || 'Thanh toán thất bại');
  } finally {
    payLaterLoading.value = false;
  }
}
</script>

<template>
  <UiContainer class="py-8">
    <UiText as="h1" size="2xl" class="mb-8">Thanh toán</UiText>
    <div class="grid lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-6">
        <UiCard padding="md">
          <UiText as="h2" size="lg" class="mb-4">Xem lại đơn hàng</UiText>
          <UiEmptyState
            v-if="!cartStore.items.length"
            title="Giỏ hàng trống"
            description="Hãy thêm sản phẩm trước khi thanh toán."
          >
            <template #action><UiButton to="/products" variant="primary">Xem sản phẩm</UiButton></template>
          </UiEmptyState>
          <div v-else class="divide-y divide-subtle">
            <div
              v-for="item in cartStore.items"
              :key="item.productId"
              class="flex justify-between items-center py-3 first:pt-0 last:pb-0"
            >
              <div class="flex items-center gap-3 min-w-0">
                <img
                  :src="item.product.imageUrl || '/placeholder.svg'"
                  class="w-14 h-14 object-cover rounded-lg bg-surface-3 shrink-0"
                  alt=""
                />
                <div class="min-w-0">
                  <p class="font-medium text-fg truncate">{{ item.product.name }}</p>
                  <p class="text-sm text-fg-muted">SL: {{ item.quantity }}</p>
                </div>
              </div>
              <span class="font-semibold text-fg shrink-0 ml-2">
                {{ formatPrice(item.product.price * item.quantity) }}
              </span>
            </div>
          </div>
        </UiCard>

        <UiCard padding="md">
          <UiText as="h2" size="lg" class="mb-4">Địa chỉ giao hàng</UiText>
          <UiEmptyState v-if="!addresses.length" title="Chưa có địa chỉ" description="Hãy thêm địa chỉ trong hồ sơ của bạn trước.">
            <template #action><UiButton to="/profile" variant="secondary">Đến hồ sơ</UiButton></template>
          </UiEmptyState>
          <div v-else class="space-y-2">
            <label
              v-for="addr in addresses"
              :key="addr.id"
              class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
              :class="selectedAddressId === addr.id ? 'border-accent bg-accent-muted' : 'border-subtle hover:border-accent/30'"
            >
              <input v-model="selectedAddressId" type="radio" :value="addr.id" class="mt-1 accent-accent" />
              <div class="text-sm">
                <p class="font-medium text-fg">{{ addr.receiverName }} · {{ addr.phone }}</p>
                <p class="text-fg-muted">{{ addr.addressLine }}</p>
              </div>
            </label>
          </div>
        </UiCard>

        <UiCard padding="md">
          <UiText as="h2" size="lg" class="mb-4">Ghi chú đơn hàng</UiText>
          <UiInput v-model="note" placeholder="Ghi chú tùy chọn cho đơn hàng..." />
        </UiCard>

        <UiCard padding="md">
          <UiText as="h2" size="lg" class="mb-2">Thanh toán</UiText>
          <UiText variant="muted" size="sm">Bạn sẽ được chuyển đến SePay để hoàn tất thanh toán.</UiText>
        </UiCard>
      </div>

      <UiCard padding="md" class="h-fit">
        <UiText as="h2" size="lg" class="mb-4">Tóm tắt đơn hàng</UiText>
        <div v-for="item in cartStore.items" :key="item.productId" class="flex justify-between text-sm py-2 border-b border-subtle">
          <span class="text-fg-muted truncate mr-2">{{ item.product.name }} × {{ item.quantity }}</span>
          <span class="text-fg shrink-0">{{ formatPrice(item.product.price * item.quantity) }}</span>
        </div>
        <div class="space-y-2 text-sm border-t border-subtle pt-4 mt-4">
          <div class="flex justify-between font-semibold text-base pt-2">
            <UiText size="lg">Tổng cộng</UiText>
            <UiText variant="accent" size="xl" class="font-bold">{{ formatPrice(cartStore.totalPrice) }}</UiText>
          </div>
        </div>
        <UiButton
          variant="primary"
          block
          class="mt-6"
          :loading="loading"
          :disabled="!cartStore.items.length || payLaterLoading"
          @click="placeOrderAndPay"
        >
          Thanh toán
        </UiButton>
        <UiButton
          variant="secondary"
          block
          class="mt-3"
          :loading="payLaterLoading"
          :disabled="!cartStore.items.length || loading"
          @click="placeOrderPayLater"
        >
          Thanh toán sau
        </UiButton>
      </UiCard>
    </div>
  </UiContainer>
</template>
