<script setup lang="ts">
import { cn } from '~/utils/cn';

withDefaults(
  defineProps<{
    clickable?: boolean;
  }>(),
  { clickable: false },
);
</script>

<template>
  <tr
    :class="cn(
      'transition-colors',
      clickable ? 'cursor-pointer hover:bg-accent/5' : 'hover:bg-surface-3/60',
    )"
  >
    <slot />
  </tr>
</template>
