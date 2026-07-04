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
  { label: 'Doanh thu (tháng này)', value: formatPrice(summary.value.monthRevenue ?? 0), accent: true },
  { label: 'Tổng đơn hàng', value: summary.value.totalOrders ?? 0 },
  { label: 'Sản phẩm đang bán', value: summary.value.totalProducts ?? 0 },
  { label: 'Khách hàng', value: summary.value.totalUsers ?? 0 },
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
    toast.error(e.data?.message || 'Không tải được bảng điều khiển');
  }
}

async function updateStatus(orderId: string, status: string) {
  await $api(`/admin/orders/${orderId}/status?status=${status}`, { method: 'PATCH' });
  toast.success('Đã cập nhật trạng thái đơn hàng');
  await loadDashboard();
}

onMounted(loadDashboard);
</script>

<template>
  <div>
    <UiText as="h1" size="2xl" class="mb-2">Tổng quan cửa hàng</UiText>
    <UiText variant="muted" size="sm" class="mb-8">Theo dõi doanh thu, tồn kho và luồng giao dịch.</UiText>

    <div v-if="!auth.isAdmin" class="text-danger">Truy cập bị từ chối. Cần quyền quản trị viên.</div>

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
