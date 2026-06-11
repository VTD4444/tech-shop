<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();

const isServerError = computed(() => (props.error.statusCode ?? 500) >= 500);

function goHome() {
  clearError({ redirect: '/' });
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-surface-0">
    <UiContainer class="flex-1 flex flex-col items-center justify-center py-20 text-center">
      <UiText as="h1" size="4xl" class="mb-2">{{ error.statusCode || 500 }}</UiText>
      <UiText as="h2" size="xl" class="mb-4">
        {{ isServerError ? 'Something went wrong' : 'Page not found' }}
      </UiText>
      <UiText variant="muted" class="mb-8 max-w-md">
        {{
          isServerError
            ? 'The server may be temporarily unavailable. You can return to the homepage and browse offline catalog.'
            : error.message || 'The page you requested does not exist.'
        }}
      </UiText>
      <div class="flex flex-wrap gap-3 justify-center">
        <UiButton variant="primary" @click="goHome">Go to Homepage</UiButton>
        <UiButton variant="secondary" to="/products">Browse Products</UiButton>
      </div>
    </UiContainer>
  </div>
</template>
