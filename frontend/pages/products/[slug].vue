<script setup lang="ts">
import { Star } from 'lucide-vue-next';
import { Heart } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { useCartStore } from '~/stores/cart';
import { useProductStore } from '~/stores/product';
import { useWishlistStore } from '~/stores/wishlist';
import { useSystemStore } from '~/stores/system';
import { useProductDetail } from '~/composables/useProductDetail';

const route = useRoute();
const productStore = useProductStore();
const cartStore = useCartStore();
const authStore = useAuthStore();
const toast = useToast();
const { formatPrice } = useFormatPrice();
const { stockBadge } = useProductStatus();
const systemStore = useSystemStore();
const wishlistStore = useWishlistStore();

const slug = route.params.slug as string;
const product = ref<any>(null);
const loading = ref(true);
const inWishlist = ref(false);

const {
  ratingSummary,
  ratings,
  ratingsMeta,
  comments,
  commentsMeta,
  unratedOrders,
  loadingRatings,
  loadingComments,
  fetchRatings,
  fetchComments,
  refreshEngagement,
  initEngagement,
} = useProductDetail(slug);

product.value = await productStore.fetchProduct(slug);
loading.value = false;

if (product.value && !productStore.usingFallback) {
  await initEngagement();
  if (authStore.isAuthenticated) {
    try {
      if (!wishlistStore.loaded) await wishlistStore.fetchWishlist();
      inWishlist.value = wishlistStore.isInWishlist(product.value.id.toString());
    } catch {
      /* ignore */
    }
  }
}

const badge = computed(() => product.value ? stockBadge(product.value.stockQuantity) : null);

const schemaOrg = computed(() => {
  if (!product.value || !ratingSummary.value?.count) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.value.name,
    description: product.value.description,
    image: product.value.imageUrl,
    offers: {
      '@type': 'Offer',
      price: product.value.price,
      priceCurrency: 'VND',
      availability: product.value.stockQuantity > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: ratingSummary.value.average,
      reviewCount: ratingSummary.value.count,
    },
  };
});

useHead(() => ({
  script: schemaOrg.value
    ? [{ type: 'application/ld+json', innerHTML: JSON.stringify(schemaOrg.value) }]
    : [],
}));

async function addToCart() {
  if (systemStore.apiDegraded || productStore.usingFallback) {
    toast.error('Không thể dùng giỏ hàng khi máy chủ đang ngoại tuyến.');
    return;
  }
  if (!authStore.isAuthenticated) return navigateTo('/login');
  try {
    await cartStore.addItem(product.value.id.toString());
    toast.success('Đã thêm vào giỏ hàng');
  } catch {
    toast.error('Không thể thêm vào giỏ hàng. Vui lòng thử lại sau.');
  }
}

async function toggleWishlist() {
  if (!authStore.isAuthenticated) return navigateTo('/login');
  const productId = product.value.id.toString();
  if (inWishlist.value) {
    await wishlistStore.removeItem(productId);
    inWishlist.value = false;
    toast.info('Đã xóa khỏi danh sách yêu thích');
  } else {
    await wishlistStore.addItem(productId);
    inWishlist.value = true;
    toast.success('Đã thêm vào danh sách yêu thích');
  }
}

async function onRatingSubmitted() {
  await refreshEngagement();
}

