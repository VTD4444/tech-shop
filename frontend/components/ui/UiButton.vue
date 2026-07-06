<script setup lang="ts">
import { cn } from '~/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const props = withDefaults(
  defineProps<{
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    to?: string;
    block?: boolean;
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
);

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover font-semibold',
  secondary: 'border border-accent text-accent hover:bg-accent-muted bg-transparent',
  ghost: 'text-fg-muted hover:text-fg hover:bg-surface-3 bg-transparent',
  danger: 'bg-danger/20 text-danger border border-danger/30 hover:bg-danger/30',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-3 text-base',
};

const classes = computed(() =>
  cn(
    'inline-flex items-center justify-center gap-2 rounded-md transition-all duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0',
    'disabled:opacity-50 disabled:pointer-events-none',
    variantClasses[props.variant],
    sizeClasses[props.size],
    props.block && 'w-full',
  ),
);
</script>

<template>
  <NuxtLink v-if="to" :to="to" :class="classes">
    <slot />
  </NuxtLink>
  <button
    v-else
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
  >
    <span v-if="loading" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    <slot />
  </button>
</template>
