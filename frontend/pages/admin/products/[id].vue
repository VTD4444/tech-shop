<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] });

const route = useRoute();
const { $api } = useNuxtApp();
const toast = useToast();
const confirmDialog = useConfirmDialog();
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
  toast.success('Đã cập nhật sản phẩm');
  navigateTo('/admin/products');
}

async function remove() {
  const ok = await confirmDialog.confirm({
    title: 'Ngừng kinh doanh',
    message: 'Ngừng kinh doanh sản phẩm này?',
    confirmLabel: 'Ngừng kinh doanh',
  });
  if (!ok) return;
  await $api(`/products/${product.value.id}`, { method: 'DELETE' });
  toast.info('Đã ngừng kinh doanh sản phẩm');
  navigateTo('/admin/products');
}
</script>

<template>
  <div>
    <UiText as="h1" size="2xl" class="mb-6">Sửa sản phẩm</UiText>
    <div v-if="loading"><UiSkeleton class="h-96 max-w-xl" /></div>
    <template v-else>
      <AdminProductForm :initial="product" @submit="update" />
      <UiButton variant="danger" size="sm" class="mt-4" @click="remove">Xóa (ngừng kinh doanh)</UiButton>
    </template>
  </div>
</template>
