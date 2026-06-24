<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] });

const { $api } = useNuxtApp();
const toast = useToast();
const categories = ref<any[]>([]);
const name = ref('');
const slug = ref('');

const res: any = await $api('/categories');
categories.value = res.data || [];

async function create() {
  await $api('/categories', { method: 'POST', body: { name: name.value, slug: slug.value } });
  toast.success('Category created');
  name.value = '';
  slug.value = '';
  const r: any = await $api('/categories');
  categories.value = r.data || [];
}

async function remove(id: string) {
  if (!confirm('Delete category?')) return;
  await $api(`/categories/${id}`, { method: 'DELETE' });
  categories.value = categories.value.filter((c) => c.id !== id);
  toast.info('Category deleted');
}
</script>

<template>
  <div>
    <UiText as="h1" size="2xl" class="mb-6">Categories</UiText>
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
      <UiTableRow v-for="c in categories" :key="c.id">
        <UiTableCell>{{ c.name }}</UiTableCell>
        <UiTableCell><span class="text-text-muted">/{{ c.slug }}</span></UiTableCell>
        <UiTableCell align="right">
          <UiButton variant="ghost" size="sm" class="!text-danger" @click="remove(c.id)">Delete</UiButton>
        </UiTableCell>
      </UiTableRow>
    </UiTable>
  </div>
</template>
