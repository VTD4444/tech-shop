<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();

const isServerError = computed(() => (props.error.statusCode ?? 500) >= 500);

function goHome() {
  clearError({ redirect: '/' });
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-surface-0">
    <UiContainer class="flex-1 flex flex-col items-center justify-center py-20 text-center">
      <UiText as="h1" size="4xl" class="mb-2">{{ error.statusCode || 500 }}</UiText>
      <UiText as="h2" size="xl" class="mb-4">
        {{ isServerError ? 'Đã xảy ra lỗi' : 'Không tìm thấy trang' }}
      </UiText>
      <UiText variant="muted" class="mb-8 max-w-md">
        {{
          isServerError
            ? 'Máy chủ có thể tạm thời không khả dụng. Bạn có thể về trang chủ và xem danh mục mẫu ngoại tuyến.'
            : error.message || 'Trang bạn yêu cầu không tồn tại.'
        }}
      </UiText>
      <div class="flex flex-wrap gap-3 justify-center">
        <UiButton variant="primary" @click="goHome">Về trang chủ</UiButton>
        <UiButton variant="secondary" to="/products">Xem sản phẩm</UiButton>
      </div>
    </UiContainer>
  </div>
</template>
