<script setup lang="ts">
import { MessageSquare } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';

const props = defineProps<{
  slug: string;
  comments: any[];
  loading?: boolean;
}>();

const emit = defineEmits<{ submitted: []; updated: [] }>();

const authStore = useAuthStore();
const toast = useToast();
const { $api } = useNuxtApp();

const content = ref('');
const submitting = ref(false);

async function submit() {
  if (!authStore.isAuthenticated) return navigateTo('/login');
  if (!content.value.trim()) return;
  submitting.value = true;
  try {
    await $api(`/products/${props.slug}/comments`, {
      method: 'POST',
      body: { content: content.value },
    });
    content.value = '';
    emit('submitted');
    toast.success('Đã đăng bình luận');
  } catch {
    toast.error('Không thể đăng bình luận');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div>
    <UiCard v-if="authStore.isAuthenticated" padding="md" class="mb-6">
      <textarea
        v-model="content"
        rows="3"
        placeholder="Đặt câu hỏi hoặc chia sẻ ý kiến..."
        class="w-full rounded-md border border-subtle bg-surface-3 px-4 py-2.5 text-sm mb-3"
      />
      <UiButton variant="primary" size="sm" :loading="submitting" @click="submit">Gửi bình luận</UiButton>
    </UiCard>
    <p v-else class="text-sm text-text-muted mb-4">
      <NuxtLink to="/login" class="text-accent hover:underline">Đăng nhập</NuxtLink> để bình luận
    </p>

    <div v-if="loading" class="space-y-4">
      <UiSkeleton v-for="i in 3" :key="i" class="h-20" />
    </div>
    <UiEmptyState
      v-else-if="!comments.length"
      title="Chưa có bình luận"
      description="Hãy đặt câu hỏi hoặc chia sẻ ý kiến về sản phẩm này."
      :icon="MessageSquare"
    />
    <div v-else class="space-y-6">
      <ProductCommentItem
        v-for="c in comments"
        :key="c.id"
        :comment="c"
        :slug="slug"
        @reply="emit('submitted')"
        @updated="emit('updated')"
      />
    </div>
  </div>
</template>
