<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  accent?: boolean;
}>();
</script>

<template>
  <UiCard padding="md">
    <UiText variant="muted" size="xs" uppercase class="mb-2">{{ label }}</UiText>
    <UiText
      as="p"
      size="2xl"
      :variant="accent ? 'accent' : 'default'"
      class="font-bold"
    >
      {{ value }}
    </UiText>
    <p v-if="trend" :class="['text-xs mt-2', trendUp ? 'text-accent' : 'text-warning']">
      {{ trend }}
    </p>
  </UiCard>
</template>
