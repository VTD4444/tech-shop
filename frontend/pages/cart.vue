<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next';
import { useCartStore } from '~/stores/cart';

definePageMeta({ middleware: 'auth' });

const cartStore = useCartStore();
const { formatPrice } = useFormatPrice();

await cartStore.fetchCart();

async function increment(item: any) {
  await cartStore.updateQuantity(item.productId, item.quantity + 1);
}

async function decrement(item: any) {
  if (item.quantity > 1) await cartStore.updateQuantity(item.productId, item.quantity - 1);
}
</script>

<template>
  <UiContainer size="narrow" class="py-8">
    <UiText as="h1" size="2xl" class="mb-8">Shopping Cart</UiText>
    <p
      v-if="cartStore.unavailable"
      class="mb-6 text-sm text-warning bg-warning/10 border border-warning/20 rounded-lg px-4 py-3"
    >
      Cart could not be loaded because the server is temporarily unavailable.
    </p>
    <UiEmptyState
      v-if="cartStore.items.length === 0"
      title="Your cart is empty"
      description="Browse our catalog and add components to your build."
    >
      <template #action><UiButton to="/products" variant="primary">Continue Shopping</UiButton></template>
    </UiEmptyState>
    <template v-else>
      <UiCard v-for="item in cartStore.items" :key="item.productId" padding="md" class="mb-4">
        <div class="flex items-center gap-4">
          <img :src="item.product.imageUrl || '/placeholder.svg'" class="w-20 h-20 object-cover rounded-lg bg-surface-3" />
          <div class="flex-1 min-w-0">
            <NuxtLink :to="`/products/${item.product.slug}`" class="font-semibold text-text-primary hover:text-accent line-clamp-1">
              {{ item.product.name }}
            </NuxtLink>
            <p class="text-accent font-semibold mt-1">{{ formatPrice(item.product.price) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <UiButton variant="ghost" size="sm" :disabled="item.quantity <= 1" @click="decrement(item)">−</UiButton>
            <span class="w-8 text-center font-medium text-text-primary">{{ item.quantity }}</span>
            <UiButton variant="ghost" size="sm" @click="increment(item)">+</UiButton>
          </div>
          <p class="font-semibold text-text-primary w-28 text-right hidden sm:block">{{ formatPrice(item.product.price * item.quantity) }}</p>
          <button type="button" class="text-danger hover:text-danger/80 p-1" @click="cartStore.removeItem(item.productId)">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </UiCard>
      <UiCard padding="lg" class="text-right">
        <UiText variant="muted" size="sm" class="mb-1">Total</UiText>
        <UiText variant="accent" size="2xl" class="font-bold mb-4">{{ formatPrice(cartStore.totalPrice) }}</UiText>
        <UiButton to="/checkout" variant="primary" size="lg">Proceed to Checkout</UiButton>
      </UiCard>
    </template>
  </UiContainer>
</template>
