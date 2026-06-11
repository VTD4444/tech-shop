<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' });

const { $api } = useNuxtApp();
const { formatPrice } = useFormatPrice();
const toast = useToast();
const orders = ref<any[]>([]);

const res: any = await $api('/admin/orders?limit=50');
orders.value = res.data || [];

async function updateStatus(id: string, status: string) {
  await $api(`/admin/orders/${id}/status?status=${status}`, { method: 'PATCH' });
  toast.success('Status updated');
}
</script>

<template>
  <div>
    <UiText as="h1" size="2xl" class="mb-6">Orders</UiText>
    <AdminOrdersTable :orders="orders" @update-status="updateStatus" />
  </div>
</template>
