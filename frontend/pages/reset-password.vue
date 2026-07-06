<script setup lang="ts">
import { useAuthValidation } from '~/composables/useAuthValidation';

definePageMeta({ layout: 'blank' });

const route = useRoute();
const password = ref('');
const fieldErrors = ref<Record<string, string>>({});
const error = ref('');
const { $api } = useNuxtApp();
const toast = useToast();
const { validatePassword } = useAuthValidation();
const token = route.query.token as string;

async function submit() {
  fieldErrors.value = {};
  error.value = '';
  const passErr = validatePassword(password.value);
  if (passErr) {
    fieldErrors.value.password = passErr;
    return;
  }
  if (!token) {
    error.value = 'Token đặt lại không hợp lệ hoặc bị thiếu';
    return;
  }
  try {
    await $api('/auth/reset-password', { method: 'POST', body: { token, password: password.value } });
    toast.success('Mật khẩu đã được cập nhật');
    navigateTo('/login');
  } catch (e: any) {
    error.value = extractApiMessage(e, 'Đặt lại mật khẩu thất bại');
    toast.error(error.value);
  }
}
</script>

<template>
  <UiCard padding="lg">
    <UiText as="h1" size="2xl" class="text-center mb-6">Đặt lại mật khẩu</UiText>
    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <UiInput v-model="password" type="password" required minlength="6" placeholder="Mật khẩu mới" />
        <p v-if="fieldErrors.password" class="text-danger text-xs mt-1">{{ fieldErrors.password }}</p>
      </div>
      <p v-if="error" class="text-danger text-sm">{{ error }}</p>
      <UiButton type="submit" variant="primary" block>Cập nhật mật khẩu</UiButton>
    </form>
  </UiCard>
</template>
