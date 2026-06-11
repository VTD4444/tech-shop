<script setup lang="ts">
import { cn } from '~/utils/cn';

withDefaults(defineProps<{ align?: 'left' | 'center' | 'right' }>(), { align: 'left' });
</script>

<template>
  <td
    :class="cn(
      'px-4 py-3 text-text-primary',
      align === 'center' && 'text-center',
      align === 'right' && 'text-right',
    )"
  >
    <slot />
  </td>
</template>
