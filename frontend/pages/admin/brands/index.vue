<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' });

const { $api } = useNuxtApp();
const toast = useToast();
const brands = ref<any[]>([]);
const name = ref('');
const slug = ref('');

const res: any = await $api('/brands');
brands.value = res.data || [];

async function create() {
  await $api('/brands', { method: 'POST', body: { name: name.value, slug: slug.value } });
  toast.success('Brand created');
  name.value = '';
  slug.value = '';
  const r: any = await $api('/brands');
  brands.value = r.data || [];
}

async function remove(id: string) {
  if (!confirm('Delete brand?')) return;
  await $api(`/brands/${id}`, { method: 'DELETE' });
  brands.value = brands.value.filter((b) => b.id !== id);
  toast.info('Brand deleted');
}
</script>

<template>
  <div>
    <UiText as="h1" size="2xl" class="mb-6">Brands</UiText>
    <UiCard padding="md" class="mb-6">
      <form class="flex flex-wrap gap-2" @submit.prevent="create">
        <UiInput v-model="name" placeholder="Name" required class="flex-1 min-w-[120px]" />
        <UiInput v-model="slug" placeholder="slug" required class="w-40" />
        <UiButton type="submit" variant="primary" size="sm">Add</UiButton>
      </form>
    </UiCard>
    <UiTable>
      <template #head>
        <UiTableHead>Name</UiTableHead>
        <UiTableHead>Slug</UiTableHead>
        <UiTableHead align="right">Actions</UiTableHead>
      </template>
      <UiTableRow v-for="b in brands" :key="b.id">
        <UiTableCell>{{ b.name }}</UiTableCell>
        <UiTableCell><span class="text-text-muted">/{{ b.slug }}</span></UiTableCell>
        <UiTableCell align="right">
          <UiButton variant="ghost" size="sm" class="!text-danger" @click="remove(b.id)">Delete</UiButton>
        </UiTableCell>
      </UiTableRow>
    </UiTable>
  </div>
</template>
