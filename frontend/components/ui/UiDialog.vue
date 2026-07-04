<script setup lang="ts">
import { cn } from '~/utils/cn';

const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    description?: string;
    size?: 'sm' | 'md' | 'lg';
  }>(),
  { size: 'md' },
);

const emit = defineEmits<{ close: [] }>();

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

function onBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close');
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        @click="onBackdrop"
      >
        <UiCard
          :class="cn('w-full', sizeClasses[size])"
          padding="lg"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? 'ui-dialog-title' : undefined"
          @click.stop
        >
          <div v-if="title" class="mb-2">
            <UiText id="ui-dialog-title" as="h3" size="lg">{{ title }}</UiText>
          </div>
          <p v-if="description" class="text-sm text-text-muted">{{ description }}</p>
          <div v-if="$slots.default" :class="description ? 'mt-4' : ''">
            <slot />
          </div>
          <div v-if="$slots.footer" class="mt-6 flex flex-wrap justify-end gap-2">
            <slot name="footer" />
          </div>
        </UiCard>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
