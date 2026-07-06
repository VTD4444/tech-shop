<script setup lang="ts">
import { useAuthValidation } from '~/composables/useAuthValidation';

definePageMeta({ layout: 'blank' });

const email = ref('');
const fieldErrors = ref<Record<string, string>>({});
const loading = ref(false);
const { $api } = useNuxtApp();
const toast = useToast();
const { validateEmail } = useAuthValidation();

async function submit() {
  fieldErrors.value = {};
  const emailErr = validateEmail(email.value);
  if (emailErr) {
    fieldErrors.value.email = emailErr;
    return;
  }

  loading.value = true;
  try {
    const res: any = await $api('/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value.trim().toLowerCase() },
    });
    toast.info(
      res.data?.message ||
        'Nếu email đã đăng ký, bạn sẽ nhận liên kết đặt lại mật khẩu trong vài phút.',
    );
    email.value = '';
  } catch (e: any) {
    toast.error(e?.data?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại sau.');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UiCard padding="lg">
    <UiText as="h1" size="2xl" class="text-center mb-2">Quên mật khẩu</UiText>
    <UiText variant="muted" size="sm" class="text-center mb-6 block">
      Nhập email đã đăng ký. Chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
    </UiText>
    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <UiInput
          v-model="email"
          type="email"
          required
          placeholder="Email"
          autocomplete="email"
        />
        <p v-if="fieldErrors.email" class="text-danger text-xs mt-1">{{ fieldErrors.email }}</p>
      </div>
      <UiButton type="submit" variant="primary" block :loading="loading">
        Gửi liên kết đặt lại
      </UiButton>
    </form>
    <NuxtLink to="/login" class="block mt-4 text-center text-sm text-fg-muted hover:text-accent">
      Quay lại đăng nhập
    </NuxtLink>
  </UiCard>
</template>
