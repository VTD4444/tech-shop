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
    error.value = 'Invalid or missing reset token';
    return;
  }
  try {
    await $api('/auth/reset-password', { method: 'POST', body: { token, password: password.value } });
    toast.success('Password updated');
    navigateTo('/login');
  } catch (e: any) {
    error.value = e?.data?.message || 'Reset failed';
    toast.error(error.value);
  }
}
</script>

<template>
  <UiCard padding="lg">
    <UiText as="h1" size="2xl" class="text-center mb-6">Reset password</UiText>
    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <UiInput v-model="password" type="password" required minlength="6" placeholder="New password" />
        <p v-if="fieldErrors.password" class="text-danger text-xs mt-1">{{ fieldErrors.password }}</p>
      </div>
      <p v-if="error" class="text-danger text-sm">{{ error }}</p>
      <UiButton type="submit" variant="primary" block>Update password</UiButton>
    </form>
  </UiCard>
</template>
