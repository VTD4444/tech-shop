<script setup lang="ts">
import { cn } from '~/utils/cn';
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-subtle">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-subtle bg-surface-1">
          <slot name="head" />
        </tr>
      </thead>
      <tbody class="divide-y divide-subtle">
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
