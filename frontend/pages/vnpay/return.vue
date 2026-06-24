<script setup lang="ts">
import { CheckCircle, XCircle } from 'lucide-vue-next';

const route = useRoute();
const { $api } = useNuxtApp();
const loading = ref(true);
const success = ref(false);
const message = ref('');
const orderId = ref('');
const pendingIpn = ref(false);
const txnRef = route.query.vnp_TxnRef as string;

try {
  let data: any;
  if (txnRef) {
    data = await $api(`/payments/vnpay/return-status?txnRef=${encodeURIComponent(txnRef)}`);
  } else {
    data = await $api(`/payments/vnpay/return?${new URLSearchParams(route.query as any).toString()}`);
  }
  success.value = data.data?.success || false;
  message.value = data.data?.message || '';
  orderId.value = data.data?.orderId || '';

  if (!success.value && txnRef && data.data?.txnStatus === 'processing') {
    pendingIpn.value = true;
    message.value =
      'Payment may still be processing. On localhost, VNPay IPN cannot reach your machine — check order status in a moment or use ngrok for full IPN testing.';
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
    <div v-if="loading">
      <UiSkeleton class="w-16 h-16 rounded-full mx-auto mb-4" />
      <UiSkeleton class="h-8 w-48 mx-auto" />
    </div>
    <UiCard v-else-if="success" padding="lg" class="text-center">
      <CheckCircle class="w-16 h-16 text-accent mx-auto mb-4" />
      <UiText as="h1" size="2xl" class="mb-2">Payment Successful!</UiText>
      <UiText variant="muted" class="mb-6">{{ message }}</UiText>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <UiButton v-if="orderId" :to="`/orders/${orderId}`" variant="primary">
          View Order #{{ orderId }}
        </UiButton>
        <UiButton to="/orders" variant="secondary">All Orders</UiButton>
      </div>
    </UiCard>
    <UiCard v-else padding="lg" class="text-center">
      <XCircle class="w-16 h-16 text-danger mx-auto mb-4" />
      <UiText as="h1" size="2xl" class="mb-2">{{ pendingIpn ? 'Payment Pending' : 'Payment Failed' }}</UiText>
      <UiText variant="muted" class="mb-6">{{ message }}</UiText>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <UiButton v-if="orderId" :to="`/orders/${orderId}`" variant="primary">
          View Order #{{ orderId }}
        </UiButton>
        <UiButton to="/cart" variant="secondary">Back to Cart</UiButton>
      </div>
    </UiCard>
  </UiContainer>
</template>
