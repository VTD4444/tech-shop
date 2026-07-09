<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { useAuthValidation } from '~/composables/useAuthValidation';

definePageMeta({ layout: 'blank' });

const config = useRuntimeConfig();
const googleAuthUrl = `${config.public.apiBaseUrl}/auth/google`;

const email = ref('');
const password = ref('');
const fieldErrors = ref<Record<string, string>>({});
const error = ref('');
const loading = ref(false);
const authStore = useAuthStore();
const toast = useToast();
const { validateEmail, validatePassword } = useAuthValidation();

const route = useRoute();

async function redirectAfterLogin() {
  const target = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
    ? route.query.redirect
    : '/';
  await navigateTo(target);
}

async function handleLogin() {
  error.value = '';
  fieldErrors.value = {};
  const emailErr = validateEmail(email.value);
  const passErr = validatePassword(password.value);
  if (emailErr) fieldErrors.value.email = emailErr;
  if (passErr) fieldErrors.value.password = passErr;
  if (emailErr || passErr) return;

  loading.value = true;
  try {
    await authStore.login(email.value, password.value);
    toast.success('Chào mừng trở lại!');
    await redirectAfterLogin();
  } catch (e: any) {
    error.value = extractApiMessage(e, 'Đăng nhập thất bại');
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UiCard padding="lg">
    <UiText as="h1" size="2xl" class="text-center mb-6">Đăng nhập</UiText>
    <form class="space-y-4" @submit.prevent="handleLogin">
      <div>
        <UiText variant="muted" size="xs" uppercase class="mb-1 block">Email</UiText>
        <UiInput v-model="email" type="email" required />
        <p v-if="fieldErrors.email" class="text-danger text-xs mt-1">{{ fieldErrors.email }}</p>
      </div>
      <div>
        <UiText variant="muted" size="xs" uppercase class="mb-1 block">Mật khẩu</UiText>
        <UiInput v-model="password" type="password" required />
        <p v-if="fieldErrors.password" class="text-danger text-xs mt-1">{{ fieldErrors.password }}</p>
      </div>
      <p v-if="error" class="text-danger text-sm">{{ error }}</p>
      <UiButton type="submit" variant="primary" block :loading="loading">Đăng nhập</UiButton>

      <div class="relative py-2">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-subtle" />
        </div>
        <div class="relative flex justify-center text-xs uppercase">
          <span class="bg-surface-1 px-2 text-fg-muted">hoặc</span>
        </div>
      </div>

      <a
        :href="googleAuthUrl"
        class="flex items-center justify-center gap-2 w-full rounded-lg border border-subtle bg-surface-2 px-4 py-2.5 text-sm font-medium text-fg hover:bg-surface-3 transition-colors"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Đăng nhập với Google
      </a>

      <p class="text-center text-sm text-fg-muted">
        <NuxtLink to="/forgot-password" class="text-accent hover:underline">Quên mật khẩu?</NuxtLink>
      </p>
      <p class="text-center text-sm text-fg-muted">
        Chưa có tài khoản? <NuxtLink to="/register" class="text-accent">Đăng ký</NuxtLink>
      </p>
    </form>
  </UiCard>
</template>
