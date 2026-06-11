<script setup lang="ts">
import { cn } from '~/utils/cn';

const props = withDefaults(
  defineProps<{ class?: string; lines?: number }>(),
  { lines: 1 },
);

const style = computed(() =>
  props.lines > 1 ? { height: `${props.lines * 16}px` } : undefined,
);
</script>

<template>
  <div
    :class="cn('animate-pulse rounded-md bg-surface-3', props.class)"
    :style="style"
  />
</template>
