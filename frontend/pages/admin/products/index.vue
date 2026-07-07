<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] });

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

const statusLabels: Record<string, string> = {
  active: 'Đang bán',
  inactive: 'Ngừng hiển thị',
  out_of_stock: 'Hết hàng',
  discontinued: 'Ngừng kinh doanh',
};
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <UiText as="h1" size="2xl">Sản phẩm</UiText>
      <UiButton to="/admin/products/new" variant="primary" size="sm">Thêm sản phẩm</UiButton>
    </div>

    <UiDataTable
      :loading="loading"
      :empty="!loading && products.length === 0"
      :count="products.length"
      empty-title="Chưa có sản phẩm"
      empty-description="Thêm sản phẩm đầu tiên cho cửa hàng."
    >
      <template #empty>
        <UiButton to="/admin/products/new" variant="primary" size="sm">Thêm sản phẩm</UiButton>
      </template>
      <template #head>
        <UiTableHead>Tên sản phẩm</UiTableHead>
        <UiTableHead align="right">Giá</UiTableHead>
        <UiTableHead align="right">Tồn kho</UiTableHead>
        <UiTableHead>Trạng thái</UiTableHead>
        <UiTableHead align="right" width="sm">Thao tác</UiTableHead>
      </template>

      <UiTableRow v-for="p in products" :key="p.id">
        <UiTableCell variant="emphasis">{{ p.name }}</UiTableCell>
        <UiTableCell align="right" variant="numeric">{{ formatPrice(p.price) }}</UiTableCell>
        <UiTableCell align="right" variant="numeric">{{ p.stockQuantity }}</UiTableCell>
        <UiTableCell>
          <UiBadge variant="neutral">{{ statusLabels[p.status] || p.status }}</UiBadge>
        </UiTableCell>
        <UiTableCell variant="actions">
          <UiTableAction :to="`/admin/products/${p.slug}`">Sửa</UiTableAction>
        </UiTableCell>
      </UiTableRow>
    </UiDataTable>
  </div>
</template>
