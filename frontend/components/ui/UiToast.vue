<script setup lang="ts">
import { useToast } from '~/composables/useToast';

const { toasts, dismiss } = useToast();

const typeStyles = {
  success: 'border-accent/50 bg-surface-2 text-accent',
  error: 'border-danger/50 bg-surface-2 text-danger',
  info: 'border-subtle bg-surface-2 text-fg',
};
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="['px-4 py-3 rounded-lg border shadow-card text-sm flex items-center justify-between gap-3', typeStyles[t.type]]"
        >
          <span>{{ t.message }}</span>
          <button type="button" class="opacity-60 hover:opacity-100 text-current shrink-0" @click="dismiss(t.id)">✕</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; transform: translateX(100%); }
.toast-leave-to { opacity: 0; transform: translateX(100%); }
</style>
