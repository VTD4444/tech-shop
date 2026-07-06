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
  <div v-if="safeHtml" class="max-w-none text-fg product-long-description leading-relaxed" v-html="safeHtml" />
  <p v-else class="text-fg-muted text-sm">Chưa có mô tả chi tiết.</p>
</template>

<style>
.product-long-description img { max-width: 100%; border-radius: 0.5rem; margin: 0.5rem 0; }
</style>
