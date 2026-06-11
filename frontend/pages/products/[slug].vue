<script setup lang="ts">
import { Heart } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { useCartStore } from '~/stores/cart';
import { useProductStore } from '~/stores/product';

const route = useRoute();
const productStore = useProductStore();
const cartStore = useCartStore();
const authStore = useAuthStore();
const toast = useToast();
const { formatPrice } = useFormatPrice();
const { stockBadge } = useProductStatus();

const systemStore = useSystemStore();
const product = ref<any>(null);
const reviews = ref<any[]>([]);
const loading = ref(true);
const inWishlist = ref(false);
const slug = route.params.slug as string;

product.value = await productStore.fetchProduct(slug);

if (product.value && !productStore.usingFallback) {
  try {
    const { $api } = useNuxtApp();
    const revData: any = await $api(`/products/${slug}/reviews`);
    reviews.value = revData.data || [];
  } catch {
    reviews.value = [];
  }
}

loading.value = false;

const badge = computed(() => product.value ? stockBadge(product.value.stockQuantity) : null);

async function addToCart() {
  if (systemStore.apiDegraded || productStore.usingFallback) {
    toast.error('Cart is unavailable while the server is offline.');
    return;
  }
  if (!authStore.isAuthenticated) return navigateTo('/login');
  try {
    await cartStore.addItem(product.value.id.toString());
    toast.success('Added to cart');
  } catch {
    toast.error('Could not add to cart. Please try again later.');
  }
}

async function toggleWishlist() {
  if (!authStore.isAuthenticated) return navigateTo('/login');
  const { $api } = useNuxtApp();
  if (inWishlist.value) {
    await $api(`/wishlist/${product.value.id}`, { method: 'DELETE' });
    inWishlist.value = false;
  } else {
    await $api(`/wishlist/${product.value.id}`, { method: 'POST' });
    inWishlist.value = true;
  }
}
</script>

<template>
  <UiContainer class="py-8">
    <div v-if="loading" class="grid md:grid-cols-2 gap-10">
      <UiSkeleton class="aspect-square" />
      <div class="space-y-4"><UiSkeleton class="h-8 w-2/3" /><UiSkeleton class="h-12 w-1/3" /><UiSkeleton :lines="4" class="h-24" /></div>
    </div>
    <UiEmptyState
      v-else-if="!product"
      :title="systemStore.apiDegraded ? 'Product unavailable offline' : 'Product not found'"
      :description="systemStore.apiDegraded ? 'This product is not in the offline catalog. Browse sample products instead.' : 'This product may have been removed.'"
    >
      <template #action><UiButton to="/products" variant="primary">Browse Products</UiButton></template>
    </UiEmptyState>
    <div v-else>
      <nav class="text-sm mb-6 text-text-muted">
        <NuxtLink to="/products" class="hover:text-accent">Products</NuxtLink>
        <span class="mx-2">/</span>
        <span>{{ product.name }}</span>
      </nav>
      <div class="grid lg:grid-cols-2 gap-10">
        <div>
          <UiCard padding="none" class="overflow-hidden">
            <img :src="product.imageUrl || '/placeholder.svg'" :alt="product.name" class="w-full aspect-square object-cover" />
          </UiCard>
          <div v-if="product.images?.length" class="flex gap-2 mt-4">
            <img v-for="img in product.images" :key="img.id" :src="img.imageUrl"
              class="w-16 h-16 object-cover rounded-lg border-2 cursor-pointer"
              :class="img.isMain ? 'border-accent' : 'border-subtle'" />
          </div>
        </div>
        <div>
          <div class="flex gap-2 mb-3 flex-wrap">
            <UiBadge v-if="product.brand" variant="neutral">{{ product.brand.name }}</UiBadge>
            <UiBadge v-if="product.isPcComponent" variant="accent">PC Component</UiBadge>
            <UiBadge v-if="badge" :variant="badge.variant">{{ badge.label }}</UiBadge>
          </div>
          <UiText as="h1" size="2xl" class="mb-3">{{ product.name }}</UiText>
          <UiText variant="accent" size="3xl" class="font-bold mb-4">{{ formatPrice(product.price) }}</UiText>
          <UiText variant="muted" class="mb-6 leading-relaxed">{{ product.description }}</UiText>
          <p
            v-if="productStore.usingFallback"
            class="mb-4 text-sm text-warning bg-warning/10 border border-warning/20 rounded-lg px-4 py-3"
          >
            Offline mode — this is sample catalog data. Purchasing is disabled until the server recovers.
          </p>
          <div class="flex gap-3 mb-8">
            <UiButton
              variant="primary"
              size="lg"
              block
              class="flex-1"
              :disabled="product.stockQuantity === 0 || productStore.usingFallback"
              @click="addToCart"
            >
              Add to Cart
            </UiButton>
            <UiButton variant="secondary" size="lg" @click="toggleWishlist">
              <Heart class="w-5 h-5" :class="inWishlist ? 'fill-accent text-accent' : ''" />
            </UiButton>
          </div>
          <UiCard v-if="product.spec || product.pcComponent" padding="md">
            <UiText as="h2" size="lg" class="mb-4">Specifications</UiText>
            <dl class="grid grid-cols-2 gap-3 text-sm">
              <template v-if="product.spec">
                <div v-if="product.spec.cpuBrand" class="flex justify-between border-b border-subtle pb-2">
                  <dt class="text-text-muted">CPU</dt>
                  <dd class="text-text-primary">{{ product.spec.cpuBrand }}</dd>
                </div>
                <div v-if="product.spec.ramCapacity" class="flex justify-between border-b border-subtle pb-2">
                  <dt class="text-text-muted">RAM</dt>
                  <dd>{{ product.spec.ramCapacity }}GB {{ product.spec.ramGeneration }}</dd>
                </div>
                <div v-if="product.spec.gpuModel" class="flex justify-between border-b border-subtle pb-2">
                  <dt class="text-text-muted">GPU</dt>
                  <dd>{{ product.spec.gpuModel }}</dd>
                </div>
              </template>
              <template v-if="product.pcComponent">
                <div v-if="product.pcComponent.socket" class="flex justify-between border-b border-subtle pb-2">
                  <dt class="text-text-muted">Socket</dt>
                  <dd>{{ product.pcComponent.socket }}</dd>
                </div>
                <div v-if="product.pcComponent.powerConsumption" class="flex justify-between border-b border-subtle pb-2">
                  <dt class="text-text-muted">TDP</dt>
                  <dd>{{ product.pcComponent.powerConsumption }}W</dd>
                </div>
              </template>
            </dl>
          </UiCard>
        </div>
      </div>
      <UiCard v-if="reviews.length" padding="md" class="mt-12">
        <UiText as="h2" size="xl" class="mb-4">Reviews ({{ reviews.length }})</UiText>
        <div v-for="r in reviews" :key="r.id" class="border-b border-subtle py-4 last:border-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-medium text-text-primary">{{ r.user?.username }}</span>
            <span class="text-warning text-sm">{{ '★'.repeat(r.rating) }}</span>
          </div>
          <p class="text-text-muted text-sm">{{ r.comment }}</p>
        </div>
      </UiCard>
    </div>
  </UiContainer>
</template>
