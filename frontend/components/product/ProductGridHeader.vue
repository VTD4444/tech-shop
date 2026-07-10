<script setup lang="ts">
withDefaults(
  defineProps<{
    sort: string;
    compact?: boolean;
    title?: string;
    subtitle?: string;
  }>(),
  {
    compact: false,
    title: 'Linh kiện hiệu năng cao',
    subtitle:
      'Khám phá bộ sưu tập phần cứng cao cấp được tuyển chọn cho cấu hình tiếp theo của bạn.',
  },
);
defineEmits<{ 'update:sort': [value: string] }>();

const sortOptions = [
  { label: 'Mới nhất', value: 'created_at' },
  { label: 'Giá: Thấp đến cao', value: 'price_asc' },
  { label: 'Giá: Cao đến thấp', value: 'price_desc' },
  { label: 'Tên A-Z', value: 'name_asc' },
];
</script>

<template>
  <div
    :class="[
      'flex flex-col sm:flex-row gap-4',
      compact ? 'sm:items-center sm:justify-end mb-3' : 'sm:items-end sm:justify-between mb-8',
    ]"
  >
    <div v-if="!compact">
      <UiText as="h1" size="3xl" class="mb-2">{{ title }}</UiText>
      <UiText variant="muted" size="sm">{{ subtitle }}</UiText>
    </div>
    <div class="w-full sm:w-48">
      <UiText variant="muted" size="xs" uppercase class="mb-1 block">Sắp xếp theo</UiText>
      <UiSelect
        :model-value="sort"
        :options="sortOptions"
        @update:model-value="$emit('update:sort', $event)"
      />
    </div>
  </div>
</template>
