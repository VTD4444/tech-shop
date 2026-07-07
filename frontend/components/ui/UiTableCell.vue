<script setup lang="ts">
import { cn } from '~/utils/cn';

withDefaults(
  defineProps<{
    align?: 'left' | 'center' | 'right';
    variant?: 'default' | 'muted' | 'emphasis' | 'numeric' | 'actions';
  }>(),
  { align: 'left', variant: 'default' },
);

const variantClasses = {
  default: 'text-fg',
  muted: 'text-fg-muted',
  emphasis: 'font-medium text-fg',
  numeric: 'text-fg tabular-nums',
  actions: 'text-fg whitespace-nowrap',
};
</script>

<template>
  <td
    :class="cn(
      'px-5 py-3.5 align-middle',
      variantClasses[variant],
      align === 'center' && 'text-center',
      align === 'right' && 'text-right',
      variant === 'actions' && 'text-right',
    )"
  >
    <slot />
  </td>
</template>
