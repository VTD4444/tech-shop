<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';
import { useCloudinaryUpload } from '~/composables/useCloudinaryUpload';

const props = defineProps<{
  comment: any;
  slug: string;
  depth?: number;
}>();

const emit = defineEmits<{ reply: []; updated: [] }>();

const authStore = useAuthStore();
const toast = useToast();
const { $api } = useNuxtApp();
const { uploadFile } = useCloudinaryUpload('/uploads/sign');

const showReply = ref(false);
const replyText = ref('');
const editing = ref(false);
const editText = ref('');
const submitting = ref(false);

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN');
}

async function submitReply() {
  if (!authStore.isAuthenticated) return navigateTo('/login');
  if (!replyText.value.trim()) return;
  submitting.value = true;
  try {
    await $api(`/products/${props.slug}/comments/${props.comment.id}/replies`, {
      method: 'POST',
      body: { content: replyText.value },
    });
    replyText.value = '';
    showReply.value = false;
    emit('reply');
    toast.success('Reply posted');
  } catch {
    toast.error('Could not post reply');
  } finally {
    submitting.value = false;
  }
}

function startEdit() {
  editing.value = true;
  editText.value = props.comment.content;
}

async function saveEdit() {
  submitting.value = true;
  try {
    await $api(`/products/${props.slug}/comments/${props.comment.id}`, {
      method: 'PATCH',
      body: { content: editText.value },
    });
    editing.value = false;
    emit('updated');
    toast.success('Updated');
  } catch {
    toast.error('Could not update');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div :class="depth ? 'ml-6 mt-3 border-l-2 border-subtle pl-4' : ''">
    <div class="flex items-start justify-between gap-2">
      <div>
        <span class="font-medium text-text-primary">{{ comment.user?.username }}</span>
        <span class="text-text-muted text-sm ml-2">{{ formatDate(comment.createdAt) }}</span>
        <EditedLabel :is-edited="comment.isEdited" />
      </div>
      <div v-if="authStore.isAuthenticated && comment.userId === authStore.user?.id" class="flex gap-2">
        <button type="button" class="text-xs text-accent" @click="startEdit">Sửa</button>
      </div>
    </div>

    <p v-if="!editing" class="text-text-muted text-sm mt-1 whitespace-pre-wrap">{{ comment.content }}</p>
    <div v-else class="mt-2 space-y-2">
      <textarea v-model="editText" rows="2" class="w-full rounded-md border border-subtle bg-surface-3 px-3 py-2 text-sm" />
      <UiButton size="sm" variant="primary" :loading="submitting" @click="saveEdit">Lưu</UiButton>
    </div>

    <ProductImageGallery :images="comment.images || []" />

    <button
      v-if="!depth && authStore.isAuthenticated"
      type="button"
      class="text-xs text-accent mt-2 hover:underline"
      @click="showReply = !showReply"
    >
      Trả lời
    </button>

    <div v-if="showReply" class="mt-2 space-y-2">
      <textarea v-model="replyText" rows="2" placeholder="Viết trả lời..." class="w-full rounded-md border border-subtle bg-surface-3 px-3 py-2 text-sm" />
      <UiButton size="sm" variant="primary" :loading="submitting" @click="submitReply">Gửi</UiButton>
    </div>

    <ProductCommentItem
      v-for="reply in comment.replies || []"
      :key="reply.id"
      :comment="reply"
      :slug="slug"
      :depth="1"
      @updated="emit('updated')"
    />
  </div>
</template>
