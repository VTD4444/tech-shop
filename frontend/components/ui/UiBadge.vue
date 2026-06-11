<script setup lang="ts">
import { cn } from '~/utils/cn';

type BadgeVariant =
  | 'default'
  | 'inStock'
  | 'warning'
  | 'danger'
  | 'accent'
  | 'pending'
  | 'success'
  | 'neutral';

const props = withDefaults(
  defineProps<{ variant?: BadgeVariant; class?: string }>(),
  { variant: 'default' },
);

const variants: Record<BadgeVariant, string> = {
  default: 'bg-surface-3 text-text-muted',
  inStock: 'bg-accent-muted text-accent border border-accent/30',
  warning: 'bg-warning-muted text-warning border border-warning/30',
  danger: 'bg-danger-muted text-danger border border-danger/30',
  accent: 'bg-accent text-surface-0 font-semibold',
  pending: 'bg-warning-muted text-warning',
  success: 'bg-accent-muted text-accent',
  neutral: 'bg-surface-3 text-text-muted',
};
</script>

<template>
  <span
    :class="cn(
      'inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded',
      variants[variant],
      props.class,
    )"
  >
    <slot />
  </span>
</template>
