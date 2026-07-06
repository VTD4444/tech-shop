<script setup lang="ts">
import { Send, Trash2 } from 'lucide-vue-next';
import { useAdvisorChat } from '~/composables/useAdvisorChat';

const { messages, loading, error, sendMessage, clearHistory } = useAdvisorChat();
const input = ref('');
const listRef = ref<HTMLElement | null>(null);

async function submit() {
  const text = input.value;
  input.value = '';
  await sendMessage(text);
  nextTick(() => {
    listRef.value?.scrollTo({ top: listRef.value.scrollHeight, behavior: 'smooth' });
  });
}

watch(
  () => messages.value.length,
  () => {
    nextTick(() => {
      listRef.value?.scrollTo({ top: listRef.value.scrollHeight, behavior: 'smooth' });
    });
  },
);
</script>

<template>
  <UiCard padding="md" class="flex flex-col h-[min(70vh,600px)]">
    <div class="flex items-center justify-between mb-4">
      <UiText as="h2" size="lg">Trò chuyện với Cố vấn AI</UiText>
      <button
        v-if="messages.length"
        type="button"
        class="text-xs text-fg-muted hover:text-danger flex items-center gap-1"
        @click="clearHistory"
      >
        <Trash2 class="w-3.5 h-3.5" /> Xóa lịch sử
      </button>
    </div>

    <div
      ref="listRef"
      class="flex-1 overflow-y-auto space-y-4 mb-4 pr-1"
    >
      <UiEmptyState
        v-if="!messages.length"
        title="Bắt đầu trò chuyện"
        description="Hỏi về ngân sách, game hoặc tương thích linh kiện."
      />
      <AdvisorChatMessage
        v-for="(msg, i) in messages"
        :key="i"
        :role="msg.role"
        :content="msg.content"
      />
    </div>

    <p v-if="error" class="text-danger text-xs mb-2">{{ error }}</p>

    <form class="flex gap-2" @submit.prevent="submit">
      <UiInput
        v-model="input"
        placeholder="VD: Tôi có 20 triệu VND và muốn chơi game 2K..."
        class="flex-1"
        :disabled="loading"
      />
      <UiButton type="submit" variant="primary" :loading="loading" :disabled="!input.trim()">
        <Send class="w-4 h-4" />
      </UiButton>
    </form>
  </UiCard>
</template>
