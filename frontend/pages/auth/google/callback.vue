<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

definePageMeta({ layout: 'blank', ssr: false });

const route = useRoute();
const authStore = useAuthStore();
const toast = useToast();

const loading = ref(true);
const error = ref('');
const handled = ref(false);

onMounted(async () => {
  if (handled.value) return;
  handled.value = true;

  const code = route.query.code as string | undefined;
  if (!code) {
    error.value = 'Thiếu mã xác thực Google';
    loading.value = false;
    return;
  }

  try {
    await authStore.completeGoogleAuth(code);
    toast.success('Đăng nhập Google thành công!');
    await navigateTo('/', { replace: true });
  } catch (e: any) {
    error.value = extractApiMessage(e, 'Đăng nhập Google thất bại');
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <UiContainer size="narrow" class="py-16 text-center">
    <UiCard padding="lg">
      <UiText v-if="loading" variant="muted">Đang hoàn tất đăng nhập Google...</UiText>
      <template v-else-if="error">
        <UiText variant="danger" class="mb-4">{{ error }}</UiText>
        <UiButton to="/login" variant="primary">Quay lại đăng nhập</UiButton>
      </template>
    </UiCard>
  </UiContainer>
</template>
