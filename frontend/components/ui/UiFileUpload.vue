<script setup lang="ts">
import { Upload, ImageIcon } from 'lucide-vue-next';
import { cn } from '~/utils/cn';

const props = withDefaults(
  defineProps<{
    accept?: string;
    loading?: boolean;
    error?: string;
    label?: string;
    hint?: string;
    previewUrl?: string;
    emptyText?: string;
    disabled?: boolean;
  }>(),
  {
    accept: 'image/*',
    emptyText: 'Kéo thả hoặc bấm để chọn file',
  },
);

const emit = defineEmits<{ change: [file: File] }>();

const inputRef = ref<HTMLInputElement | null>(null);
const dragOver = ref(false);

function openPicker() {
  if (props.disabled || props.loading) return;
  inputRef.value?.click();
}

function onInputChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) emit('change', file);
  (e.target as HTMLInputElement).value = '';
}

function onDrop(e: DragEvent) {
  dragOver.value = false;
  if (props.disabled || props.loading) return;
  const file = e.dataTransfer?.files?.[0];
  if (file) emit('change', file);
}
</script>

<template>
  <div class="space-y-2">
    <UiText v-if="label" variant="muted" size="xs" uppercase class="block tracking-wide">
      {{ label }}
    </UiText>

    <div
      role="button"
      tabindex="0"
      :class="cn(
        'relative rounded-lg border-2 border-dashed transition-colors overflow-hidden',
        dragOver ? 'border-accent bg-accent-muted/30' : 'border-subtle bg-surface-2/50',
        !disabled && !loading && 'cursor-pointer hover:border-accent/60 hover:bg-surface-2',
        (disabled || loading) && 'opacity-60 pointer-events-none',
        error && 'border-danger/50',
      )"
      @click="openPicker"
      @keydown.enter.prevent="openPicker"
      @keydown.space.prevent="openPicker"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="onDrop"
    >
      <input
        ref="inputRef"
        type="file"
        :accept="accept"
        class="sr-only"
        :disabled="disabled || loading"
        @change="onInputChange"
      />

      <div v-if="previewUrl" class="relative aspect-[4/3] bg-surface-3">
        <img :src="previewUrl" alt="" class="w-full h-full object-cover" />
        <div
          class="absolute inset-0 flex items-center justify-center bg-surface-0/60 opacity-0 hover:opacity-100 transition-opacity"
        >
          <span class="inline-flex items-center gap-2 text-sm font-medium text-text-primary">
            <Upload class="w-4 h-4" />
            Đổi ảnh
          </span>
        </div>
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center"
      >
        <span
          class="flex h-12 w-12 items-center justify-center rounded-full bg-surface-3 text-text-muted"
        >
          <ImageIcon v-if="!loading" class="w-5 h-5" />
          <span
            v-else
            class="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"
          />
        </span>
        <UiText size="sm" class="font-medium text-text-primary">{{ emptyText }}</UiText>
        <UiText variant="muted" size="xs">PNG, JPG, WEBP</UiText>
      </div>
    </div>

    <p v-if="error" class="text-xs text-danger">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-text-muted">{{ hint }}</p>
  </div>
</template>
