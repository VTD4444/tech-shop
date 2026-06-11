<script setup lang="ts">
import { cn } from '~/utils/cn';

withDefaults(
  defineProps<{
    hover?: boolean;
    glass?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    class?: string;
  }>(),
  { hover: false, glass: false, padding: 'md' },
);

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};
</script>

<template>
  <div
    :class="cn(
      'rounded-xl border border-subtle bg-surface-2 shadow-card',
      glass && 'glass-panel bg-surface-2/80',
      hover && 'transition-all duration-200 hover:border-accent/30 hover:shadow-glow-accent',
      paddingClasses[padding],
      $props.class,
    )"
  >
    <div v-if="$slots.header" class="mb-4 pb-4 border-b border-subtle">
      <slot name="header" />
    </div>
    <slot />
    <div v-if="$slots.footer" class="mt-4 pt-4 border-t border-subtle">
      <slot name="footer" />
    </div>
  </div>
</template>
