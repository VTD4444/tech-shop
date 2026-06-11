<script setup lang="ts">
definePageMeta({ layout: 'blank' });

const email = ref('');
const message = ref('');
const { $api } = useNuxtApp();
const toast = useToast();

async function submit() {
  const res: any = await $api('/auth/forgot-password', { method: 'POST', body: { email: email.value } });
  message.value = res.data?.message || 'Check your email if an account exists.';
  toast.info(message.value);
}
</script>

<template>
  <UiCard padding="lg">
    <UiText as="h1" size="2xl" class="text-center mb-6">Forgot password</UiText>
    <form class="space-y-4" @submit.prevent="submit">
      <UiInput v-model="email" type="email" required placeholder="Email" />
      <UiButton type="submit" variant="primary" block>Send reset link</UiButton>
    </form>
    <p v-if="message" class="mt-4 text-accent text-sm text-center">{{ message }}</p>
    <NuxtLink to="/login" class="block mt-4 text-center text-sm text-text-muted hover:text-accent">Back to login</NuxtLink>
  </UiCard>
</template>
