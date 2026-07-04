<script setup lang="ts">
import { useToast } from '~/composables/useToast';
import { useCloudinaryUpload } from '~/composables/useCloudinaryUpload';
import {
  pcComponentFromInitial,
  buildPcComponentPayload,
} from '~/utils/pcComponentSpecs';

const props = defineProps<{ initial?: Record<string, any> }>();
const emit = defineEmits<{ submit: [payload: Record<string, unknown>] }>();

const { uploading, error: uploadError, uploadFile } = useCloudinaryUpload();
const toast = useToast();

const form = reactive({
  name: props.initial?.name || '',
  slug: props.initial?.slug || '',
  price: props.initial?.price || 0,
  stockQuantity: props.initial?.stockQuantity || 0,
  description: props.initial?.description || '',
  isPcComponent: props.initial?.isPcComponent || false,
  status: props.initial?.status || 'active',
});

const longDescription = ref(props.initial?.longDescription || '');
const productSpec = ref<Record<string, any>>({ ...(props.initial?.spec || {}) });
const pcComponent = ref<Record<string, string | number>>(pcComponentFromInitial(props.initial?.pcComponent));

const imagePreview = ref(props.initial?.imageUrl || '');
const images = ref<{ url: string; isMain: boolean; sortOrder: number }[]>(
  props.initial?.imageUrl ? [{ url: props.initial.imageUrl, isMain: true, sortOrder: 0 }] : [],
);

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    const url = await uploadFile(file);
    imagePreview.value = url;
    images.value = [{ url, isMain: true, sortOrder: 0 }];
    toast.success('Đã tải ảnh lên');
  } catch {
    toast.error('Tải ảnh thất bại');
  }
}

function onSubmit() {
  if (form.isPcComponent && !pcComponent.value.componentType) {
    toast.error('Chọn loại linh kiện PC và điền thông số bắt buộc');
    return;
  }
  if ((longDescription.value || '').length > 50000) {
    toast.error('Mô tả chi tiết vượt quá 50.000 ký tự');
    return;
  }

  emit('submit', {
    ...form,
    longDescription: longDescription.value || null,
    spec: productSpec.value,
    images: images.value.length ? images.value : undefined,
    pcComponent: form.isPcComponent ? buildPcComponentPayload(pcComponent.value) : undefined,
    isPcComponent: form.isPcComponent,
  });
}
</script>

<template>
  <UiCard padding="md" class="max-w-3xl">
    <form class="space-y-4" @submit.prevent="onSubmit">
      <div>
        <UiText variant="muted" size="xs" uppercase class="mb-1 block">Tên</UiText>
        <UiInput v-model="form.name" required />
      </div>
      <div>
        <UiText variant="muted" size="xs" uppercase class="mb-1 block">Đường dẫn</UiText>
        <UiInput v-model="form.slug" required />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <UiText variant="muted" size="xs" uppercase class="mb-1 block">Giá (VND)</UiText>
          <UiInput v-model="form.price" type="number" required />
        </div>
        <div>
          <UiText variant="muted" size="xs" uppercase class="mb-1 block">Tồn kho</UiText>
          <UiInput v-model="form.stockQuantity" type="number" />
        </div>
      </div>
      <div>
        <UiText variant="muted" size="xs" uppercase class="mb-1 block">Mô tả ngắn</UiText>
        <textarea v-model="form.description" rows="3" class="w-full rounded-md border border-subtle bg-surface-3 px-4 py-2.5 text-sm text-text-primary" />
      </div>
      <div>
        <UiText variant="muted" size="xs" uppercase class="mb-1 block">Mô tả chi tiết</UiText>
        <ClientOnly>
          <AdminRichTextEditor v-model="longDescription" />
        </ClientOnly>
      </div>

      <AdminProductSpecFields v-model="productSpec" />

      <div>
        <UiText variant="muted" size="xs" uppercase class="mb-1 block">Ảnh</UiText>
        <input type="file" accept="image/*" class="text-sm text-text-muted" @change="onFile" />
        <img v-if="imagePreview" :src="imagePreview" class="mt-2 h-24 object-cover rounded-lg border border-subtle" />
        <p v-if="uploadError" class="text-danger text-sm mt-1">{{ uploadError }}</p>
      </div>

      <UiCheckbox v-model="form.isPcComponent" label="Linh kiện PC (PC Builder)" />
      <AdminPcComponentFields v-model="pcComponent" :enabled="form.isPcComponent" />

      <UiButton type="submit" variant="primary" :loading="uploading">Lưu</UiButton>
    </form>
  </UiCard>
</template>
