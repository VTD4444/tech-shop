<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] });

const { $api } = useNuxtApp();
const toast = useToast();
const confirmDialog = useConfirmDialog();
const categories = ref<any[]>([]);
const name = ref('');
const slug = ref('');
const loadError = ref('');

try {
  const res: any = await $api('/categories');
  categories.value = res.data || [];
} catch (e: any) {
  loadError.value = extractApiMessage(e, 'Không tải được danh mục');
}

async function create() {
  try {
    await $api('/categories', { method: 'POST', body: { name: name.value, slug: slug.value } });
    toast.success('Đã tạo danh mục');
    name.value = '';
    slug.value = '';
    const r: any = await $api('/categories');
    categories.value = r.data || [];
  } catch (e: any) {
    toast.error(extractApiMessage(e, 'Không thể tạo danh mục'));
  }
}

async function remove(id: string) {
  const ok = await confirmDialog.confirm('Xóa danh mục này?');
  if (!ok) return;
  try {
    await $api(`/categories/${id}`, { method: 'DELETE' });
    categories.value = categories.value.filter((c) => c.id !== id);
    toast.info('Đã xóa danh mục');
  } catch (e: any) {
    toast.error(extractApiMessage(e, 'Không thể xóa danh mục'));
  }
}
</script>

<template>
  <div>
    <UiText as="h1" size="2xl" class="mb-6">Danh mục</UiText>
    <p v-if="loadError" class="mb-4 text-sm text-danger">{{ loadError }}</p>

    <UiCard padding="md" class="mb-6">
      <form class="flex flex-wrap gap-2" @submit.prevent="create">
        <UiInput v-model="name" placeholder="Tên danh mục" required class="min-w-[120px] flex-1" />
        <UiInput v-model="slug" placeholder="đường-dẫn" required class="w-44" />
        <UiButton type="submit" variant="primary" size="sm">Thêm</UiButton>
      </form>
    </UiCard>

    <UiDataTable
      :count="categories.length"
      :empty="categories.length === 0"
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
    </UiDataTable>
  </div>
</template>
