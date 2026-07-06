<script setup lang="ts">
import { cn } from '~/utils/cn';

withDefaults(defineProps<{ align?: 'left' | 'center' | 'right' }>(), { align: 'left' });
</script>

<template>
  <th
    :class="cn(
      'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-fg-muted',
      align === 'center' && 'text-center',
      align === 'right' && 'text-right',
    )"
  >
    <slot />
  </th>
</template>
