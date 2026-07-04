<script setup lang="ts">
import { useConfirmDialog } from '~/composables/useConfirmDialog';

const { state, accept, cancel } = useConfirmDialog();
</script>

<template>
  <UiDialog
    :open="state.open"
    :title="state.title"
    :description="state.message"
    size="sm"
    @close="cancel"
  >
    <template #footer>
      <UiButton variant="ghost" size="sm" @click="cancel">
        {{ state.cancelLabel }}
      </UiButton>
      <UiButton
        :variant="state.variant === 'danger' ? 'danger' : 'primary'"
        size="sm"
        @click="accept"
      >
        {{ state.confirmLabel }}
      </UiButton>
    </template>
  </UiDialog>
</template>
