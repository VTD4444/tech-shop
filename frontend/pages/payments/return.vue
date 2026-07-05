<script setup lang="ts">
import { CircleCheck, CircleX, Clock } from 'lucide-vue-next';

definePageMeta({ ssr: false });

const route = useRoute();
const { $api } = useNuxtApp();

type PaymentView = 'success' | 'pending' | 'cancel' | 'error' | 'failed';

const loading = ref(true);
const view = ref<PaymentView>('failed');
const message = ref('');
const orderId = ref('');
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

async function fetchPaymentStatus() {
  const data: any = await $api(
    `/payments/sepay/status?invoice=${encodeURIComponent(invoice)}`,
  );
  orderId.value = data.data?.orderId || '';
  return data.data ?? {};
}

try {
  if (invoice) {
    const status = await fetchPaymentStatus();

    if (status.paid) {
      view.value = 'success';
      message.value = 'Cảm ơn bạn! Đơn hàng đã được thanh toán thành công.';
    } else if (redirectStatus === 'cancel') {
      await abandonIfNeeded();
      view.value = 'cancel';
      message.value =
        'Bạn đã hủy thanh toán. Đơn hàng vẫn chờ thanh toán — bạn có thể thanh toán lại bất cứ lúc nào.';
    } else if (redirectStatus === 'error') {
      await abandonIfNeeded();
      view.value = 'error';
      message.value = 'Thanh toán thất bại hoặc bị từ chối. Bạn có thể thử thanh toán lại.';
    } else if (redirectStatus === 'success' && status.txnStatus === 'processing') {
      view.value = 'pending';
      message.value = pendingPaymentMessage();
    } else if (status.txnStatus === 'failed') {
      view.value = 'failed';
      message.value = 'Thanh toán không thành công. Bạn có thể thử thanh toán lại.';
    } else {
      view.value = 'failed';
      message.value = status.message || 'Thanh toán chưa hoàn tất.';
    }
  } else if (redirectStatus === 'cancel') {
    view.value = 'cancel';
    message.value =
      'Bạn đã hủy thanh toán. Vui lòng kiểm tra trạng thái đơn hàng.';
  } else if (redirectStatus === 'error') {
    view.value = 'error';
    message.value = 'Thanh toán thất bại hoặc bị từ chối.';
  } else if (redirectStatus === 'success') {
    view.value = 'pending';
    message.value =
      'Thiếu mã hóa đơn thanh toán. Vui lòng kiểm tra trạng thái trong trang đơn hàng.';
  } else {
    view.value = 'failed';
    message.value = 'Thiếu mã hóa đơn thanh toán.';
  }
} catch {
  if (redirectStatus === 'cancel') {
    view.value = 'cancel';
    message.value =
      'Bạn đã hủy thanh toán. Vui lòng kiểm tra trạng thái đơn hàng.';
  } else {
    view.value = 'failed';
    message.value = 'Xác minh thanh toán thất bại';
  }
} finally {
  loading.value = false;
}

const pageTitle = computed(() => {
  switch (view.value) {
    case 'success':
      return 'Thanh toán thành công!';
    case 'pending':
      return 'Đang xác nhận thanh toán';
    case 'cancel':
      return 'Đã hủy thanh toán';
    default:
      return 'Thanh toán chưa hoàn tất';
  }
});
</script>

<template>
  <UiContainer size="narrow" class="py-16 text-center">
    <div v-if="loading">
      <UiSkeleton class="w-16 h-16 rounded-full mx-auto mb-4" />
      <UiSkeleton class="h-8 w-48 mx-auto" />
    </div>
    <UiCard v-else padding="lg" class="text-center">
      <CircleCheck
        v-if="view === 'success'"
        class="w-16 h-16 text-emerald-500 mx-auto mb-4"
        aria-hidden="true"
      />
      <Clock
        v-else-if="view === 'pending'"
        class="w-16 h-16 text-warning mx-auto mb-4"
        aria-hidden="true"
      />
      <CircleX
        v-else
        class="w-16 h-16 text-danger mx-auto mb-4"
        aria-hidden="true"
      />
      <UiText as="h1" size="2xl" class="mb-2">{{ pageTitle }}</UiText>
      <UiText variant="muted" class="mb-6">{{ message }}</UiText>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <UiButton v-if="orderId" :to="`/orders/${orderId}`" variant="primary">
          {{
            view === 'success'
              ? `Xem đơn hàng #${orderId}`
              : `Thanh toán lại · Đơn #${orderId}`
          }}
        </UiButton>
        <UiButton to="/orders" variant="secondary">Tất cả đơn hàng</UiButton>
      </div>
    </UiCard>
  </UiContainer>
</template>
