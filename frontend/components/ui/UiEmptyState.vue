<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{
  title: string;
  description?: string;
  icon?: Component;
}>();
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <component :is="icon" v-if="icon" class="w-12 h-12 text-text-muted mb-4" />
    <UiText as="h3" size="xl">{{ title }}</UiText>
    <UiText v-if="description" variant="muted" size="sm" class="mt-2 max-w-md">
      {{ description }}
    </UiText>
    <div v-if="$slots.action" class="mt-6">
      <slot name="action" />
    </div>
  </div>
</template>
