<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

definePageMeta({ layout: 'blank' });

const username = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const authStore = useAuthStore();
const toast = useToast();

async function handleRegister() {
  error.value = '';
  loading.value = true;
  try {
    await authStore.register(username.value, email.value, password.value);
    toast.success('Account created!');
    await navigateTo('/');
  } catch (e: any) {
    error.value = e.data?.message || 'Registration failed';
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UiCard padding="lg">
    <UiText as="h1" size="2xl" class="text-center mb-6">Register</UiText>
    <form class="space-y-4" @submit.prevent="handleRegister">
      <div>
        <UiText variant="muted" size="xs" uppercase class="mb-1 block">Username</UiText>
        <UiInput v-model="username" required />
      </div>
      <div>
        <UiText variant="muted" size="xs" uppercase class="mb-1 block">Email</UiText>
        <UiInput v-model="email" type="email" required />
      </div>
      <div>
        <UiText variant="muted" size="xs" uppercase class="mb-1 block">Password</UiText>
        <UiInput v-model="password" type="password" required />
      </div>
      <p v-if="error" class="text-danger text-sm">{{ error }}</p>
      <UiButton type="submit" variant="primary" block :loading="loading">Register</UiButton>
      <p class="text-center text-sm text-text-muted">
        Already have an account? <NuxtLink to="/login" class="text-accent">Login</NuxtLink>
      </p>
    </form>
  </UiCard>
</template>
