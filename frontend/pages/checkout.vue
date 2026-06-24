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
    toast.error('Please select a shipping address');
    return null;
  }
  const res: any = await $api('/orders/checkout', {
    method: 'POST',
    body: { shippingAddressId: selectedAddressId.value, note: note.value },
  });
  return res.data;
}

async function redirectToVNPay(orderId: string) {
  const paymentRes: any = await $api(`/payments/vnpay/create-url?orderId=${orderId}`, {
    method: 'POST',
  });
  const paymentUrl = paymentRes.data?.paymentUrl;
  if (!paymentUrl) {
    throw new Error('Payment URL not available');
  }
  window.location.href = paymentUrl;
}

async function placeOrderAndPay() {
  loading.value = true;
  try {
    const order = await createOrder();
    if (!order?.id) return;
    toast.success('Order created! Redirecting to VNPay...');
    await redirectToVNPay(order.id);
  } catch (e: any) {
    toast.error(e.data?.message || e.message || 'Checkout failed');
    loading.value = false;
  }
}

async function placeOrderPayLater() {
  payLaterLoading.value = true;
  try {
    const order = await createOrder();
    if (!order?.id) return;
    toast.success('Order placed! You can pay later from order details.');
    await navigateTo(`/orders/${order.id}`);
  } catch (e: any) {
    toast.error(e.data?.message || 'Checkout failed');
  } finally {
    payLaterLoading.value = false;
  }
}
</script>

<template>
  <UiContainer class="py-8">
    <UiText as="h1" size="2xl" class="mb-8">Checkout</UiText>
    <div class="grid lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-6">
        <UiCard padding="md">
          <UiText as="h2" size="lg" class="mb-4">Review Order</UiText>
          <UiEmptyState
            v-if="!cartStore.items.length"
            title="Cart is empty"
            description="Add items before checkout."
          >
            <template #action><UiButton to="/products" variant="primary">Browse Products</UiButton></template>
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
                  <p class="font-medium text-text-primary truncate">{{ item.product.name }}</p>
                  <p class="text-sm text-text-muted">Qty: {{ item.quantity }}</p>
                </div>
              </div>
              <span class="font-semibold text-text-primary shrink-0 ml-2">
                {{ formatPrice(item.product.price * item.quantity) }}
              </span>
            </div>
          </div>
        </UiCard>

        <UiCard padding="md">
          <UiText as="h2" size="lg" class="mb-4">Shipping Address</UiText>
          <UiEmptyState v-if="!addresses.length" title="No addresses" description="Add an address in your profile first.">
            <template #action><UiButton to="/profile" variant="secondary">Go to Profile</UiButton></template>
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
                <p class="font-medium text-text-primary">{{ addr.receiverName }} · {{ addr.phone }}</p>
                <p class="text-text-muted">{{ addr.addressLine }}</p>
              </div>
            </label>
          </div>
        </UiCard>

        <UiCard padding="md">
          <UiText as="h2" size="lg" class="mb-4">Order Note</UiText>
          <UiInput v-model="note" placeholder="Optional note for your order..." />
        </UiCard>

        <UiCard padding="md">
          <UiText as="h2" size="lg" class="mb-2">Payment</UiText>
          <UiText variant="muted" size="sm">You will be redirected to VNPay Sandbox to complete payment.</UiText>
        </UiCard>
      </div>

      <UiCard padding="md" class="h-fit">
        <UiText as="h2" size="lg" class="mb-4">Order Summary</UiText>
        <div v-for="item in cartStore.items" :key="item.productId" class="flex justify-between text-sm py-2 border-b border-subtle">
          <span class="text-text-muted truncate mr-2">{{ item.product.name }} × {{ item.quantity }}</span>
          <span class="text-text-primary shrink-0">{{ formatPrice(item.product.price * item.quantity) }}</span>
        </div>
        <div class="space-y-2 text-sm border-t border-subtle pt-4 mt-4">
          <div class="flex justify-between">
            <span class="text-text-muted">Subtotal</span>
            <span>{{ formatPrice(cartStore.subtotal) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-text-muted">Tax (10%)</span>
            <span>{{ formatPrice(cartStore.tax) }}</span>
          </div>
          <div class="flex justify-between font-semibold text-base pt-2">
            <UiText size="lg">Total</UiText>
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
          Pay with VNPay
        </UiButton>
        <UiButton
          variant="secondary"
          block
          class="mt-3"
          :loading="payLaterLoading"
          :disabled="!cartStore.items.length || loading"
          @click="placeOrderPayLater"
        >
          Pay Later
        </UiButton>
      </UiCard>
    </div>
  </UiContainer>
</template>
