<script setup lang="ts">
import { Search } from 'lucide-vue-next';

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] });

const { $api } = useNuxtApp();
const { formatPrice } = useFormatPrice();
const toast = useToast();

const products = ref<any[]>([]);
const meta = ref({ page: 1, limit: 20, total: 0, totalPages: 1 });
const loading = ref(true);
const search = ref('');
const searchDebounced = ref('');

let searchTimer: ReturnType<typeof setTimeout> | null = null;

watch(search, (value) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchDebounced.value = value.trim();
    meta.value.page = 1;
    loadProducts();
  }, 350);
});

async function loadProducts() {
  loading.value = true;
  try {
    const query = new URLSearchParams({
      page: String(meta.value.page),
      limit: String(meta.value.limit),
    });
    if (searchDebounced.value) query.set('search', searchDebounced.value);

    const res: any = await $api(`/products?${query}`);
    products.value = res.data || [];
    meta.value = { ...meta.value, ...(res.meta || {}) };
  } catch (e: any) {
    toast.error(extractApiMessage(e, 'Không tải được danh sách sản phẩm'));
  } finally {
    loading.value = false;
  }
}

await loadProducts();

function goPage(page: number) {
  if (page < 1 || page > meta.value.totalPages) return;
  meta.value.page = page;
  loadProducts();
}

const statusLabels: Record<string, string> = {
  active: 'Đang bán',
  inactive: 'Ngừng hiển thị',
  out_of_stock: 'Hết hàng',
  discontinued: 'Ngừng kinh doanh',
};
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <UiText as="h1" size="2xl">Sản phẩm</UiText>
      <div class="flex flex-wrap items-center gap-3">
        <div class="w-full max-w-sm sm:w-64">
          <UiInput v-model="search" placeholder="Tìm theo tên sản phẩm...">
            <template #prefix><Search class="h-4 w-4" /></template>
          </UiInput>
        </div>
        <UiButton to="/admin/products/new" variant="primary" size="sm">Thêm sản phẩm</UiButton>
      </div>
    </div>

    <UiDataTable
      :loading="loading"
      :empty="!loading && products.length === 0"
      :count="meta.total"
      empty-title="Chưa có sản phẩm"
      empty-description="Thêm sản phẩm đầu tiên cho cửa hàng."
    >
      <template #empty>
        <UiButton to="/admin/products/new" variant="primary" size="sm">Thêm sản phẩm</UiButton>
      </template>
      <template #head>
        <UiTableHead>Tên sản phẩm</UiTableHead>
        <UiTableHead align="right">Giá</UiTableHead>
        <UiTableHead align="right">Tồn kho</UiTableHead>
        <UiTableHead>Trạng thái</UiTableHead>
        <UiTableHead align="right" width="sm">Thao tác</UiTableHead>
      </template>

      <UiTableRow v-for="p in products" :key="p.id">
        <UiTableCell variant="emphasis">{{ p.name }}</UiTableCell>
        <UiTableCell align="right" variant="numeric">{{ formatPrice(p.price) }}</UiTableCell>
        <UiTableCell align="right" variant="numeric">{{ p.stockQuantity }}</UiTableCell>
        <UiTableCell>
          <UiBadge variant="neutral">{{ statusLabels[p.status] || p.status }}</UiBadge>
        </UiTableCell>
        <UiTableCell variant="actions">
          <UiTableAction :to="`/admin/products/${p.slug}`">Sửa</UiTableAction>
        </UiTableCell>
      </UiTableRow>

      <template v-if="meta.totalPages > 1" #footer>
        <div class="flex items-center justify-between gap-3">
          <UiText variant="muted" size="sm">
            Trang {{ meta.page }} / {{ meta.totalPages }}
          </UiText>
          <div class="flex gap-2">
            <UiButton
              variant="secondary"
              size="sm"
              :disabled="meta.page <= 1 || loading"
              @click="goPage(meta.page - 1)"
            >
              Trước
            </UiButton>
            <UiButton
              variant="secondary"
              size="sm"
              :disabled="meta.page >= meta.totalPages || loading"
              @click="goPage(meta.page + 1)"
            >
              Sau
            </UiButton>
          </div>
        </div>
      </template>
    </UiDataTable>
  </div>
</template>
