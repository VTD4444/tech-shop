<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] });

const { $api } = useNuxtApp();
const toast = useToast();
const confirmDialog = useConfirmDialog();
const brands = ref<any[]>([]);
const name = ref('');
const slug = ref('');

const res: any = await $api('/brands');
brands.value = res.data || [];

async function create() {
  await $api('/brands', { method: 'POST', body: { name: name.value, slug: slug.value } });
  toast.success('Đã tạo thương hiệu');
  name.value = '';
  slug.value = '';
  const r: any = await $api('/brands');
  brands.value = r.data || [];
}

async function remove(id: string) {
  const ok = await confirmDialog.confirm('Xóa thương hiệu này?');
  if (!ok) return;
  await $api(`/brands/${id}`, { method: 'DELETE' });
  brands.value = brands.value.filter((b) => b.id !== id);
  toast.info('Đã xóa thương hiệu');
}
</script>

<template>
  <div>
    <UiText as="h1" size="2xl" class="mb-6">Thương hiệu</UiText>
    <UiCard padding="md" class="mb-6">
      <form class="flex flex-wrap gap-2" @submit.prevent="create">
        <UiInput v-model="name" placeholder="Tên" required class="flex-1 min-w-[120px]" />
        <UiInput v-model="slug" placeholder="đường dẫn" required class="w-40" />
        <UiButton type="submit" variant="primary" size="sm">Thêm</UiButton>
      </form>
    </UiCard>
    <UiTable>
      <template #head>
        <UiTableHead>Tên</UiTableHead>
        <UiTableHead>Đường dẫn</UiTableHead>
        <UiTableHead align="right">Thao tác</UiTableHead>
      </template>
      <UiTableRow v-for="b in brands" :key="b.id">
        <UiTableCell>{{ b.name }}</UiTableCell>
        <UiTableCell><span class="text-fg-muted">/{{ b.slug }}</span></UiTableCell>
        <UiTableCell align="right">
          <UiButton variant="ghost" size="sm" class="!text-danger" @click="remove(b.id)">Xóa</UiButton>
        </UiTableCell>
      </UiTableRow>
    </UiTable>
  </div>
</template>
