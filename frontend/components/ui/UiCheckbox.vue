<script setup lang="ts">
import { Check } from 'lucide-vue-next';
import { cn } from '~/utils/cn';

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    label?: string;
    description?: string;
    disabled?: boolean;
    id?: string;
  }>(),
  { modelValue: false },
);

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();

const inputId = computed(() => props.id || `checkbox-${useId()}`);
</script>

<template>
  <label
    :for="inputId"
    :class="cn(
      'flex gap-3 rounded-lg border border-subtle bg-surface-2/40 p-3 transition-colors',
      !disabled && 'cursor-pointer hover:border-accent/40 hover:bg-surface-2',
      disabled && 'opacity-50 cursor-not-allowed',
      modelValue && 'border-accent/30 bg-accent-muted/20',
    )"
  >
    <span class="relative flex h-5 w-5 shrink-0 items-center justify-center mt-0.5">
      <input
        :id="inputId"
        type="checkbox"
        class="peer sr-only"
        :checked="modelValue"
        :disabled="disabled"
        @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
      <span
        :class="cn(
          'flex h-5 w-5 items-center justify-center rounded border transition-all',
          'border-subtle bg-surface-3 peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-0',
          modelValue && 'border-accent bg-accent text-on-accent',
        )"
        aria-hidden="true"
      >
        <Check v-if="modelValue" class="w-3.5 h-3.5" stroke-width="3" />
      </span>
    </span>
    <span v-if="label || description || $slots.default" class="min-w-0 flex-1">
      <span v-if="label" class="block text-sm font-medium text-fg">{{ label }}</span>
      <span v-if="description" class="block text-xs text-fg-muted mt-0.5">{{ description }}</span>
      <slot />
    </span>
  </label>
</template>
