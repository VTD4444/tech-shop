<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] });

const auth = useAuthStore();
const { $api } = useNuxtApp();
const { formatPrice } = useFormatPrice();
const toast = useToast();

const summary = ref<any>({});
const orders = ref<any[]>([]);
const inventory = ref<any[]>([]);

const statCards = computed(() => [
  { label: 'Revenue (This Month)', value: formatPrice(summary.value.monthRevenue ?? 0), accent: true },
  { label: 'Total Orders', value: summary.value.totalOrders ?? 0 },
  { label: 'Active Products', value: summary.value.totalProducts ?? 0 },
  { label: 'Customers', value: summary.value.totalUsers ?? 0 },
]);

async function loadDashboard() {
  if (!auth.isAdmin) return;
  try {
    const [summaryRes, ordersRes, inventoryRes]: any[] = await Promise.all([
      $api('/admin/analytics/summary'),
      $api('/admin/orders?limit=10'),
      $api('/admin/products/inventory'),
    ]);
    summary.value = summaryRes.data ?? summaryRes;
    orders.value = ordersRes.data ?? [];
    inventory.value = inventoryRes.data ?? inventoryRes;
  } catch (e: any) {
    toast.error(e.data?.message || 'Failed to load dashboard');
  }
}

async function updateStatus(orderId: string, status: string) {
  await $api(`/admin/orders/${orderId}/status?status=${status}`, { method: 'PATCH' });
  toast.success('Order status updated');
  await loadDashboard();
}

onMounted(loadDashboard);
</script>

<template>
  <div>
    <UiText as="h1" size="2xl" class="mb-2">Store Overview</UiText>
    <UiText variant="muted" size="sm" class="mb-8">Monitor revenue, inventory, and transaction flow.</UiText>

    <div v-if="!auth.isAdmin" class="text-danger">Access denied. Admin role required.</div>

    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <UiStatCard
          v-for="stat in statCards"
          :key="stat.label"
          :label="stat.label"
          :value="stat.value"
          :accent="stat.accent"
        />
      </div>

      <div class="grid lg:grid-cols-2 gap-6 mb-8">
        <AdminRevenueChart :revenue="summary.totalRevenue" :orders="summary.totalOrders" />
        <AdminInventoryList :items="inventory" />
      </div>

      <AdminOrdersTable :orders="orders" @update-status="updateStatus" />
    </template>
  </div>
</template>
