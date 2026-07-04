<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] });

const { $api } = useNuxtApp();
const { formatPrice } = useFormatPrice();
const statusLabels: Record<string, string> = {
  active: 'Đang bán',
  discontinued: 'Ngừng kinh doanh',
};
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
      <UiText as="h1" size="2xl">Sản phẩm</UiText>
      <UiButton to="/admin/products/new" variant="primary" size="sm">Thêm sản phẩm</UiButton>
    </div>
    <div v-if="loading" class="space-y-2"><UiSkeleton v-for="i in 5" :key="i" class="h-12" /></div>
    <UiTable v-else>
      <template #head>
        <UiTableHead>Tên</UiTableHead>
        <UiTableHead>Giá</UiTableHead>
        <UiTableHead>Tồn kho</UiTableHead>
        <UiTableHead>Trạng thái</UiTableHead>
        <UiTableHead align="right">Thao tác</UiTableHead>
      </template>
      <UiTableRow v-for="p in products" :key="p.id">
        <UiTableCell><span class="font-medium text-text-primary">{{ p.name }}</span></UiTableCell>
        <UiTableCell>{{ formatPrice(p.price) }}</UiTableCell>
        <UiTableCell>{{ p.stockQuantity }}</UiTableCell>
        <UiTableCell><UiBadge variant="neutral">{{ statusLabels[p.status] || p.status }}</UiBadge></UiTableCell>
        <UiTableCell align="right">
          <NuxtLink :to="`/admin/products/${p.slug}`" class="text-accent text-sm hover:underline">Sửa</NuxtLink>
        </UiTableCell>
      </UiTableRow>
    </UiTable>
  </div>
</template>
