<script setup lang="ts">
import { Search, Loader2 } from 'lucide-vue-next';
import { useDebounceFn, onClickOutside } from '@vueuse/core';
import { filterFallbackProducts } from '~/data/fallback-catalog';
import { isApiUnavailableError } from '~/utils/api-error';

const props = withDefaults(defineProps<{
  placeholder?: string;
}>(), {
  placeholder: 'Tìm linh kiện...',
});

const emit = defineEmits<{ picked: [] }>();

const { $api } = useNuxtApp();
const { formatPrice } = useFormatPrice();

const query = ref('');
const results = ref<any[]>([]);
const total = ref(0);
const loading = ref(false);
const open = ref(false);
const rootRef = ref<HTMLElement | null>(null);

const trimmedQuery = computed(() => query.value.trim());
const showDropdown = computed(() => open.value && trimmedQuery.value.length >= 2);

onClickOutside(rootRef, () => {
  open.value = false;
});

const runSearch = useDebounceFn(async (raw: string) => {
  const q = raw.trim();
  if (q.length < 2) {
    results.value = [];
    total.value = 0;
    open.value = false;
    return;
  }

  loading.value = true;
  open.value = true;

  try {
    const data: any = await $api(`/products?search=${encodeURIComponent(q)}&limit=8`);
    results.value = data.data || [];
    total.value = data.meta?.total ?? results.value.length;
  } catch (error) {
    if (isApiUnavailableError(error)) {
      const fallback = filterFallbackProducts({ search: q, limit: 8 });
      results.value = fallback.data;
      total.value = fallback.meta.total;
    } else {
      results.value = [];
      total.value = 0;
    }
  } finally {
    loading.value = false;
  }
}, 300);

watch(query, (value) => {
  runSearch(value);
});

function onFocus() {
  if (trimmedQuery.value.length >= 2) {
    open.value = true;
    if (!results.value.length && !loading.value) {
      runSearch(query.value);
    }
  }
}

function pickProduct(slug: string) {
  query.value = '';
  results.value = [];
  total.value = 0;
  open.value = false;
  emit('picked');
  navigateTo(`/products/${slug}`);
}

function viewAllResults() {
  const q = trimmedQuery.value;
  if (!q) return;
  query.value = '';
  results.value = [];
  open.value = false;
  emit('picked');
  navigateTo({ path: '/products', query: { search: q } });
}

function onSubmit() {
  if (!trimmedQuery.value) return;
  if (results.value.length === 1) {
    pickProduct(results.value[0].slug);
    return;
  }
  viewAllResults();
}
</script>

<template>
  <div ref="rootRef" class="relative w-full">
    <form @submit.prevent="onSubmit" @focusin="onFocus">
      <UiInput
        v-model="query"
        :placeholder="placeholder"
        class="w-full"
        autocomplete="off"
      >
        <template #prefix>
          <Search v-if="!loading" class="w-4 h-4" />
          <Loader2 v-else class="w-4 h-4 animate-spin" />
        </template>
      </UiInput>
    </form>

    <div
      v-if="showDropdown"
      class="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-subtle bg-surface-1 shadow-xl overflow-hidden"
    >
      <div v-if="loading && !results.length" class="px-4 py-6 text-sm text-text-muted text-center">
        Đang tìm kiếm...
      </div>

      <template v-else-if="results.length">
        <ul class="max-h-80 overflow-y-auto py-1">
          <li v-for="item in results" :key="item.id">
            <button
              type="button"
              class="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-2 transition-colors"
              @mousedown.prevent
              @click="pickProduct(item.slug)"
            >
              <img
                :src="item.imageUrl || '/placeholder.svg'"
                :alt="item.name"
                class="w-10 h-10 rounded-md object-cover bg-surface-3 shrink-0"
              />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-text-primary truncate">{{ item.name }}</p>
                <p v-if="item.brand?.name" class="text-xs text-text-muted truncate">{{ item.brand.name }}</p>
              </div>
              <span class="text-sm font-semibold text-accent shrink-0">{{ formatPrice(item.price) }}</span>
            </button>
          </li>
        </ul>
        <button
          v-if="total > results.length"
          type="button"
          class="w-full border-t border-subtle px-3 py-2.5 text-sm text-accent hover:bg-surface-2 transition-colors text-center"
          @mousedown.prevent
          @click="viewAllResults"
        >
          Xem tất cả {{ total }} kết quả
        </button>
      </template>

      <div v-else class="px-4 py-6 text-sm text-text-muted text-center">
        Không tìm thấy sản phẩm phù hợp
      </div>
    </div>
  </div>
</template>
