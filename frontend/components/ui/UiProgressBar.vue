<script setup lang="ts">
defineProps<{
  value: number;
  max?: number;
  label?: string;
}>();
</script>

<template>
  <div>
    <div v-if="label" class="flex justify-between text-xs text-text-muted mb-1">
      <span>{{ label }}</span>
      <span>{{ value }}{{ max ? ` / ${max}` : '' }}</span>
    </div>
    <div class="h-1.5 rounded-full bg-surface-3 overflow-hidden">
      <div
        class="h-full rounded-full bg-accent transition-all duration-300"
        :style="{ width: `${max ? Math.min(100, (value / max) * 100) : value}%` }"
      />
    </div>
  </div>
</template>
