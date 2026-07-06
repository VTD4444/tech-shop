<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { useAuthValidation } from '~/composables/useAuthValidation';

definePageMeta({ layout: 'blank' });

const fullName = ref('');
const email = ref('');
const phone = ref('');
const password = ref('');
const confirmPassword = ref('');
const fieldErrors = ref<Record<string, string>>({});
const error = ref('');
const loading = ref(false);
const authStore = useAuthStore();
const toast = useToast();
const {
  validateEmail,
  validatePassword,
  validateFullName,
  validatePhone,
  validateConfirmPassword,
} = useAuthValidation();

async function handleRegister() {
  error.value = '';
  fieldErrors.value = {};
  const fullNameErr = validateFullName(fullName.value);
  const emailErr = validateEmail(email.value);
  const phoneErr = validatePhone(phone.value);
  const passErr = validatePassword(password.value);
  const confirmErr = validateConfirmPassword(password.value, confirmPassword.value);
  if (fullNameErr) fieldErrors.value.fullName = fullNameErr;
  if (emailErr) fieldErrors.value.email = emailErr;
  if (phoneErr) fieldErrors.value.phone = phoneErr;
  if (passErr) fieldErrors.value.password = passErr;
  if (confirmErr) fieldErrors.value.confirmPassword = confirmErr;
  if (fullNameErr || emailErr || phoneErr || passErr || confirmErr) return;

  loading.value = true;
  try {
    await authStore.register({
      fullName: fullName.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      password: password.value,
      confirmPassword: confirmPassword.value,
    });
    toast.success('Tài khoản đã được tạo!');
    await navigateTo('/');
  } catch (e: any) {
    error.value = extractApiMessage(e, 'Đăng ký thất bại');
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UiCard padding="lg">
    <UiText as="h1" size="2xl" class="text-center mb-6">Đăng ký</UiText>
    <form class="space-y-4" @submit.prevent="handleRegister">
      <div>
        <UiText variant="muted" size="xs" uppercase class="mb-1 block">Họ tên</UiText>
        <UiInput v-model="fullName" required />
        <p v-if="fieldErrors.fullName" class="text-danger text-xs mt-1">{{ fieldErrors.fullName }}</p>
      </div>
      <div>
        <UiText variant="muted" size="xs" uppercase class="mb-1 block">Email</UiText>
        <UiInput v-model="email" type="email" required />
        <p v-if="fieldErrors.email" class="text-danger text-xs mt-1">{{ fieldErrors.email }}</p>
      </div>
      <div>
        <UiText variant="muted" size="xs" uppercase class="mb-1 block">Số điện thoại</UiText>
        <UiInput v-model="phone" type="tel" inputmode="numeric" placeholder="0901234567" required />
        <p v-if="fieldErrors.phone" class="text-danger text-xs mt-1">{{ fieldErrors.phone }}</p>
      </div>
      <div>
        <UiText variant="muted" size="xs" uppercase class="mb-1 block">Mật khẩu</UiText>
        <UiInput v-model="password" type="password" required />
        <p v-if="fieldErrors.password" class="text-danger text-xs mt-1">{{ fieldErrors.password }}</p>
      </div>
      <div>
        <UiText variant="muted" size="xs" uppercase class="mb-1 block">Nhập lại mật khẩu</UiText>
        <UiInput v-model="confirmPassword" type="password" required />
        <p v-if="fieldErrors.confirmPassword" class="text-danger text-xs mt-1">{{ fieldErrors.confirmPassword }}</p>
      </div>
      <p v-if="error" class="text-danger text-sm">{{ error }}</p>
      <UiButton type="submit" variant="primary" block :loading="loading">Đăng ký</UiButton>
      <p class="text-center text-sm text-fg-muted">
        Đã có tài khoản? <NuxtLink to="/login" class="text-accent">Đăng nhập</NuxtLink>
      </p>
    </form>
  </UiCard>
</template>
