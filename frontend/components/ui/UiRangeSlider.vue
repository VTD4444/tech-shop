<script setup lang="ts">
const props = defineProps<{
  modelValue: number;
  min?: number;
  max?: number;
  step?: number;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: number] }>();

const min = computed(() => props.min ?? 0);
const max = computed(() => props.max ?? 100);
</script>

<template>
  <input
    type="range"
    :min="min"
    :max="max"
    :step="step || 1"
    :value="modelValue"
    class="w-full h-1.5 rounded-full appearance-none bg-surface-3 accent-accent cursor-pointer"
    @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
  />
</template>
