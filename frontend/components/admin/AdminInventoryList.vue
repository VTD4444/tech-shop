<script setup lang="ts">
defineProps<{ items: any[] }>();
</script>

<template>
  <UiDataTable
    title="Tình trạng tồn kho"
    description="Sản phẩm sắp hết hàng cần nhập thêm"
    :count="items?.length ?? 0"
    :empty="!items?.length"
    empty-title="Chưa có dữ liệu tồn kho"
    empty-description="Thêm sản phẩm để theo dõi tồn kho tại đây."
  >
    <template #head>
      <UiTableHead>Sản phẩm</UiTableHead>
      <UiTableHead align="right">Tồn kho</UiTableHead>
      <UiTableHead align="right">Trạng thái</UiTableHead>
    </template>

    <UiTableRow v-for="item in (items || []).slice(0, 8)" :key="item.id">
      <UiTableCell variant="emphasis">
        <span class="line-clamp-1">{{ item.name }}</span>
      </UiTableCell>
      <UiTableCell align="right" variant="numeric">
        {{ item.stockQuantity }}
      </UiTableCell>
      <UiTableCell align="right">
        <UiBadge :variant="item.stockQuantity < 5 ? 'warning' : 'inStock'">
          {{ item.stockQuantity < 5 ? 'Nhập hàng' : 'Còn hàng' }}
        </UiBadge>
      </UiTableCell>
    </UiTableRow>
  </UiDataTable>
</template>
