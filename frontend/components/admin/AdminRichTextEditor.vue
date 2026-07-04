<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useCloudinaryUpload } from '~/composables/useCloudinaryUpload';

const model = defineModel<string>({ default: '' });
const preview = ref(false);
const { uploadFile, uploading } = useCloudinaryUpload('/admin/uploads/sign');

const editor = useEditor({
  content: model.value || '',
  extensions: [
    StarterKit,
    Image.configure({ allowBase64: false }),
  ],
  onUpdate: ({ editor: e }) => {
    model.value = e.getHTML();
  },
});

watch(model, (val) => {
  if (editor.value && val !== editor.value.getHTML()) {
    editor.value.commands.setContent(val || '', false);
  }
});

async function onImagePick() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file || !editor.value) return;
    try {
      const url = await uploadFile(file);
      editor.value.chain().focus().setImage({ src: url }).run();
    } catch {
      // toast handled by parent if needed
    }
  };
  input.click();
}

onBeforeUnmount(() => editor.value?.destroy());
</script>

<template>
  <div class="border border-subtle rounded-lg overflow-hidden">
    <div class="flex items-center gap-2 border-b border-subtle bg-surface-2 px-3 py-2">
      <button type="button" class="text-xs px-2 py-1 rounded" :class="!preview ? 'bg-accent text-white' : 'text-text-muted'" @click="preview = false">Sửa</button>
      <button type="button" class="text-xs px-2 py-1 rounded" :class="preview ? 'bg-accent text-white' : 'text-text-muted'" @click="preview = true">Xem trước</button>
      <template v-if="!preview">
        <button type="button" class="text-xs text-text-muted hover:text-accent" @click="editor?.chain().focus().toggleBold().run()">B</button>
        <button type="button" class="text-xs text-text-muted hover:text-accent italic" @click="editor?.chain().focus().toggleItalic().run()">I</button>
        <button type="button" class="text-xs text-text-muted hover:text-accent" :disabled="uploading" @click="onImagePick">Ảnh</button>
      </template>
      <span class="ml-auto text-xs text-text-muted">{{ (model || '').length }} / 50000</span>
    </div>
    <div v-if="preview" class="prose prose-sm max-w-none p-4 min-h-[160px] product-long-description" v-html="model" />
    <EditorContent v-else :editor="editor" class="tiptap-editor min-h-[160px] p-4 text-sm" />
  </div>
</template>

<style>
.tiptap-editor .ProseMirror { outline: none; min-height: 140px; }
.tiptap-editor .ProseMirror img { max-width: 100%; border-radius: 0.5rem; }
</style>
