<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { useCartStore } from '~/stores/cart';

definePageMeta({ middleware: 'auth' });

const authStore = useAuthStore();
const cartStore = useCartStore();
const { formatPrice } = useFormatPrice();
const toast = useToast();
const { $api } = useNuxtApp();

const addresses = ref<any[]>([]);
const selectedAddressId = ref('');
const note = ref('');
const loading = ref(false);

await cartStore.fetchCart();
const addrRes: any = await $api('/users/addresses');
addresses.value = addrRes.data || [];
if (addresses.value.length) selectedAddressId.value = addresses.value[0].id;

async function placeOrder() {
  if (!selectedAddressId.value) {
    toast.error('Please select a shipping address');
    return;
  }
  loading.value = true;
  try {
    const res: any = await $api('/orders/checkout', {
      method: 'POST',
      body: { shippingAddressId: selectedAddressId.value, note: note.value },
    });
    toast.success('Order placed!');
    navigateTo(`/orders/${res.data.id}`);
  } catch (e: any) {
    toast.error(e.data?.message || 'Checkout failed');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UiContainer class="py-8">
    <UiText as="h1" size="2xl" class="mb-8">Checkout</UiText>
    <div class="grid lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-6">
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
      </div>
      <UiCard padding="md" class="h-fit">
        <UiText as="h2" size="lg" class="mb-4">Order Summary</UiText>
        <div v-for="item in cartStore.items" :key="item.productId" class="flex justify-between text-sm py-2 border-b border-subtle">
          <span class="text-text-muted truncate mr-2">{{ item.product.name }} × {{ item.quantity }}</span>
          <span class="text-text-primary shrink-0">{{ formatPrice(item.product.price * item.quantity) }}</span>
        </div>
        <div class="flex justify-between mt-4 pt-4 border-t border-subtle">
          <UiText size="lg" class="font-semibold">Total</UiText>
          <UiText variant="accent" size="xl" class="font-bold">{{ formatPrice(cartStore.totalPrice) }}</UiText>
        </div>
        <UiButton variant="primary" block class="mt-6" :loading="loading" @click="placeOrder">Place Order</UiButton>
      </UiCard>
    </div>
  </UiContainer>
</template>
