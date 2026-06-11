import { ref } from 'vue';
import { defineStore } from 'pinia';
import {
  FALLBACK_BRANDS,
  FALLBACK_CATEGORIES,
  filterFallbackProducts,
  findFallbackProductBySlug,
} from '~/data/fallback-catalog';
import { isApiUnavailableError } from '~/utils/api-error';
import { useSystemStore } from '~/stores/system';

export const useProductStore = defineStore('product', () => {
  const products = ref<any[]>([]);
  const currentProduct = ref<any>(null);
  const categories = ref<any[]>([]);
  const brands = ref<any[]>([]);
  const meta = ref<any>({});
  const loading = ref(false);
  const usingFallback = ref(false);

  function applyFallbackProducts(params: Record<string, any> = {}) {
    const result = filterFallbackProducts(params);
    products.value = result.data;
    meta.value = result.meta;
    usingFallback.value = true;
    return result;
  }

  async function fetchProducts(params: Record<string, any> = {}) {
    loading.value = true;
    const systemStore = useSystemStore();
    try {
      const { $api } = useNuxtApp();
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
      });
      const data: any = await $api(`/products?${query.toString()}`);
      products.value = data.data || [];
      meta.value = data.meta || {};
      usingFallback.value = false;
      systemStore.markHealthy();
    } catch (error) {
      if (isApiUnavailableError(error)) {
        systemStore.markDegraded();
        applyFallbackProducts(params);
      } else {
        products.value = [];
        meta.value = { page: 1, limit: 20, total: 0, totalPages: 0 };
        usingFallback.value = false;
      }
    } finally {
      loading.value = false;
    }
  }

  async function fetchProduct(slug: string) {
    const systemStore = useSystemStore();
    try {
      const { $api } = useNuxtApp();
      const data: any = await $api(`/products/${slug}`);
      currentProduct.value = data.data;
      usingFallback.value = false;
      systemStore.markHealthy();
      return data.data;
    } catch (error) {
      if (isApiUnavailableError(error)) {
        systemStore.markDegraded();
        const fallback = findFallbackProductBySlug(slug);
        currentProduct.value = fallback;
        usingFallback.value = Boolean(fallback);
        return fallback;
      }
      currentProduct.value = null;
      usingFallback.value = false;
      return null;
    }
  }

  async function fetchCategories() {
    const systemStore = useSystemStore();
    try {
      const { $api } = useNuxtApp();
      const data: any = await $api('/categories');
      categories.value = data.data || [];
      systemStore.markHealthy();
    } catch (error) {
      if (isApiUnavailableError(error)) {
        systemStore.markDegraded();
        categories.value = FALLBACK_CATEGORIES;
      } else {
        categories.value = [];
      }
    }
  }

  async function fetchBrands() {
    const systemStore = useSystemStore();
    try {
      const { $api } = useNuxtApp();
      const data: any = await $api('/brands');
      brands.value = data.data || [];
      systemStore.markHealthy();
    } catch (error) {
      if (isApiUnavailableError(error)) {
        systemStore.markDegraded();
        brands.value = FALLBACK_BRANDS;
      } else {
        brands.value = [];
      }
    }
  }

  return {
    products,
    currentProduct,
    categories,
    brands,
    meta,
    loading,
    usingFallback,
    fetchProducts,
    fetchProduct,
    fetchCategories,
    fetchBrands,
  };
});
