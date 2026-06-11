<script setup lang="ts">
import { cn } from '~/utils/cn';

const props = defineProps<{
  modelValue?: boolean;
  label?: string;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
</script>

<template>
  <label class="flex items-center gap-2 cursor-pointer group">
    <input
      type="checkbox"
      :checked="modelValue"
      class="w-4 h-4 rounded border-subtle bg-surface-3 text-accent focus:ring-accent focus:ring-offset-surface-0"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span v-if="label" class="text-sm text-text-muted group-hover:text-text-primary">{{ label }}</span>
  </label>
</template>
