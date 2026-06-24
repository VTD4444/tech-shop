<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core';
import { useProductStore } from '~/stores/product';
import { useFormatPrice } from '~/composables/useFormatPrice';

const productStore = useProductStore();

const props = defineProps<{
  filters: {
    category: string;
    brand: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    isPcComponent?: boolean;
  };
}>();

const emit = defineEmits<{
  update: [key: string, value: unknown];
  clear: [];
}>();

const { formatPrice } = useFormatPrice();
const priceMax = ref(props.filters.maxPrice ?? 50000000);
const localSearch = ref(props.filters.search || '');

watch(
  () => props.filters.search,
  (v) => {
    localSearch.value = v || '';
  },
);

const debouncedSearch = useDebounceFn((value: string) => {
  emit('update', 'search', value);
}, 400);

watch(localSearch, (value) => {
  debouncedSearch(value);
});

function setFilter(key: string, value: unknown) {
  emit('update', key, value);
}
</script>

<template>
  <aside class="w-full lg:w-64 shrink-0 space-y-6">
    <UiCard padding="md">
      <UiText as="h3" size="sm" uppercase class="mb-4 border-b border-subtle pb-3">Filters</UiText>

      <div class="space-y-4">
        <div>
          <UiText variant="muted" size="xs" uppercase class="mb-2 block">Search</UiText>
          <UiInput v-model="localSearch" placeholder="Search products..." />
        </div>

        <div>
          <UiText variant="muted" size="xs" uppercase class="mb-2 block">Category</UiText>
          <UiSelect
            :model-value="filters.category"
            placeholder="All Categories"
            :options="[
              { label: 'All Categories', value: '' },
              ...productStore.categories.map((c: any) => ({ label: c.name, value: c.slug })),
            ]"
            @update:model-value="setFilter('category', $event)"
          />
        </div>

        <div>
          <UiText variant="muted" size="xs" uppercase class="mb-2 block">Brand</UiText>
          <UiSelect
            :model-value="filters.brand"
            placeholder="All Brands"
            :options="[
              { label: 'All Brands', value: '' },
              ...productStore.brands.map((b: any) => ({ label: b.name, value: b.slug })),
            ]"
            @update:model-value="setFilter('brand', $event)"
          />
        </div>

        <div>
          <UiText variant="muted" size="xs" uppercase class="mb-2 block">Max Price</UiText>
          <UiRangeSlider
            v-model="priceMax"
            :min="0"
            :max="50000000"
            :step="500000"
            @update:model-value="setFilter('maxPrice', $event)"
          />
          <UiText variant="muted" size="xs" class="mt-1">{{ formatPrice(priceMax) }}</UiText>
        </div>

        <UiCheckbox
          :model-value="!!filters.isPcComponent"
          label="PC Components Only"
          @update:model-value="setFilter('isPcComponent', $event || undefined)"
        />
      </div>

      <UiButton variant="ghost" size="sm" block class="mt-6" @click="emit('clear')">
        Clear All Filters
      </UiButton>
    </UiCard>
  </aside>
</template>
