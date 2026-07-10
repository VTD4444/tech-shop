<script setup lang="ts">
import { Search } from 'lucide-vue-next';

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] });

const { $api } = useNuxtApp();
const toast = useToast();
const confirmDialog = useConfirmDialog();

const categories = ref<any[]>([]);
const meta = ref({ page: 1, limit: 20, total: 0, totalPages: 1 });
const loading = ref(true);
const name = ref('');
const slug = ref('');
const search = ref('');
const searchDebounced = ref('');

let searchTimer: ReturnType<typeof setTimeout> | null = null;

watch(search, (value) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchDebounced.value = value.trim();
    meta.value.page = 1;
    loadCategories();
  }, 350);
});

async function loadCategories() {
  loading.value = true;
  try {
    const query = new URLSearchParams({
      page: String(meta.value.page),
      limit: String(meta.value.limit),
    });
    if (searchDebounced.value) query.set('search', searchDebounced.value);
    const res: any = await $api(`/categories?${query}`);
    categories.value = res.data || [];
    meta.value = { ...meta.value, ...(res.meta || {}) };
  } catch (e: any) {
    toast.error(extractApiMessage(e, 'Không tải được danh mục'));
  } finally {
    loading.value = false;
  }
}

await loadCategories();

function goPage(page: number) {
  if (page < 1 || page > meta.value.totalPages) return;
  meta.value.page = page;
  loadCategories();
}

async function create() {
  try {
    await $api('/categories', { method: 'POST', body: { name: name.value, slug: slug.value } });
    toast.success('Đã tạo danh mục');
    name.value = '';
    slug.value = '';
    meta.value.page = 1;
    await loadCategories();
  } catch (e: any) {
    toast.error(extractApiMessage(e, 'Không thể tạo danh mục'));
  }
}

async function remove(id: string) {
  const ok = await confirmDialog.confirm('Xóa danh mục này?');
  if (!ok) return;
  try {
    await $api(`/categories/${id}`, { method: 'DELETE' });
    toast.info('Đã xóa danh mục');
    if (categories.value.length === 1 && meta.value.page > 1) {
      meta.value.page -= 1;
    }
    await loadCategories();
  } catch (e: any) {
    toast.error(extractApiMessage(e, 'Không thể xóa danh mục'));
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <UiText as="h1" size="2xl">Danh mục</UiText>
      <div class="w-full max-w-sm">
        <UiInput v-model="search" placeholder="Tìm theo tên, đường dẫn...">
          <template #prefix><Search class="h-4 w-4" /></template>
        </UiInput>
      </div>
    </div>

    <UiCard padding="md" class="mb-6">
      <form class="flex flex-wrap gap-2" @submit.prevent="create">
        <UiInput v-model="name" placeholder="Tên danh mục" required class="min-w-[120px] flex-1" />
        <UiInput v-model="slug" placeholder="đường-dẫn" required class="w-44" />
        <UiButton type="submit" variant="primary" size="sm">Thêm</UiButton>
      </form>
    </UiCard>

    <UiDataTable
      :loading="loading"
      :count="meta.total"
      :empty="!loading && categories.length === 0"
      empty-title="Chưa có danh mục"
      empty-description="Thêm danh mục bằng form phía trên."
    >
      <template #head>
        <UiTableHead>Tên</UiTableHead>
        <UiTableHead>Đường dẫn</UiTableHead>
        <UiTableHead align="right" width="sm">Thao tác</UiTableHead>
      </template>

      <UiTableRow v-for="c in categories" :key="c.id">
        <UiTableCell variant="emphasis">{{ c.name }}</UiTableCell>
        <UiTableCell variant="muted">/{{ c.slug }}</UiTableCell>
        <UiTableCell variant="actions">
          <UiButton variant="ghost" size="sm" class="!text-danger" @click="remove(c.id)">
            Xóa
          </UiButton>
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
