<script setup lang="ts">
import { useAuthValidation } from '~/composables/useAuthValidation';

definePageMeta({ layout: 'blank' });

const email = ref('');
const fieldErrors = ref<Record<string, string>>({});
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
  const res: any = await $api('/auth/forgot-password', { method: 'POST', body: { email: email.value } });
  toast.info(res.data?.message || 'Vui lòng kiểm tra email nếu tài khoản tồn tại.');
}
</script>

<template>
  <UiCard padding="lg">
    <UiText as="h1" size="2xl" class="text-center mb-6">Quên mật khẩu</UiText>
    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <UiInput v-model="email" type="email" required placeholder="Email" />
        <p v-if="fieldErrors.email" class="text-danger text-xs mt-1">{{ fieldErrors.email }}</p>
      </div>
      <UiButton type="submit" variant="primary" block>Gửi liên kết đặt lại</UiButton>
    </form>
    <NuxtLink to="/login" class="block mt-4 text-center text-sm text-text-muted hover:text-accent">Quay lại đăng nhập</NuxtLink>
  </UiCard>
</template>
