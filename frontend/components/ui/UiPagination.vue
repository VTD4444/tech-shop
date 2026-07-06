<script setup lang="ts">
import { cn } from '~/utils/cn';

const props = defineProps<{
  page: number;
  totalPages: number;
}>();

const emit = defineEmits<{ 'update:page': [page: number] }>();

function go(p: number) {
  if (p >= 1 && p <= props.totalPages) emit('update:page', p);
}

const pages = computed(() => {
  const items: number[] = [];
  const start = Math.max(1, props.page - 2);
  const end = Math.min(props.totalPages, props.page + 2);
  for (let i = start; i <= end; i++) items.push(i);
  return items;
});
</script>

<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-1 mt-8">
    <button
      type="button"
      class="w-9 h-9 rounded border border-subtle text-fg-muted hover:border-accent hover:text-accent disabled:opacity-40"
      :disabled="page <= 1"
      @click="go(page - 1)"
    >
      ‹
    </button>
    <button
      v-for="p in pages"
      :key="p"
      type="button"
      :class="cn(
        'w-9 h-9 rounded text-sm font-medium transition-colors',
        p === page
          ? 'bg-accent text-on-accent'
          : 'border border-subtle text-fg-muted hover:border-accent hover:text-accent',
      )"
      @click="go(p)"
    >
      {{ p }}
    </button>
    <button
      type="button"
      class="w-9 h-9 rounded border border-subtle text-fg-muted hover:border-accent hover:text-accent disabled:opacity-40"
      :disabled="page >= totalPages"
      @click="go(page + 1)"
    >
      ›
    </button>
  </div>
</template>
