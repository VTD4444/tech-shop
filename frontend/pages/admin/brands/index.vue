<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] });

const { $api } = useNuxtApp();
const toast = useToast();
const confirmDialog = useConfirmDialog();
const brands = ref<any[]>([]);
const name = ref('');
const slug = ref('');
const loadError = ref('');

try {
  const res: any = await $api('/brands');
  brands.value = res.data || [];
} catch (e: any) {
  loadError.value = extractApiMessage(e, 'Không tải được thương hiệu');
}

async function create() {
  try {
    await $api('/brands', { method: 'POST', body: { name: name.value, slug: slug.value } });
    toast.success('Đã tạo thương hiệu');
    name.value = '';
    slug.value = '';
    const r: any = await $api('/brands');
    brands.value = r.data || [];
  } catch (e: any) {
    toast.error(extractApiMessage(e, 'Không thể tạo thương hiệu'));
  }
}

async function remove(id: string) {
  const ok = await confirmDialog.confirm('Xóa thương hiệu này?');
  if (!ok) return;
  try {
    await $api(`/brands/${id}`, { method: 'DELETE' });
    brands.value = brands.value.filter((b) => b.id !== id);
    toast.info('Đã xóa thương hiệu');
  } catch (e: any) {
    toast.error(extractApiMessage(e, 'Không thể xóa thương hiệu'));
  }
}
</script>

<template>
  <div>
    <UiText as="h1" size="2xl" class="mb-6">Thương hiệu</UiText>
    <p v-if="loadError" class="mb-4 text-sm text-danger">{{ loadError }}</p>

    <UiCard padding="md" class="mb-6">
      <form class="flex flex-wrap gap-2" @submit.prevent="create">
        <UiInput v-model="name" placeholder="Tên thương hiệu" required class="min-w-[120px] flex-1" />
        <UiInput v-model="slug" placeholder="đường-dẫn" required class="w-44" />
        <UiButton type="submit" variant="primary" size="sm">Thêm</UiButton>
      </form>
    </UiCard>

    <UiDataTable
      :count="brands.length"
      :empty="brands.length === 0"
      empty-title="Chưa có thương hiệu"
      empty-description="Thêm thương hiệu bằng form phía trên."
    >
      <template #head>
        <UiTableHead>Tên</UiTableHead>
        <UiTableHead>Đường dẫn</UiTableHead>
        <UiTableHead align="right" width="sm">Thao tác</UiTableHead>
      </template>

      <UiTableRow v-for="b in brands" :key="b.id">
        <UiTableCell variant="emphasis">{{ b.name }}</UiTableCell>
        <UiTableCell variant="muted">/{{ b.slug }}</UiTableCell>
        <UiTableCell variant="actions">
          <UiButton variant="ghost" size="sm" class="!text-danger" @click="remove(b.id)">
            Xóa
          </UiButton>
        </UiTableCell>
      </UiTableRow>
    </UiDataTable>
  </div>
</template>
