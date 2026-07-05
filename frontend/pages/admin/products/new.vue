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
    <NuxtLink
      to="/admin/products"
      class="text-accent text-sm hover:underline mb-2 inline-block"
    >
      ← Danh sách sản phẩm
    </NuxtLink>
    <UiText as="h1" size="2xl" class="mb-1">Sản phẩm mới</UiText>
    <UiText variant="muted" size="sm" class="mb-6">
      Thêm sản phẩm mới vào cửa hàng
    </UiText>
    <AdminProductForm submit-label="Tạo sản phẩm" @submit="create" />
  </div>
</template>
