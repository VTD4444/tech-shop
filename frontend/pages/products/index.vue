<script setup lang="ts">
import { useProductStore } from '~/stores/product';

const route = useRoute();
const productStore = useProductStore();

const filters = reactive({
  category: (route.query.category as string) || '',
  brand: '',
  minPrice: undefined as number | undefined,
  maxPrice: undefined as number | undefined,
  search: (route.query.search as string) || '',
  sort: 'created_at',
  isPcComponent: undefined as boolean | undefined,
  page: 1,
});

await Promise.all([
  productStore.fetchCategories(),
  productStore.fetchBrands(),
  productStore.fetchProducts(filters),
]);

function applyFilters() {
  filters.page = 1;
  productStore.fetchProducts(filters);
}

function onFilterUpdate(key: string, value: unknown) {
  (filters as any)[key] = value;
  applyFilters();
}

function resetFilters() {
  filters.category = '';
  filters.brand = '';
  filters.minPrice = undefined;
  filters.maxPrice = undefined;
  filters.search = '';
  filters.sort = 'created_at';
  filters.isPcComponent = undefined;
  filters.page = 1;
  productStore.fetchProducts(filters);
}

function onSortChange(sort: string) {
  filters.sort = sort;
  applyFilters();
}

function goToPage(p: number) {
  filters.page = p;
  productStore.fetchProducts(filters);
}
</script>

<template>
  <UiContainer class="py-8">
    <div class="flex flex-col lg:flex-row gap-8">
      <ProductFilterSidebar
        :filters="filters"
        @update="onFilterUpdate"
        @clear="resetFilters"
      />
      <div class="flex-1 min-w-0">
        <ProductGridHeader :sort="filters.sort" @update:sort="onSortChange" />

        <div v-if="productStore.loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          <UiSkeleton v-for="i in 6" :key="i" class="h-96" />
        </div>
        <UiEmptyState
          v-else-if="productStore.products.length === 0"
          title="No products found"
          description="Try adjusting your filters or search terms."
        >
          <template #action>
            <UiButton variant="secondary" @click="resetFilters">Clear Filters</UiButton>
          </template>
        </UiEmptyState>
        <div v-else>
          <p
            v-if="productStore.usingFallback"
            class="mb-4 text-sm text-warning bg-warning/10 border border-warning/20 rounded-lg px-4 py-3"
          >
            Offline mode — sample catalog only. Cart and checkout are disabled until the server recovers.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            <ProductCard v-for="p in productStore.products" :key="p.id" :product="p" />
          </div>
        </div>

        <UiPagination
          v-if="productStore.meta.totalPages > 1"
          :page="filters.page"
          :total-pages="productStore.meta.totalPages"
          @update:page="goToPage"
        />
      </div>
    </div>
  </UiContainer>
</template>
