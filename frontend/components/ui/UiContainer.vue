<script setup lang="ts">
import { cn } from '~/utils/cn';

withDefaults(
  defineProps<{
    size?: 'default' | 'narrow' | 'wide' | 'full';
    class?: string;
  }>(),
  { size: 'default' },
);

const sizeClasses = {
  default: 'max-w-7xl',
  narrow: 'max-w-3xl',
  wide: 'max-w-[1400px]',
  full: 'max-w-full',
};
</script>

<template>
  <div :class="cn('mx-auto w-full px-4 md:px-6', sizeClasses[size], $props.class)">
    <slot />
  </div>
</template>
