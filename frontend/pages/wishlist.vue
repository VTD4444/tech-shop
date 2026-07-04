<script setup lang="ts">
import { Heart, Trash2 } from 'lucide-vue-next';
import { useWishlistStore } from '~/stores/wishlist';
import { useAuthStore } from '~/stores/auth';

definePageMeta({ middleware: ['auth', 'customer'] });

const wishlistStore = useWishlistStore();
const authStore = useAuthStore();
const { formatPrice } = useFormatPrice();
const toast = useToast();
const loading = ref(true);

try {
  await wishlistStore.fetchWishlist();
} catch {
  toast.error('Không thể tải danh sách yêu thích');
} finally {
  loading.value = false;
}

async function removeFromWishlist(productId: string) {
  await wishlistStore.removeItem(productId);
  toast.info('Đã xóa khỏi danh sách yêu thích');
}
</script>

<template>
  <UiContainer class="py-8">
    <UiText as="h1" size="2xl" class="mb-8">Danh sách yêu thích</UiText>

    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      <UiSkeleton v-for="i in 3" :key="i" class="h-80" />
    </div>

    <UiEmptyState
      v-else-if="!wishlistStore.items.length"
      title="Danh sách yêu thích trống"
      description="Lưu các sản phẩm bạn thích và quay lại sau."
    >
      <template #action>
        <UiButton to="/products" variant="primary">Xem sản phẩm</UiButton>
      </template>
    </UiEmptyState>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      <UiCard v-for="item in wishlistStore.items" :key="item.id || item.productId" padding="md">
        <div class="flex flex-col h-full">
          <NuxtLink :to="`/products/${item.product?.slug}`" class="block mb-4">
            <img
              :src="item.product?.imageUrl || '/placeholder.svg'"
              class="w-full aspect-square object-cover rounded-lg bg-surface-3"
              alt=""
            />
          </NuxtLink>
          <NuxtLink
            :to="`/products/${item.product?.slug}`"
            class="font-semibold text-text-primary hover:text-accent line-clamp-2 mb-2"
          >
            {{ item.product?.name }}
          </NuxtLink>
          <p class="text-accent font-bold mb-4">{{ formatPrice(item.product?.price || 0) }}</p>
          <div class="mt-auto flex gap-2">
            <UiButton :to="`/products/${item.product?.slug}`" variant="secondary" size="sm" block>
              Xem
            </UiButton>
            <button
              type="button"
              class="p-2 text-danger hover:bg-danger-muted rounded-lg"
              aria-label="Xóa khỏi danh sách yêu thích"
              @click="removeFromWishlist(String(item.productId || item.product?.id))"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </UiCard>
    </div>
  </UiContainer>
</template>
