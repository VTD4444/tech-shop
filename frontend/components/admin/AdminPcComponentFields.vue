<script setup lang="ts">
import { PC_COMPONENT_TYPES, PC_COMPONENT_FIELDS } from '~/utils/pcComponentSpecs';

const props = defineProps<{
  modelValue: Record<string, string | number>;
  enabled: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string | number>];
}>();

const typeOptions = PC_COMPONENT_TYPES.map((t) => ({ label: t.label, value: t.value }));

const activeFields = computed(() => {
  const type = String(props.modelValue.componentType || '');
  if (!type) return [];
  return PC_COMPONENT_FIELDS[type] ?? [];
});

function patch(key: string, value: string | number) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}
</script>

<template>
  <div v-if="enabled" class="space-y-4 rounded-lg border border-accent/30 bg-accent-muted/10 p-4">
    <div>
      <UiText as="h3" size="sm" class="font-semibold mb-1">Thông số tương thích PC Builder</UiText>
      <UiText variant="muted" size="xs">
        Nhập thông số kỹ thuật để PC Builder tự kiểm tra tương thích. Lấy từ datasheet nhà sản xuất.
      </UiText>
    </div>

    <div>
      <UiText variant="muted" size="xs" uppercase class="mb-1 block">Loại linh kiện *</UiText>
      <UiSelect
        :model-value="modelValue.componentType"
        :options="typeOptions"
        placeholder="Chọn loại…"
        @update:model-value="patch('componentType', $event)"
      />
    </div>

    <div v-if="activeFields.length" class="grid sm:grid-cols-2 gap-4">
      <div v-for="field in activeFields" :key="field.key">
        <UiText variant="muted" size="xs" uppercase class="mb-1 block">
          {{ field.label }} *
        </UiText>
        <UiInput
          :model-value="modelValue[field.key]"
          :type="field.type"
          :placeholder="field.placeholder"
          @update:model-value="patch(field.key, $event)"
        />
        <p v-if="field.hint" class="text-xs text-fg-muted mt-1">{{ field.hint }}</p>
      </div>
    </div>

    <UiText v-else-if="!modelValue.componentType" variant="muted" size="sm">
      Chọn loại linh kiện để hiện các trường spec cần nhập.
    </UiText>
  </div>
</template>
