<script setup lang="ts">
import { CheckCircle, XCircle } from 'lucide-vue-next';

const route = useRoute();
const { $api } = useNuxtApp();
const loading = ref(true);
const success = ref(false);
const message = ref('');
const txnRef = route.query.vnp_TxnRef as string;

try {
  if (txnRef) {
    const data: any = await $api(`/payments/vnpay/return-status?txnRef=${encodeURIComponent(txnRef)}`);
    success.value = data.data?.success || false;
    message.value = data.data?.message || '';
  } else {
    const data: any = await $api(`/payments/vnpay/return?${new URLSearchParams(route.query as any).toString()}`);
    success.value = data.data?.success || false;
    message.value = data.data?.message || '';
  }
} catch {
  success.value = false;
  message.value = 'Payment verification failed';
} finally {
  loading.value = false;
}
</script>

<template>
  <UiContainer size="narrow" class="py-16 text-center">
    <div v-if="loading"><UiSkeleton class="w-16 h-16 rounded-full mx-auto mb-4" /><UiSkeleton class="h-8 w-48 mx-auto" /></div>
    <UiCard v-else-if="success" padding="lg" class="text-center">
      <CheckCircle class="w-16 h-16 text-accent mx-auto mb-4" />
      <UiText as="h1" size="2xl" class="mb-2">Payment Successful!</UiText>
      <UiText variant="muted" class="mb-6">{{ message }}</UiText>
      <UiButton to="/orders" variant="primary">View Orders</UiButton>
    </UiCard>
    <UiCard v-else padding="lg" class="text-center">
      <XCircle class="w-16 h-16 text-danger mx-auto mb-4" />
      <UiText as="h1" size="2xl" class="mb-2">Payment Failed</UiText>
      <UiText variant="muted" class="mb-6">{{ message }}</UiText>
      <UiButton to="/cart" variant="primary">Back to Cart</UiButton>
    </UiCard>
  </UiContainer>
</template>
