<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next';
import { useCartStore } from '~/stores/cart';

definePageMeta({ middleware: ['auth', 'customer'] });

const cartStore = useCartStore();
const { formatPrice } = useFormatPrice();
const toast = useToast();

await cartStore.fetchCart();

async function increment(item: any) {
  try {
    await cartStore.updateQuantity(item.productId, item.quantity + 1);
  } catch (e: any) {
    toast.error(extractApiMessage(e, 'Không thể cập nhật số lượng'));
  }
}

async function decrement(item: any) {
  if (item.quantity <= 1) return;
  try {
    await cartStore.updateQuantity(item.productId, item.quantity - 1);
  } catch (e: any) {
    toast.error(extractApiMessage(e, 'Không thể cập nhật số lượng'));
  }
}

async function removeItem(productId: string) {
  try {
    await cartStore.removeItem(productId);
  } catch (e: any) {
    toast.error(extractApiMessage(e, 'Không thể xóa sản phẩm'));
  }
}
</script>

<template>
  <UiContainer size="narrow" class="py-8">
    <UiText as="h1" size="2xl" class="mb-8">Giỏ hàng</UiText>
    <p
      v-if="cartStore.loadError"
      class="mb-6 text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-4 py-3"
    >
      {{ cartStore.loadError }}
    </p>
    <p
      v-if="cartStore.unavailable"
      class="mb-6 text-sm text-warning bg-warning/10 border border-warning/20 rounded-lg px-4 py-3"
    >
      Không thể tải giỏ hàng vì máy chủ tạm thời không khả dụng.
    </p>
    <UiEmptyState
      v-if="cartStore.items.length === 0"
      title="Giỏ hàng trống"
      description="Hãy xem danh mục và thêm linh kiện vào cấu hình của bạn."
    >
      <template #action><UiButton to="/products" variant="primary">Tiếp tục mua sắm</UiButton></template>
    </UiEmptyState>
    <template v-else>
      <UiCard v-for="item in cartStore.items" :key="item.productId" padding="md" class="mb-4">
        <div class="flex items-center gap-4">
          <img :src="item.product.imageUrl || '/placeholder.svg'" class="w-20 h-20 object-cover rounded-lg bg-surface-3" />
          <div class="flex-1 min-w-0">
            <NuxtLink :to="`/products/${item.product.slug}`" class="font-semibold text-fg hover:text-accent line-clamp-1">
              {{ item.product.name }}
            </NuxtLink>
            <p class="text-accent font-semibold mt-1">{{ formatPrice(item.product.price) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <UiButton variant="ghost" size="sm" :disabled="item.quantity <= 1" @click="decrement(item)">−</UiButton>
            <span class="w-8 text-center font-medium text-fg">{{ item.quantity }}</span>
            <UiButton variant="ghost" size="sm" @click="increment(item)">+</UiButton>
          </div>
          <p class="font-semibold text-fg w-28 text-right hidden sm:block">{{ formatPrice(item.product.price * item.quantity) }}</p>
          <button type="button" class="text-danger hover:text-danger/80 p-1" @click="removeItem(item.productId)">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </UiCard>
      <UiCard padding="lg" class="text-right">
        <div class="space-y-2 text-sm mb-4">
          <div class="flex justify-between pt-2 border-t border-subtle font-semibold">
            <span class="text-fg">Tổng cộng</span>
            <UiText variant="accent" size="xl" class="font-bold">{{ formatPrice(cartStore.totalPrice) }}</UiText>
          </div>
        </div>
        <UiButton to="/checkout" variant="primary" size="lg">Tiến hành thanh toán</UiButton>
      </UiCard>
    </template>
  </UiContainer>
</template>
