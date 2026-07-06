<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: number;
  readonly?: boolean;
  label?: string;
}>(), {
  modelValue: 0,
  readonly: false,
  label: 'Đánh giá',
});

const emit = defineEmits<{ 'update:modelValue': [value: number] }>();

function setRating(n: number) {
  if (props.readonly) return;
  emit('update:modelValue', n);
}
</script>

<template>
  <div
    class="inline-flex gap-0.5"
    role="radiogroup"
    :aria-label="label"
  >
    <button
      v-for="n in 5"
      :key="n"
      type="button"
      class="text-lg leading-none transition-colors"
      :class="n <= modelValue ? 'text-warning' : 'text-fg-muted/40'"
      :disabled="readonly"
      :aria-label="`${n} sao`"
      :aria-checked="n === modelValue"
      role="radio"
      @click="setRating(n)"
    >
      ★
    </button>
  </div>
</template>
