<script setup lang="ts">
import { Search } from 'lucide-vue-next';

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] });

const { $api } = useNuxtApp();
const toast = useToast();
const orders = ref<any[]>([]);
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
    loadOrders();
  }, 350);
});

async function loadOrders() {
  loading.value = true;
  try {
    const query = new URLSearchParams({
      page: String(meta.value.page),
      limit: String(meta.value.limit),
    });
    if (searchDebounced.value) query.set('search', searchDebounced.value);
    const res: any = await $api(`/admin/orders?${query}`);
    orders.value = res.data || [];
    meta.value = { ...meta.value, ...(res.meta || {}) };
  } catch (e: any) {
    toast.error(extractApiMessage(e, 'Không tải được danh sách đơn hàng'));
  } finally {
    loading.value = false;
  }
}

await loadOrders();

function goPage(page: number) {
  if (page < 1 || page > meta.value.totalPages) return;
  meta.value.page = page;
  loadOrders();
}

async function updateStatus(id: string, status: string) {
  try {
    await $api(`/admin/orders/${id}/status?status=${status}`, { method: 'PATCH' });
    toast.success('Đã cập nhật trạng thái');
    await loadOrders();
  } catch (e: any) {
    toast.error(extractApiMessage(e, 'Không thể cập nhật trạng thái đơn hàng'));
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <UiText as="h1" size="2xl">Đơn hàng</UiText>
      <div class="w-full max-w-sm">
        <UiInput v-model="search" placeholder="Tìm theo mã đơn, tên, SĐT, email...">
          <template #prefix><Search class="h-4 w-4" /></template>
        </UiInput>
      </div>
    </div>
    <AdminOrdersTable
      :orders="orders"
      :count="meta.total"
      :loading="loading"
      @update-status="updateStatus"
    >
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
    </AdminOrdersTable>
  </div>
</template>
