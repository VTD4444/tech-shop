<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] });

const { $api } = useNuxtApp();
const { formatPrice } = useFormatPrice();
const toast = useToast();
const orders = ref<any[]>([]);

async function loadOrders() {
  const res: any = await $api('/admin/orders?limit=50');
  orders.value = res.data || [];
}

await loadOrders();

async function updateStatus(id: string, status: string) {
  await $api(`/admin/orders/${id}/status?status=${status}`, { method: 'PATCH' });
  toast.success('Đã cập nhật trạng thái');
  await loadOrders();
}
</script>

<template>
  <div>
    <UiText as="h1" size="2xl" class="mb-6">Đơn hàng</UiText>
    <AdminOrdersTable :orders="orders" @update-status="updateStatus" />
  </div>
</template>
