<script setup lang="ts">
import { Cpu } from 'lucide-vue-next';

defineProps<{
  label: string;
  type: string;
  selected?: any;
}>();

defineEmits<{ select: []; remove: [] }>();
</script>

<template>
  <UiCard
    padding="md"
    class="cursor-pointer transition-all"
    :class="selected ? 'border-accent bg-accent-muted/30' : 'hover:border-accent/30'"
    @click="$emit('select')"
  >
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-10 h-10 rounded-lg bg-surface-3 flex items-center justify-center shrink-0">
          <Cpu class="w-5 h-5 text-accent" />
        </div>
        <div class="min-w-0">
          <UiText size="xs" variant="muted" uppercase>{{ label }}</UiText>
          <p v-if="selected" class="text-sm text-text-primary truncate font-medium">{{ selected.product?.name }}</p>
          <p v-else class="text-sm text-text-muted">Nhấn để chọn</p>
        </div>
      </div>
      <UiButton v-if="selected" variant="ghost" size="sm" class="!text-danger shrink-0" @click.stop="$emit('remove')">
        Xóa
      </UiButton>
    </div>
  </UiCard>
</template>