async function onCommentChange() {
  await fetchComments(commentsMeta.value.page);
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
      :title="systemStore.apiDegraded ? 'Sản phẩm không khả dụng ngoại tuyến' : 'Không tìm thấy sản phẩm'"
      :description="systemStore.apiDegraded ? 'Sản phẩm này không có trong danh mục ngoại tuyến.' : 'Sản phẩm này có thể đã bị gỡ.'"
    >
      <template #action><UiButton to="/products" variant="primary">Xem sản phẩm</UiButton></template>
    </UiEmptyState>
    <div v-else>
      <nav class="text-sm mb-6 text-fg-muted">
        <NuxtLink to="/products" class="hover:text-accent">Sản phẩm</NuxtLink>
        <span class="mx-2">/</span>
        <span>{{ product.name }}</span>
      </nav>

      <div class="grid lg:grid-cols-2 gap-10 mb-12">
        <div>
          <UiCard padding="none" class="overflow-hidden">
            <img :src="product.imageUrl || '/placeholder.svg'" :alt="product.name" class="w-full aspect-square object-cover" loading="eager" />
          </UiCard>
          <div v-if="product.images?.length" class="flex gap-2 mt-4">
            <img
              v-for="img in product.images"
              :key="img.id"
              :src="img.imageUrl"
              loading="lazy"
              class="w-16 h-16 object-cover rounded-lg border-2"
              :class="img.isMain ? 'border-accent' : 'border-subtle'"
            />
          </div>
        </div>
        <div>
          <div class="flex gap-2 mb-3 flex-wrap">
            <UiBadge v-if="product.brand" variant="neutral">{{ product.brand.name }}</UiBadge>
            <UiBadge v-if="product.isPcComponent" variant="accent">Linh kiện PC</UiBadge>
            <UiBadge v-if="badge" :variant="badge.variant">{{ badge.label }}</UiBadge>
          </div>
          <UiText as="h1" size="2xl" class="mb-2">{{ product.name }}</UiText>
          <div v-if="ratingSummary?.count" class="flex items-center gap-2 mb-3 text-sm">
            <ProductRatingStars :model-value="Math.round(ratingSummary.average)" readonly />
            <span class="text-fg-muted">{{ ratingSummary.average }} ({{ ratingSummary.count }})</span>
          </div>
          <UiText variant="accent" size="3xl" class="font-bold mb-4">{{ formatPrice(product.price) }}</UiText>
          <UiText variant="muted" class="mb-6 leading-relaxed">{{ product.description }}</UiText>
          <p
            v-if="productStore.usingFallback"
            class="mb-4 text-sm text-warning bg-warning/10 border border-warning/20 rounded-lg px-4 py-3"
          >
            Chế độ ngoại tuyến — chỉ hiển thị dữ liệu danh mục mẫu.
          </p>
          <div class="flex gap-3 mb-4">
            <UiButton
              variant="primary"
              size="lg"
              class="flex-1"
              :disabled="product.stockQuantity === 0 || productStore.usingFallback"
              @click="addToCart"
            >
              Thêm vào giỏ
            </UiButton>
            <UiButton variant="secondary" size="lg" @click="toggleWishlist">
              <Heart class="w-5 h-5" :class="inWishlist ? 'fill-accent text-accent' : ''" />
            </UiButton>
          </div>
        </div>
      </div>

      <nav class="sticky top-0 z-10 bg-surface-1/95 backdrop-blur border-b border-subtle mb-8 -mx-4 px-4 py-3 flex gap-6 text-sm overflow-x-auto">
        <a href="#description" class="text-fg-muted hover:text-accent whitespace-nowrap">Mô tả</a>
        <a href="#specs" class="text-fg-muted hover:text-accent whitespace-nowrap">Thông số</a>
        <a href="#ratings" class="text-fg-muted hover:text-accent whitespace-nowrap">Đánh giá</a>
        <a href="#comments" class="text-fg-muted hover:text-accent whitespace-nowrap">Bình luận</a>
      </nav>

      <section id="description" class="mb-12 scroll-mt-24">
        <UiText as="h2" size="xl" class="mb-4">Mô tả chi tiết</UiText>
        <ProductLongDescription :html="product.longDescription" />
      </section>

      <section id="specs" class="mb-12 scroll-mt-24">
        <UiText as="h2" size="xl" class="mb-4">Thông số kỹ thuật</UiText>
        <UiCard padding="md">
          <ProductSpecTable :spec="product.spec" :pc-component="product.pcComponent" />
        </UiCard>
      </section>

      <section id="ratings" class="mb-12 scroll-mt-24">
        <UiText as="h2" size="xl" class="mb-4">Đánh giá</UiText>
        <UiCard v-if="ratingSummary" padding="md" class="mb-6">
          <ProductRatingSummary
            :average="ratingSummary.average"
            :count="ratingSummary.count"
            :distribution="ratingSummary.distribution"
          />
        </UiCard>

        <ProductRatingForm
          v-if="!productStore.usingFallback && unratedOrders.length"
          :slug="slug"
          :unrated-orders="unratedOrders"
          @submitted="onRatingSubmitted"
        />

        <div v-if="loadingRatings" class="space-y-4"><UiSkeleton v-for="i in 3" :key="i" class="h-16" /></div>
        <UiEmptyState
          v-else-if="!ratings.length"
          title="Chưa có đánh giá nào"
          description="Hãy là người đầu tiên mua và đánh giá sản phẩm này."
          :icon="Star"
        >
          <template #action>
            <UiButton v-if="!authStore.isAuthenticated" to="/login" variant="primary" size="sm">Đăng nhập</UiButton>
          </template>
        </UiEmptyState>
        <template v-else>
          <ProductRatingList
            :ratings="ratings"
            :current-user-id="authStore.user?.id"
          />
          <UiPagination
            v-if="ratingsMeta.totalPages > 1"
            class="mt-6"
            :page="ratingsMeta.page"
            :total-pages="ratingsMeta.totalPages"
            @update:page="fetchRatings"
          />
        </template>
      </section>

      <section id="comments" class="scroll-mt-24">
        <UiText as="h2" size="xl" class="mb-4">Bình luận</UiText>
        <ProductCommentThread
          v-if="!productStore.usingFallback"
          :slug="slug"
          :comments="comments"
          :loading="loadingComments"
          @submitted="onCommentChange"
          @updated="onCommentChange"
        />
        <UiPagination
          v-if="commentsMeta.totalPages > 1"
          class="mt-6"
          :page="commentsMeta.page"
          :total-pages="commentsMeta.totalPages"
          @update:page="fetchComments"
        />
      </section>
    </div>
  </UiContainer>
</template>
