<script setup lang="ts">
import { cn } from '~/utils/cn';

const props = defineProps<{
  modelValue?: string | number;
  options: { label: string; value: string | number }[];
  placeholder?: string;
  class?: string;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<template>
  <select
    :value="modelValue"
    :class="cn(
      'w-full rounded-md border border-subtle bg-surface-3 px-4 py-2.5 text-sm text-fg',
      'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer',
      props.class,
    )"
    @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
    <option v-for="opt in options" :key="String(opt.value)" :value="opt.value">
      {{ opt.label }}
    </option>
  </select>
</template>
