<script setup lang="ts">
defineProps<{ sort: string }>();
defineEmits<{ 'update:sort': [value: string] }>();

const sortOptions = [
  { label: 'Newest', value: 'created_at' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Name A-Z', value: 'name_asc' },
];
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
    <div>
      <UiText as="h1" size="3xl" class="mb-2">High-Performance Components</UiText>
      <UiText variant="muted" size="sm">
        Browse our curated selection of elite hardware for your next build.
      </UiText>
    </div>
    <div class="w-full sm:w-48">
      <UiText variant="muted" size="xs" uppercase class="mb-1 block">Sort by</UiText>
      <UiSelect
        :model-value="sort"
        :options="sortOptions"
        @update:model-value="$emit('update:sort', $event)"
      />
    </div>
  </div>
</template>
