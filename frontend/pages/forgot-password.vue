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
  toast.info(res.data?.message || 'Check your email if an account exists.');
}
</script>

<template>
  <UiCard padding="lg">
    <UiText as="h1" size="2xl" class="text-center mb-6">Forgot password</UiText>
    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <UiInput v-model="email" type="email" required placeholder="Email" />
        <p v-if="fieldErrors.email" class="text-danger text-xs mt-1">{{ fieldErrors.email }}</p>
      </div>
      <UiButton type="submit" variant="primary" block>Send reset link</UiButton>
    </form>
    <NuxtLink to="/login" class="block mt-4 text-center text-sm text-text-muted hover:text-accent">Back to login</NuxtLink>
  </UiCard>
</template>
