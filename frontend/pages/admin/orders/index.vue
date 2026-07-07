<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] });

const { $api } = useNuxtApp();
const toast = useToast();
const orders = ref<any[]>([]);
const loading = ref(true);

async function loadOrders() {
  loading.value = true;
  try {
    const res: any = await $api('/admin/orders?limit=50');
    orders.value = res.data || [];
  } finally {
    loading.value = false;
  }
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
    <AdminOrdersTable
      v-if="!loading"
      :orders="orders"
      @update-status="updateStatus"
    />
    <UiDataTable v-else :loading="true" :skeleton-rows="6" />
  </div>
</template>
