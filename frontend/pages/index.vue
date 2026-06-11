<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { Wrench, Bot, Zap, Laptop, Cpu, Monitor, HardDrive, Keyboard } from 'lucide-vue-next';
import { useProductStore } from '~/stores/product';

const productStore = useProductStore();
const { products, loading } = storeToRefs(productStore);

await Promise.all([
  productStore.fetchProducts({ limit: 8, sort: 'created_at' }),
  productStore.fetchCategories(),
]);

const categoryIcons: Record<string, any> = {
  laptops: Laptop,
  components: Cpu,
  monitors: Monitor,
  peripherals: Keyboard,
};

function getCategoryIcon(slug: string) {
  return categoryIcons[slug] || HardDrive;
}
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden border-b border-subtle bg-surface-1">
      <div class="absolute inset-0 bg-hero-gradient pointer-events-none" />
      <UiContainer class="relative py-20 md:py-28">
        <div class="max-w-3xl">
          <UiBadge variant="accent" class="mb-4">NEW ARRIVAL — RTX 40 SERIES</UiBadge>
          <UiText as="h1" size="4xl" class="mb-4 leading-tight">
            DOMINATE THE <span class="text-accent">VIRTUAL FRONT.</span>
          </UiText>
          <UiText variant="muted" size="lg" class="mb-8 max-w-xl">
            High-performance components with AI-powered recommendations. Build your dream machine with TechShop.
          </UiText>
          <div class="flex flex-wrap gap-4">
            <UiButton to="/products" variant="primary" size="lg">EXPLORE PRODUCTS</UiButton>
            <UiButton to="/pc-builder" variant="secondary" size="lg">BUILD YOUR DREAM PC</UiButton>
          </div>
        </div>
      </UiContainer>
    </section>

    <!-- Categories -->
    <section class="py-16 border-b border-subtle">
      <UiContainer>
        <div class="flex items-end justify-between mb-8">
          <div>
            <UiText as="h2" size="2xl" class="mb-2">Browse Ecosystem</UiText>
            <div class="w-12 h-0.5 bg-accent" />
          </div>
          <NuxtLink to="/products" class="text-sm text-accent hover:underline flex items-center gap-1">
            View Catalog →
          </NuxtLink>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <NuxtLink
            v-for="cat in productStore.categories.slice(0, 5)"
            :key="cat.id"
            :to="`/products?category=${cat.slug}`"
            class="group"
          >
            <UiCard hover padding="md" class="text-center aspect-square flex flex-col items-center justify-center">
              <component :is="getCategoryIcon(cat.slug)" class="w-10 h-10 text-accent mb-3 group-hover:scale-110 transition-transform" />
              <UiText size="sm" class="font-medium">{{ cat.name }}</UiText>
            </UiCard>
          </NuxtLink>
        </div>
      </UiContainer>
    </section>

    <!-- Featured products -->
    <section class="py-16">
      <UiContainer>
        <UiText as="h2" size="2xl" class="text-center mb-2">Elite Hardware Selection</UiText>
        <UiText variant="muted" size="sm" class="text-center mb-10 max-w-lg mx-auto">
          Hand-picked components for maximum performance and reliability.
        </UiText>
        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <UiSkeleton v-for="i in 4" :key="i" class="h-80" />
        </div>
        <div v-else>
          <p
            v-if="productStore.usingFallback"
            class="mb-6 text-sm text-warning bg-warning/10 border border-warning/20 rounded-lg px-4 py-3 text-center"
          >
            Offline mode — showing sample products until the server is back online.
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
            <UiText as="h2" size="2xl" class="mb-4">Your Vision, Our Precision</UiText>
            <UiText variant="muted" class="mb-6 leading-relaxed">
              Use our compatibility engine to ensure every component works together flawlessly before you buy.
            </UiText>
            <UiButton to="/pc-builder" variant="primary" size="lg">LAUNCH PC BUILDER</UiButton>
          </div>
          <UiCard glass padding="lg">
            <UiText as="h3" size="lg" class="mb-4">Real-time Compatibility</UiText>
            <ul class="space-y-3 text-sm">
              <li class="flex justify-between text-text-muted"><span>Motherboard</span><span class="text-text-primary">ATX — OK</span></li>
              <li class="flex justify-between text-text-muted"><span>CPU Socket</span><span class="text-accent">Compatible</span></li>
              <li class="flex justify-between text-text-muted"><span>RAM Generation</span><span class="text-accent">DDR5</span></li>
            </ul>
            <p class="mt-4 text-accent text-sm font-medium flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-accent" /> Components Compatible
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
            <UiText as="h3" size="lg" class="mb-2">PC Builder</UiText>
            <UiText variant="muted" size="sm">Check compatibility of every component</UiText>
          </UiCard>
          <UiCard padding="lg" class="text-center">
            <Bot class="w-10 h-10 text-accent mx-auto mb-4" />
            <UiText as="h3" size="lg" class="mb-2">AI Advisor</UiText>
            <UiText variant="muted" size="sm">Get personalized build recommendations</UiText>
          </UiCard>
          <UiCard padding="lg" class="text-center">
            <Zap class="w-10 h-10 text-accent mx-auto mb-4" />
            <UiText as="h3" size="lg" class="mb-2">Fast Delivery</UiText>
            <UiText variant="muted" size="sm">Free shipping on orders over 5M VND</UiText>
          </UiCard>
        </div>
      </UiContainer>
    </section>
  </div>
</template>
