<script setup lang="ts">
import { useSlots, computed } from 'vue';

const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    loading?: boolean;
    empty?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
    skeletonRows?: number;
    count?: number;
  }>(),
  {
    loading: false,
    empty: false,
    emptyTitle: 'Chưa có dữ liệu',
    emptyDescription: 'Danh sách hiện đang trống.',
    skeletonRows: 5,
  },
);

const slots = useSlots();
const showHeader = computed(
  () => Boolean(props.title || props.description || slots.toolbar),
);
</script>

<template>
  <UiCard padding="none" class="overflow-hidden">
    <div
      v-if="showHeader"
      class="flex flex-wrap items-start justify-between gap-3 border-b border-subtle bg-surface-1/50 px-5 py-4"
    >
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <UiText v-if="title" as="h2" size="lg">{{ title }}</UiText>
          <UiBadge v-if="count != null" variant="neutral" class="!text-[11px]">
            {{ count }}
          </UiBadge>
        </div>
        <UiText v-if="description" variant="muted" size="sm" class="mt-1">
          {{ description }}
        </UiText>
      </div>
      <div v-if="$slots.toolbar" class="flex shrink-0 items-center gap-2">
        <slot name="toolbar" />
      </div>
    </div>

    <div v-if="loading" class="space-y-2 p-5">
      <UiSkeleton
        v-for="i in skeletonRows"
        :key="i"
        class="h-11 rounded-lg"
      />
    </div>

    <UiEmptyState
      v-else-if="empty"
      :title="emptyTitle"
      :description="emptyDescription"
      class="!py-14"
    >
      <template v-if="$slots.empty" #action>
        <slot name="empty" />
      </template>
    </UiEmptyState>

    <UiTable v-else flush>
      <template v-if="$slots.head" #head>
        <slot name="head" />
      </template>
      <slot />
    </UiTable>

    <div
      v-if="$slots.footer && !loading && !empty"
      class="border-t border-subtle bg-surface-1/30 px-5 py-3"
    >
      <slot name="footer" />
    </div>
  </UiCard>
</template>
