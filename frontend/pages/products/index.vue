<script setup lang="ts">
import { useProductStore } from '~/stores/product';

const route = useRoute();
const router = useRouter();
const productStore = useProductStore();

function parseQuery(query: Record<string, unknown>) {
  return {
    category: (query.category as string) || '',
    brand: (query.brand as string) || '',
    minPrice: undefined as number | undefined,
    maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
    search: (query.search as string) || '',
    sort: (query.sort as string) || 'created_at',
    isPcComponent:
      query.isPcComponent === 'true'
        ? true
        : query.isPcComponent === 'false'
          ? false
          : undefined,
    page: query.page ? Number(query.page) : 1,
  };
}

function filtersToQuery(f: typeof filters) {
  const q: Record<string, string> = {};
  if (f.category) q.category = f.category;
  if (f.brand) q.brand = f.brand;
  if (f.search) q.search = f.search;
  if (f.sort && f.sort !== 'created_at') q.sort = f.sort;
  if (f.maxPrice) q.maxPrice = String(f.maxPrice);
  if (f.isPcComponent !== undefined) q.isPcComponent = String(f.isPcComponent);
  if (f.page > 1) q.page = String(f.page);
  return q;
}

const filters = reactive(parseQuery(route.query));
let syncingUrl = false;

await Promise.all([
  productStore.fetchCategories(),
  productStore.fetchBrands(),
  productStore.fetchProducts(filters),
]);

function syncUrl() {
  syncingUrl = true;
  router.replace({ query: filtersToQuery(filters) }).finally(() => {
    nextTick(() => { syncingUrl = false; });
  });
}

function applyFilters(resetPage = true) {
  if (resetPage) filters.page = 1;
  syncUrl();
  productStore.fetchProducts(filters);
}

function onFilterUpdate(key: string, value: unknown) {
  (filters as Record<string, unknown>)[key] = value;
  applyFilters(key !== 'page');
}

function resetFilters() {
  Object.assign(filters, {
    category: '',
    brand: '',
    minPrice: undefined,
    maxPrice: undefined,
    search: '',
    sort: 'created_at',
    isPcComponent: undefined,
    page: 1,
  });
  syncUrl();
  productStore.fetchProducts(filters);
}

function onSortChange(sort: string) {
  filters.sort = sort;
  applyFilters();
}

function goToPage(p: number) {
  filters.page = p;
  syncUrl();
  productStore.fetchProducts(filters);
}

watch(
  () => route.query,
  (query) => {
    if (syncingUrl) return;
    Object.assign(filters, parseQuery(query));
    productStore.fetchProducts(filters);
  },
);
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
