<script setup lang="ts">
import { Wrench } from 'lucide-vue-next';

const route = useRoute();
const show = computed(() =>
  ['/products', '/'].some((p) => route.path === p || route.path.startsWith('/products')),
);
</script>

<template>
  <NuxtLink
    v-if="show"
    to="/pc-builder"
    class="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-5 py-3 rounded-lg bg-accent text-surface-0 font-semibold text-sm shadow-glow-accent hover:bg-accent-hover transition-all hover:scale-105"
  >
    <Wrench class="w-4 h-4" />
    BUILD YOUR PC
  </NuxtLink>
</template>
