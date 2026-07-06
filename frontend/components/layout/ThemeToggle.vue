<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next';

const { theme, toggleTheme } = useTheme();

const label = computed(() =>
  theme.value === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối',
);
</script>

<template>
  <button
    type="button"
    class="p-2 text-fg-muted hover:text-accent transition-colors rounded-md"
    :aria-label="label"
    :title="label"
    @click="toggleTheme"
  >
    <Sun v-if="theme === 'dark'" class="w-5 h-5" />
    <Moon v-else class="w-5 h-5" />
  </button>
</template>
