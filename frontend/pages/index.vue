<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { Wrench, Bot, Zap } from 'lucide-vue-next';
import { useProductStore } from '~/stores/product';
import { getCategoryIcon } from '~/utils/categoryIcons';

const productStore = useProductStore();
const { products, loading } = storeToRefs(productStore);

await Promise.all([
  productStore.fetchProducts({ limit: 8, sort: 'created_at' }),
  productStore.fetchCategories(),
]);
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden border-b border-subtle bg-surface-1">
      <div class="absolute inset-0 bg-hero-gradient pointer-events-none" />
      <UiContainer class="relative py-20 md:py-28">
        <div class="max-w-3xl">
          <UiBadge variant="accent" class="mb-4">HÀNG MỚI VỀ — RTX 40 SERIES</UiBadge>
          <UiText as="h1" size="4xl" class="mb-4 leading-tight">
            CHINH PHỤC <span class="text-accent">CHIẾN TRƯỜNG ẢO</span>
          </UiText>
          <UiText variant="muted" size="lg" class="mb-8 max-w-xl">
            Linh kiện hiệu năng cao với gợi ý từ AI. Xây dựng dàn máy mơ ước của bạn cùng TechShop.
          </UiText>
          <div class="flex flex-wrap gap-4">
            <UiButton to="/products" variant="primary" size="lg">KHÁM PHÁ SẢN PHẨM</UiButton>
            <UiButton to="/pc-builder" variant="secondary" size="lg">LẮP RÁP PC MƠ ƯỚC</UiButton>
          </div>
        </div>
      </UiContainer>
    </section>

    <!-- Categories -->
    <section class="py-16 border-b border-subtle">
      <UiContainer>
        <div class="flex items-end justify-between mb-8">
          <div>
            <UiText as="h2" size="2xl" class="mb-2">Khám phá danh mục</UiText>
            <div class="w-12 h-0.5 bg-accent" />
          </div>
        </div>
        <div class="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto pb-3 scrollbar-horizontal">
          <div class="flex gap-4 md:gap-6 w-max min-w-full sm:min-w-0">
            <NuxtLink
              v-for="cat in productStore.categories"
              :key="cat.id"
              :to="`/products?category=${cat.slug}`"
              class="group flex flex-col items-center gap-3 text-center shrink-0 w-[6.5rem] sm:w-28"
            >
              <div
                class="w-full aspect-square rounded-2xl border border-subtle bg-surface-2 flex items-center justify-center transition-all group-hover:border-accent group-hover:bg-accent-muted/40 group-hover:shadow-glow-accent/20 group-hover:-translate-y-0.5"
              >
                <component
                  :is="getCategoryIcon(cat.slug)"
                  class="w-9 h-9 sm:w-10 sm:h-10 text-accent transition-transform group-hover:scale-110"
                  aria-hidden="true"
                />
              </div>
              <UiText size="sm" class="font-medium text-text-primary group-hover:text-accent transition-colors leading-tight">
                {{ cat.name }}
              </UiText>
            </NuxtLink>
          </div>
        </div>
      </UiContainer>
    </section>

    <!-- Featured products -->
    <section class="py-16">
      <UiContainer>
        <UiText as="h2" size="2xl" class="text-center mb-2">Lựa chọn linh kiện hàng đầu</UiText>
        <UiText variant="muted" size="sm" class="text-center mb-10 max-w-lg mx-auto">
          Linh kiện được chọn lọc kỹ cho hiệu năng và độ tin cậy tối đa.
        </UiText>
        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <UiSkeleton v-for="i in 4" :key="i" class="h-80" />
        </div>
        <div v-else>
          <p
            v-if="productStore.usingFallback"
            class="mb-6 text-sm text-warning bg-warning/10 border border-warning/20 rounded-lg px-4 py-3 text-center"
          >
            Chế độ ngoại tuyến — hiển thị sản phẩm mẫu cho đến khi máy chủ hoạt động trở lại.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ProductCard v-for="p in products" :key="p.id" :product="p" />
          </div>
        </div>
      </UiContainer>
    </section>

    <!-- PC Builder CTA -->
    <section class="py-16 border-t border-subtle bg-surface-1 relative overflow-hidden">
      <UiContainer>
        <div class="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <UiText as="h2" size="2xl" class="mb-4">Tầm nhìn của bạn, sự chính xác của chúng tôi</UiText>
            <UiText variant="muted" class="mb-6 leading-relaxed">
              Sử dụng công cụ kiểm tra tương thích để đảm bảo mọi linh kiện hoạt động hoàn hảo trước khi mua.
            </UiText>
            <UiButton to="/pc-builder" variant="primary" size="lg">MỞ PC BUILDER</UiButton>
          </div>
          <UiCard glass padding="lg">
            <UiText as="h3" size="lg" class="mb-4">Tương thích thời gian thực</UiText>
            <ul class="space-y-3 text-sm">
              <li class="flex justify-between text-text-muted"><span>Bo mạch chủ</span><span class="text-text-primary">ATX — OK</span></li>
              <li class="flex justify-between text-text-muted"><span>Socket CPU</span><span class="text-accent">Tương thích</span></li>
              <li class="flex justify-between text-text-muted"><span>Thế hệ RAM</span><span class="text-accent">DDR5</span></li>
            </ul>
            <p class="mt-4 text-accent text-sm font-medium flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-accent" /> Linh kiện tương thích
            </p>
          </UiCard>
        </div>
      </UiContainer>
    </section>

    <!-- Features -->
    <section class="py-16">
      <UiContainer>
        <div class="grid md:grid-cols-3 gap-6">
          <UiCard padding="lg" class="text-center">
            <Wrench class="w-10 h-10 text-accent mx-auto mb-4" />
            <UiText as="h3" size="lg" class="mb-2">Lắp ráp PC</UiText>
            <UiText variant="muted" size="sm">Kiểm tra tương thích từng linh kiện</UiText>
          </UiCard>
          <UiCard padding="lg" class="text-center">
            <Bot class="w-10 h-10 text-accent mx-auto mb-4" />
            <UiText as="h3" size="lg" class="mb-2">Cố vấn AI</UiText>
            <UiText variant="muted" size="sm">Nhận gợi ý cấu hình phù hợp với nhu cầu</UiText>
          </UiCard>
          <UiCard padding="lg" class="text-center">
            <Zap class="w-10 h-10 text-accent mx-auto mb-4" />
            <UiText as="h3" size="lg" class="mb-2">Giao hàng nhanh</UiText>
            <UiText variant="muted" size="sm">Miễn phí vận chuyển cho đơn trên 5 triệu đồng</UiText>
          </UiCard>
        </div>
      </UiContainer>
    </section>
  </div>
</template>
