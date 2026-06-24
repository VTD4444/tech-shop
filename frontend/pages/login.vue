<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { useAuthValidation } from '~/composables/useAuthValidation';

definePageMeta({ layout: 'blank' });

const email = ref('');
const password = ref('');
const fieldErrors = ref<Record<string, string>>({});
const error = ref('');
const loading = ref(false);
const authStore = useAuthStore();
const toast = useToast();
const { validateEmail, validatePassword } = useAuthValidation();

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
    toast.success('Welcome back!');
    await navigateTo('/');
  } catch (e: any) {
    error.value = e.data?.message || 'Login failed';
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UiCard padding="lg">
    <UiText as="h1" size="2xl" class="text-center mb-6">Login</UiText>
    <form class="space-y-4" @submit.prevent="handleLogin">
      <div>
        <UiText variant="muted" size="xs" uppercase class="mb-1 block">Email</UiText>
        <UiInput v-model="email" type="email" required />
        <p v-if="fieldErrors.email" class="text-danger text-xs mt-1">{{ fieldErrors.email }}</p>
      </div>
      <div>
        <UiText variant="muted" size="xs" uppercase class="mb-1 block">Password</UiText>
        <UiInput v-model="password" type="password" required />
        <p v-if="fieldErrors.password" class="text-danger text-xs mt-1">{{ fieldErrors.password }}</p>
      </div>
      <p v-if="error" class="text-danger text-sm">{{ error }}</p>
      <UiButton type="submit" variant="primary" block :loading="loading">Login</UiButton>
      <p class="text-center text-sm">
        <NuxtLink to="/forgot-password" class="text-accent hover:underline">Forgot password?</NuxtLink>
      </p>
      <p class="text-center text-sm text-text-muted">
        Don't have an account? <NuxtLink to="/register" class="text-accent">Register</NuxtLink>
      </p>
    </form>
  </UiCard>
</template>
