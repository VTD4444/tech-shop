<script setup lang="ts">
import { cn } from '~/utils/cn';

const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    size?: 'md' | 'lg' | 'xl';
  }>(),
  { size: 'md' },
);

const emit = defineEmits<{ close: [] }>();

const sizeClass = computed(() => {
  if (props.size === 'xl') return 'max-w-2xl';
  if (props.size === 'lg') return 'max-w-xl';
  return 'max-w-lg';
});

function onBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close');
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm"
        @click="onBackdrop"
      >
        <UiCard
          :class="cn('w-full max-h-[90vh] flex flex-col overflow-hidden', sizeClass)"
          padding="lg"
          @click.stop
        >
          <div v-if="title" class="flex items-center justify-between gap-3 mb-4 shrink-0">
            <UiText as="h3" size="xl" class="min-w-0">{{ title }}</UiText>
            <button type="button" class="text-fg-muted hover:text-fg p-1 shrink-0" @click="emit('close')">✕</button>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto">
            <slot />
          </div>
        </UiCard>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
