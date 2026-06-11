<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' });

const { $api } = useNuxtApp();
const { formatPrice } = useFormatPrice();
const products = ref<any[]>([]);
const loading = ref(true);

try {
  const res: any = await $api('/products?limit=100');
  products.value = res.data || [];
} finally {
  loading.value = false;
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <UiText as="h1" size="2xl">Products</UiText>
      <UiButton to="/admin/products/new" variant="primary" size="sm">Add product</UiButton>
    </div>
    <div v-if="loading" class="space-y-2"><UiSkeleton v-for="i in 5" :key="i" class="h-12" /></div>
    <UiTable v-else>
      <template #head>
        <UiTableHead>Name</UiTableHead>
        <UiTableHead>Price</UiTableHead>
        <UiTableHead>Stock</UiTableHead>
        <UiTableHead>Status</UiTableHead>
        <UiTableHead align="right">Actions</UiTableHead>
      </template>
      <UiTableRow v-for="p in products" :key="p.id">
        <UiTableCell><span class="font-medium text-text-primary">{{ p.name }}</span></UiTableCell>
        <UiTableCell>{{ formatPrice(p.price) }}</UiTableCell>
        <UiTableCell>{{ p.stockQuantity }}</UiTableCell>
        <UiTableCell><UiBadge variant="neutral">{{ p.status }}</UiBadge></UiTableCell>
        <UiTableCell align="right">
          <NuxtLink :to="`/admin/products/${p.slug}`" class="text-accent text-sm hover:underline">Edit</NuxtLink>
        </UiTableCell>
      </UiTableRow>
    </UiTable>
  </div>
</template>
