<script setup lang="ts">
import DOMPurify from 'isomorphic-dompurify';

const props = defineProps<{ html?: string | null }>();

const safeHtml = computed(() => {
  if (!props.html) return '';
  return DOMPurify.sanitize(props.html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h2', 'h3', 'a', 'img'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt'],
  });
});
</script>

<template>
  <div v-if="safeHtml" class="prose prose-sm max-w-none text-text-primary product-long-description leading-relaxed" v-html="safeHtml" />
  <p v-else class="text-text-muted text-sm">No detailed description available.</p>
</template>

<style>
.product-long-description img { max-width: 100%; border-radius: 0.5rem; margin: 0.5rem 0; }
.product-long-description a { color: var(--color-accent, #3b82f6); text-decoration: underline; }
</style>
