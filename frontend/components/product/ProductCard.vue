<script setup lang="ts">
import { useFormatPrice } from '~/composables/useFormatPrice';
import { useProductStatus } from '~/composables/useProductStatus';

const props = defineProps<{ product: any; showAddToBuild?: boolean }>();
const { formatPrice } = useFormatPrice();
const { stockBadge } = useProductStatus();
const badge = computed(() => stockBadge(props.product.stockQuantity ?? 0));

const placeholder = '/placeholder.svg';
</script>

<template>
  <UiCard hover padding="none" class="group overflow-hidden flex flex-col h-full">
    <NuxtLink :to="`/products/${product.slug}`" class="block">
      <div class="relative aspect-square bg-surface-3 overflow-hidden">
        <img
          :src="product.imageUrl || placeholder"
          :alt="product.name"
          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <UiBadge :variant="badge.variant" class="absolute top-3 left-3">
          {{ badge.label }}
        </UiBadge>
      </div>
    </NuxtLink>
    <div class="p-4 flex flex-col flex-1">
      <p v-if="product.brand" class="text-[10px] uppercase tracking-wider text-fg-muted mb-1">
        {{ product.brand.name }}
      </p>
      <NuxtLink :to="`/products/${product.slug}`">
        <UiText as="h3" size="sm" class="font-semibold line-clamp-2 mb-2 hover:text-accent transition-colors">
          {{ product.name }}
        </UiText>
      </NuxtLink>
      <UiText variant="accent" size="lg" class="font-bold mb-2">{{ formatPrice(product.price) }}</UiText>
      <p v-if="product.description" class="text-xs text-fg-muted line-clamp-2 mb-4 flex-1">
        {{ product.description }}
      </p>
      <UiButton
        v-if="showAddToBuild !== false && product.isPcComponent"
        :to="`/pc-builder?add=${product.slug}`"
        variant="secondary"
        size="sm"
        block
      >
        THÊM VÀO CẤU HÌNH
      </UiButton>
    </div>
  </UiCard>
</template>
