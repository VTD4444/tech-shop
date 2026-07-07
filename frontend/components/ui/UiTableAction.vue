<script setup lang="ts">
defineProps<{
  to?: string;
  external?: boolean;
}>();
</script>

<template>
  <NuxtLink
    v-if="to && !external"
    :to="to"
    class="inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover hover:underline"
  >
    <slot />
  </NuxtLink>
  <a
    v-else-if="to && external"
    :href="to"
    target="_blank"
    rel="noopener noreferrer"
    class="inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover hover:underline"
  >
    <slot />
  </a>
  <button
    v-else
    type="button"
    class="inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover hover:underline"
  >
    <slot />
  </button>
</template>
