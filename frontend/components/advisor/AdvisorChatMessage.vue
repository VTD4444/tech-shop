<script setup lang="ts">
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

const props = defineProps<{
  role: 'user' | 'assistant';
  content: string;
}>();

const html = computed(() => {
  if (props.role === 'user') {
    return DOMPurify.sanitize(props.content.replace(/\n/g, '<br>'));
  }
  const parsed = marked.parse(props.content || '', { async: false }) as string;
  return DOMPurify.sanitize(parsed);
});
</script>

<template>
  <div
    class="flex"
    :class="role === 'user' ? 'justify-end' : 'justify-start'"
  >
    <div
      class="max-w-[85%] rounded-lg px-4 py-3 text-sm"
      :class="role === 'user'
        ? 'bg-accent text-surface-0'
        : 'bg-surface-2 border border-subtle text-text-primary prose prose-invert prose-sm max-w-none'"
    >
      <div v-if="role === 'assistant' && !content" class="text-text-muted italic">Thinking...</div>
      <div v-else v-html="html" />
    </div>
  </div>
</template>
