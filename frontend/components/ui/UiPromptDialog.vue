<script setup lang="ts">
import { usePromptDialog } from '~/composables/usePromptDialog';

const { state, setValue, accept, cancel } = usePromptDialog();

function onSubmit() {
  accept();
}
</script>

<template>
  <UiDialog
    :open="state.open"
    :title="state.title"
    :description="state.message || undefined"
    size="sm"
    @close="cancel"
  >
    <form @submit.prevent="onSubmit">
      <UiInput
        :model-value="state.value"
        :placeholder="state.placeholder"
        autofocus
        @update:model-value="setValue"
      />
    </form>
    <template #footer>
      <UiButton variant="ghost" size="sm" type="button" @click="cancel">
        {{ state.cancelLabel }}
      </UiButton>
      <UiButton variant="primary" size="sm" type="button" @click="accept">
        {{ state.confirmLabel }}
      </UiButton>
    </template>
  </UiDialog>
</template>
