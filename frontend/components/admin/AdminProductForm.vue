<script setup lang="ts">
import { useToast } from '~/composables/useToast';
import { useCloudinaryUpload } from '~/composables/useCloudinaryUpload';
import {
  pcComponentFromInitial,
  buildPcComponentPayload,
} from '~/utils/pcComponentSpecs';

const props = defineProps<{
  initial?: Record<string, any>;
  submitLabel?: string;
}>();
const emit = defineEmits<{ submit: [payload: Record<string, unknown>] }>();

const { uploading, error: uploadError, uploadFile } = useCloudinaryUpload();
const toast = useToast();

const form = reactive({
  name: props.initial?.name || '',
  slug: props.initial?.slug || '',
  price: props.initial?.price || 0,
  stockQuantity: props.initial?.stockQuantity || 0,
  description: props.initial?.description || '',
  categoryId: props.initial?.categoryId ? String(props.initial.categoryId) : '',
  brandId: props.initial?.brandId ? String(props.initial.brandId) : '',
  isPcComponent: props.initial?.isPcComponent || false,
  status: props.initial?.status || 'active',
});

const { $api } = useNuxtApp();
const categories = ref<{ label: string; value: string }[]>([]);
const brands = ref<{ label: string; value: string }[]>([]);

function flattenCategories(items: any[], prefix = ''): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  for (const item of items) {
    out.push({ label: `${prefix}${item.name}`, value: String(item.id) });
    if (item.children?.length) {
      out.push(...flattenCategories(item.children, `${prefix}— `));
    }
  }
  return out;
}

onMounted(async () => {
  try {
    const [catRes, brandRes]: any[] = await Promise.all([
      $api('/categories'),
      $api('/brands'),
    ]);
    categories.value = flattenCategories(catRes.data || []);
    brands.value = (brandRes.data || []).map((b: any) => ({
      label: b.name,
      value: String(b.id),
    }));
  } catch {
    toast.error('Không tải được danh mục hoặc thương hiệu');
  }
});

const longDescription = ref(props.initial?.longDescription || '');
const productSpec = ref<Record<string, any>>({ ...(props.initial?.spec || {}) });
const pcComponent = ref<Record<string, string | number>>(
  pcComponentFromInitial(props.initial?.pcComponent),
);

const imagePreview = ref(props.initial?.imageUrl || '');
const images = ref<{ url: string; isMain: boolean; sortOrder: number }[]>(
  props.initial?.imageUrl ? [{ url: props.initial.imageUrl, isMain: true, sortOrder: 0 }] : [],
);

const statusOptions = [
  { label: 'Đang bán', value: 'active' },
  { label: 'Ngừng kinh doanh', value: 'discontinued' },
];

async function onFileSelected(file: File) {
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
    categoryId: form.categoryId || undefined,
    brandId: form.brandId || undefined,
    longDescription: longDescription.value || null,
    spec: productSpec.value,
    images: images.value.length ? images.value : undefined,
    pcComponent: form.isPcComponent ? buildPcComponentPayload(pcComponent.value) : undefined,
    isPcComponent: form.isPcComponent,
  });
}
</script>

<template>
  <form class="grid lg:grid-cols-3 gap-6 items-start" @submit.prevent="onSubmit">
    <!-- Main column -->
    <div class="lg:col-span-2 space-y-6">
      <UiCard padding="md">
        <UiText as="h2" size="lg" class="mb-4 pb-3 border-b border-subtle">
          Thông tin cơ bản
        </UiText>
        <div class="space-y-4">
          <UiFormField label="Tên" required>
            <UiInput v-model="form.name" required placeholder="Tên sản phẩm" />
          </UiFormField>
          <UiFormField label="Đường dẫn" required hint="Slug dùng trong URL, ví dụ: samsung-galaxy-book-4-pro">
            <UiInput v-model="form.slug" required placeholder="ten-san-pham" />
          </UiFormField>
          <UiFormField label="Mô tả ngắn">
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="Mô tả hiển thị trên thẻ sản phẩm..."
              class="w-full rounded-md border border-subtle bg-surface-3 px-4 py-2.5 text-sm text-fg placeholder:text-fg-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </UiFormField>
        </div>
      </UiCard>

      <UiCard padding="md">
        <UiText as="h2" size="lg" class="mb-4 pb-3 border-b border-subtle">
          Mô tả chi tiết
        </UiText>
        <ClientOnly>
          <AdminRichTextEditor v-model="longDescription" />
          <template #fallback>
            <UiSkeleton class="h-40 w-full rounded-lg" />
          </template>
        </ClientOnly>
      </UiCard>

      <AdminProductSpecFields v-model="productSpec" />

      <AdminPcComponentFields v-if="form.isPcComponent" v-model="pcComponent" :enabled="true" />
    </div>

    <!-- Sidebar -->
    <div class="space-y-6 lg:sticky lg:top-6">
      <UiCard padding="md">
        <UiText as="h2" size="lg" class="mb-4 pb-3 border-b border-subtle">
          Ảnh sản phẩm
        </UiText>
        <UiFileUpload
          :preview-url="imagePreview"
          :loading="uploading"
          :error="uploadError"
          hint="Ảnh chính hiển thị trên trang sản phẩm và danh sách"
          @change="onFileSelected"
        />
      </UiCard>

      <UiCard padding="md">
        <UiText as="h2" size="lg" class="mb-4 pb-3 border-b border-subtle">
          Phân loại
        </UiText>
        <div class="space-y-4">
          <UiFormField label="Danh mục">
            <UiSelect
              v-model="form.categoryId"
              :options="[{ label: '— Không chọn —', value: '' }, ...categories]"
              placeholder="Chọn danh mục"
            />
          </UiFormField>
          <UiFormField label="Thương hiệu">
            <UiSelect
              v-model="form.brandId"
              :options="[{ label: '— Không chọn —', value: '' }, ...brands]"
              placeholder="Chọn thương hiệu"
            />
          </UiFormField>
          <UiText v-if="!brands.length" variant="muted" size="xs">
            Chưa có thương hiệu —
            <NuxtLink to="/admin/brands" class="text-accent hover:underline">thêm tại đây</NuxtLink>
          </UiText>
        </div>
      </UiCard>

      <UiCard padding="md">
        <UiText as="h2" size="lg" class="mb-4 pb-3 border-b border-subtle">
          Giá & tồn kho
        </UiText>
        <div class="space-y-4">
          <UiFormField label="Giá (VND)" required>
            <UiInput v-model="form.price" type="number" required min="0" />
          </UiFormField>
          <UiFormField label="Tồn kho">
            <UiInput v-model="form.stockQuantity" type="number" min="0" />
          </UiFormField>
          <UiFormField label="Trạng thái">
            <UiSelect v-model="form.status" :options="statusOptions" />
          </UiFormField>
        </div>
      </UiCard>

      <UiCard padding="md">
        <UiText as="h2" size="lg" class="mb-4 pb-3 border-b border-subtle">
          Tùy chọn
        </UiText>
        <UiCheckbox
          v-model="form.isPcComponent"
          label="Linh kiện PC (PC Builder)"
          description="Bật để cấu hình thông số tương thích PC Builder"
        />
      </UiCard>

      <UiButton type="submit" variant="primary" block :loading="uploading">
        {{ submitLabel || 'Lưu sản phẩm' }}
      </UiButton>
    </div>
  </form>
</template>
