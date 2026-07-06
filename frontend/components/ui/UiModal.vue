<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  title?: string;
}>();

const emit = defineEmits<{ close: [] }>();

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
        <UiCard class="w-full max-w-lg max-h-[90vh] overflow-y-auto" padding="lg" @click.stop>
          <div v-if="title" class="flex items-center justify-between mb-4">
            <UiText as="h3" size="xl">{{ title }}</UiText>
            <button type="button" class="text-fg-muted hover:text-fg p-1" @click="emit('close')">✕</button>
          </div>
          <slot />
        </UiCard>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
