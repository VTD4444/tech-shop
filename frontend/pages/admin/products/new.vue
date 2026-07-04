<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] });

const { $api } = useNuxtApp();
const toast = useToast();

async function create(payload: Record<string, unknown>) {
  await $api('/products', { method: 'POST', body: payload });
  toast.success('Đã tạo sản phẩm');
  navigateTo('/admin/products');
}
</script>

<template>
  <div>
    <UiText as="h1" size="2xl" class="mb-6">Sản phẩm mới</UiText>
    <AdminProductForm @submit="create" />
  </div>
</template>
