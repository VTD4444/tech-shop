<script setup lang="ts">
import { cn } from '~/utils/cn';

withDefaults(
  defineProps<{
    align?: 'left' | 'center' | 'right';
    width?: 'auto' | 'sm' | 'md' | 'lg';
  }>(),
  { align: 'left', width: 'auto' },
);

const widthClasses = {
  auto: '',
  sm: 'w-24',
  md: 'w-40',
  lg: 'w-56',
};
</script>

<template>
  <th
    :class="cn(
      'px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted whitespace-nowrap',
      widthClasses[width],
      align === 'center' && 'text-center',
      align === 'right' && 'text-right',
    )"
  >
    <slot />
  </th>
</template>
