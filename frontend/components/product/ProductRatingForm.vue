<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { useToast } from '~/composables/useToast';
import { useCloudinaryUpload } from '~/composables/useCloudinaryUpload';

const props = defineProps<{
  slug: string;
  unratedOrders: { orderId: string; label: string }[];
}>();

const emit = defineEmits<{ submitted: [] }>();

const authStore = useAuthStore();
const toast = useToast();
const { $api } = useNuxtApp();
const { uploadFile, uploading } = useCloudinaryUpload('/uploads/sign');

const rating = ref(0);
const orderId = ref('');
const images = ref<string[]>([]);
const submitting = ref(false);

watch(
  () => props.unratedOrders,
  (orders) => {
    if (orders.length === 1) orderId.value = orders[0].orderId;
  },
  { immediate: true },
);

async function onImages(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (!files?.length) return;
  for (const file of Array.from(files).slice(0, 5 - images.value.length)) {
    try {
      images.value.push(await uploadFile(file));
    } catch {
      toast.error('Tải ảnh thất bại');
    }
  }
}

async function submit() {
  if (!authStore.isAuthenticated) return navigateTo('/login');
  if (!orderId.value || !rating.value) {
    toast.error('Chọn đơn hàng và số sao');
    return;
  }
  submitting.value = true;
  try {
    await $api(`/products/${props.slug}/ratings`, {
      method: 'POST',
      body: { rating: rating.value, orderId: orderId.value, images: images.value },
    });
    toast.success('Đã gửi đánh giá');
    rating.value = 0;
    images.value = [];
    emit('submitted');
  } catch (e: any) {
    const msg = extractApiMessage(e, 'Không thể gửi đánh giá');
    toast.error(msg);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <UiCard v-if="unratedOrders.length" padding="md" class="mb-6">
    <UiText as="h3" size="lg" class="mb-4">Đánh giá sản phẩm</UiText>
    <div class="space-y-4">
      <div v-if="unratedOrders.length > 1">
        <UiText variant="muted" size="xs" class="mb-1 block">Chọn đơn hàng</UiText>
        <select v-model="orderId" class="w-full rounded-md border border-subtle bg-surface-3 px-3 py-2 text-sm">
          <option value="" disabled>Chọn đơn hàng để đánh giá</option>
          <option v-for="o in unratedOrders" :key="o.orderId" :value="o.orderId">{{ o.label }}</option>
        </select>
      </div>
      <div>
        <UiText variant="muted" size="xs" class="mb-1 block">Số sao</UiText>
        <ProductRatingStars v-model="rating" label="Đánh giá của bạn" />
      </div>
      <div>
        <UiText variant="muted" size="xs" class="mb-1 block">Ảnh (tùy chọn)</UiText>
        <input type="file" accept="image/*" multiple class="text-sm" @change="onImages" />
        <ProductImageGallery :images="images" />
      </div>
      <UiButton variant="primary" :loading="submitting || uploading" @click="submit">Gửi đánh giá</UiButton>
    </div>
  </UiCard>
</template>
