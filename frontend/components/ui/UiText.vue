<script setup lang="ts">
import { cn } from '~/utils/cn';

type As = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'label';

const props = withDefaults(
  defineProps<{
    as?: As;
    variant?: 'default' | 'muted' | 'accent' | 'danger';
    size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
    uppercase?: boolean;
  }>(),
  { as: 'p', variant: 'default', size: 'base' },
);

const tag = computed(() => props.as);

const classes = computed(() =>
  cn(
    props.variant === 'default' && 'text-fg',
    props.variant === 'muted' && 'text-fg-muted',
    props.variant === 'accent' && 'text-accent',
    props.variant === 'danger' && 'text-danger',
    props.size === 'xs' && 'text-xs',
    props.size === 'sm' && 'text-sm',
    props.size === 'base' && 'text-base',
    props.size === 'lg' && 'text-lg',
    props.size === 'xl' && 'text-xl font-semibold',
    props.size === '2xl' && 'text-2xl font-bold',
    props.size === '3xl' && 'text-3xl font-bold',
    props.size === '4xl' && 'text-4xl md:text-5xl font-bold tracking-tight',
    props.uppercase && 'uppercase tracking-wide',
    (props.as === 'h1' || props.as === 'h2' || props.as === 'h3' || props.as === 'h4') && 'text-fg font-bold',
  ),
);
</script>

<template>
  <component :is="tag" :class="classes">
    <slot />
  </component>
</template>
