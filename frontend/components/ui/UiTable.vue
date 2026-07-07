<script setup lang="ts">
import { cn } from '~/utils/cn';

withDefaults(
  defineProps<{
    flush?: boolean;
    striped?: boolean;
    stickyHeader?: boolean;
  }>(),
  { flush: false, striped: true, stickyHeader: false },
);
</script>

<template>
  <div
    :class="cn(
      'overflow-x-auto',
      !flush && 'rounded-xl border border-subtle bg-surface-2 shadow-card',
    )"
  >
    <table class="w-full min-w-[640px] text-sm">
      <thead>
        <tr
          :class="cn(
            'border-b border-subtle bg-surface-1/80',
            stickyHeader && 'sticky top-0 z-10 backdrop-blur-sm',
          )"
        >
          <slot name="head" />
        </tr>
      </thead>
      <tbody
        :class="cn(
          'divide-y divide-subtle',
          striped && '[&>tr:nth-child(even)]:bg-surface-1/40',
        )"
      >
        <slot />
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
export default {
  name: 'UiTable',
};
</script>
