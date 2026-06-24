<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] });

const route = useRoute();
const { $api } = useNuxtApp();
const toast = useToast();
const product = ref<any>(null);
const loading = ref(true);

try {
  const res: any = await $api(`/products/${route.params.id}`);
  product.value = res.data;
} finally {
  loading.value = false;
}

async function update(payload: Record<string, unknown>) {
  await $api(`/products/${product.value.id}`, { method: 'PATCH', body: payload });
  toast.success('Product updated');
  navigateTo('/admin/products');
}

async function remove() {
  if (!confirm('Discontinue this product?')) return;
  await $api(`/products/${product.value.id}`, { method: 'DELETE' });
  toast.info('Product discontinued');
  navigateTo('/admin/products');
}
</script>

<template>
  <div>
    <UiText as="h1" size="2xl" class="mb-6">Edit product</UiText>
    <div v-if="loading"><UiSkeleton class="h-96 max-w-xl" /></div>
    <template v-else>
      <AdminProductForm :initial="product" @submit="update" />
      <UiButton variant="danger" size="sm" class="mt-4" @click="remove">Delete (discontinue)</UiButton>
    </template>
  </div>
</template>
