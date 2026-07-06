<script setup lang="ts">
defineProps<{
  label?: string;
  hint?: string;
  required?: boolean;
}>();
</script>

<template>
  <div class="space-y-1.5">
    <UiText
      v-if="label"
      as="label"
      variant="muted"
      size="xs"
      uppercase
      class="block tracking-wide"
    >
      {{ label }}
      <span v-if="required" class="text-danger normal-case">*</span>
    </UiText>
    <slot />
    <p v-if="hint" class="text-xs text-fg-muted">{{ hint }}</p>
  </div>
</template>
