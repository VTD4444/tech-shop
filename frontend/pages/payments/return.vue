<script setup lang="ts">
import { CheckCircle, XCircle, Clock } from 'lucide-vue-next';

const route = useRoute();
const { $api } = useNuxtApp();

const loading = ref(true);
const paid = ref(false);
const message = ref('');
const orderId = ref('');
const pendingIpn = ref(false);
const redirectStatus = (route.query.status as string) || '';
const invoiceFromQuery =
  (route.query.invoice as string) ||
  (route.query.order_invoice_number as string) ||
  '';
const invoiceFromSession =
  import.meta.client ? sessionStorage.getItem('sepay_pending_invoice') || '' : '';
const invoice = invoiceFromQuery || invoiceFromSession;

if (import.meta.client && invoiceFromSession) {
  sessionStorage.removeItem('sepay_pending_invoice');
}

function pendingPaymentMessage(): string {
  const isLocalhost =
    import.meta.client &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (isLocalhost) {
    return 'Thanh toán có thể vẫn đang xử lý. Trên localhost, SePay IPN không thể kết nối máy của bạn — hãy kiểm tra trạng thái đơn hàng sau giây lát hoặc dùng ngrok để thử IPN đầy đủ.';
  }
  return 'Giao dịch đang được xác nhận. Nếu bạn đã chuyển khoản, trạng thái sẽ cập nhật trong giây lát. Bạn có thể mở lại trang đơn hàng để kiểm tra.';
}

async function abandonIfNeeded() {
  if (!invoice) return;
  try {
    const res: any = await $api('/payments/sepay/abandon', {
      method: 'POST',
      body: { invoice },
    });
    if (res.data?.orderId) {
      orderId.value = res.data.orderId;
    }
  } catch {
    // Non-blocking — return page should still show cancel/error state.
  }
}

try {
  if (redirectStatus === 'cancel') {
    if (invoice) {
      const data: any = await $api(
        `/payments/sepay/status?invoice=${encodeURIComponent(invoice)}`,
      );
      orderId.value = data.data?.orderId || '';
      await abandonIfNeeded();
    }
    message.value =
      'Bạn đã hủy thanh toán. Đơn hàng vẫn chờ thanh toán — bạn có thể thanh toán lại bất cứ lúc nào.';
  } else if (redirectStatus === 'error') {
    if (invoice) {
      const data: any = await $api(
        `/payments/sepay/status?invoice=${encodeURIComponent(invoice)}`,
      );
      orderId.value = data.data?.orderId || '';
      await abandonIfNeeded();
    }
    message.value = 'Thanh toán thất bại hoặc bị từ chối. Bạn có thể thử thanh toán lại.';
  } else if (invoice) {
    const data: any = await $api(
      `/payments/sepay/status?invoice=${encodeURIComponent(invoice)}`,
    );
    paid.value = data.data?.paid || false;
    message.value = data.data?.message || '';
    orderId.value = data.data?.orderId || '';

    if (paid.value) {
      message.value = 'Cảm ơn bạn! Đơn hàng đã được thanh toán thành công.';
    } else if (
      redirectStatus === 'success' &&
      data.data?.txnStatus === 'processing'
    ) {
      pendingIpn.value = true;
      message.value = pendingPaymentMessage();
    } else if (data.data?.txnStatus === 'failed') {
      message.value = 'Thanh toán không thành công. Bạn có thể thử thanh toán lại.';
    }
  } else if (redirectStatus === 'success') {
    message.value = 'Thiếu mã hóa đơn thanh toán. Vui lòng kiểm tra trạng thái trong trang đơn hàng.';
  } else {
    message.value = 'Thiếu mã hóa đơn thanh toán.';
  }
} catch {
  paid.value = false;
  if (redirectStatus === 'cancel') {
    message.value =
      'Bạn đã hủy thanh toán. Vui lòng kiểm tra trạng thái đơn hàng.';
  } else {
    message.value = 'Xác minh thanh toán thất bại';
  }
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
    <UiCard v-else-if="paid" padding="lg" class="text-center">
      <CheckCircle class="w-16 h-16 text-accent mx-auto mb-4" />
      <UiText as="h1" size="2xl" class="mb-2">Thanh toán thành công!</UiText>
      <UiText variant="muted" class="mb-6">{{ message }}</UiText>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <UiButton v-if="orderId" :to="`/orders/${orderId}`" variant="primary">
          Xem đơn hàng #{{ orderId }}
        </UiButton>
        <UiButton to="/orders" variant="secondary">Tất cả đơn hàng</UiButton>
      </div>
    </UiCard>
    <UiCard v-else-if="pendingIpn" padding="lg" class="text-center">
      <Clock class="w-16 h-16 text-warning mx-auto mb-4" />
      <UiText as="h1" size="2xl" class="mb-2">Đang xác nhận thanh toán</UiText>
      <UiText variant="muted" class="mb-6">{{ message }}</UiText>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <UiButton v-if="orderId" :to="`/orders/${orderId}`" variant="primary">
          Xem đơn hàng #{{ orderId }}
        </UiButton>
        <UiButton to="/orders" variant="secondary">Tất cả đơn hàng</UiButton>
      </div>
    </UiCard>
    <UiCard v-else padding="lg" class="text-center">
      <XCircle class="w-16 h-16 text-danger mx-auto mb-4" />
      <UiText as="h1" size="2xl" class="mb-2">
        {{ redirectStatus === 'cancel' ? 'Đã hủy thanh toán' : 'Thanh toán chưa hoàn tất' }}
      </UiText>
      <UiText variant="muted" class="mb-6">{{ message }}</UiText>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <UiButton v-if="orderId" :to="`/orders/${orderId}`" variant="primary">
          Thanh toán lại · Đơn #{{ orderId }}
        </UiButton>
        <UiButton to="/orders" variant="secondary">Tất cả đơn hàng</UiButton>
      </div>
    </UiCard>
  </UiContainer>
</template>
