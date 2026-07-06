<script setup lang="ts">
import { cn } from '~/utils/cn';

const props = defineProps<{
  modelValue?: string | number;
  type?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  class?: string;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value);
}
</script>

<template>
  <div class="w-full">
    <div class="relative">
      <div v-if="$slots.prefix" class="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted">
        <slot name="prefix" />
      </div>
      <input
        :type="type || 'text'"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="cn(
          'w-full rounded-md border border-subtle bg-surface-3 px-4 py-2.5 text-sm text-fg',
          'placeholder:text-fg-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
          'disabled:opacity-50',
          $slots.prefix && 'pl-10',
          error && 'border-danger focus:ring-danger',
          props.class,
        )"
        @input="onInput"
      />
    </div>
    <p v-if="error" class="mt-1 text-xs text-danger">{{ error }}</p>
  </div>
</template>
