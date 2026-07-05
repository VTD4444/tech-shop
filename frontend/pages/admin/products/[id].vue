<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] });

const route = useRoute();
const { $api } = useNuxtApp();
const toast = useToast();
const confirmDialog = useConfirmDialog();
const product = ref<any>(null);
const loading = ref(true);

try {
  const res: any = await $api(`/products/${route.params.id}`);
  product.value = res.data;
} finally {
  loading.value = false;
}

async function update(payload: Record<string, unknown>) {
  await $api(`/products/${product.value.id}`, { method: 'PATCH', body: payload });
  toast.success('Đã cập nhật sản phẩm');
  navigateTo('/admin/products');
}

async function remove() {
  const ok = await confirmDialog.confirm({
    title: 'Ngừng kinh doanh',
    message: 'Ngừng kinh doanh sản phẩm này?',
    confirmLabel: 'Ngừng kinh doanh',
  });
  if (!ok) return;
  await $api(`/products/${product.value.id}`, { method: 'DELETE' });
  toast.info('Đã ngừng kinh doanh sản phẩm');
  navigateTo('/admin/products');
}
</script>

<template>
  <div>
    <div v-if="loading" class="space-y-4">
      <UiSkeleton class="h-8 w-64" />
      <UiSkeleton class="h-96 w-full" />
    </div>

    <template v-else-if="product">
      <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <NuxtLink
            to="/admin/products"
            class="text-accent text-sm hover:underline mb-2 inline-block"
          >
            ← Danh sách sản phẩm
          </NuxtLink>
          <UiText as="h1" size="2xl" class="mb-1">Sửa sản phẩm</UiText>
          <UiText variant="muted" size="sm">{{ product.name }}</UiText>
        </div>
        <UiButton variant="danger" size="sm" @click="remove">
          Ngừng kinh doanh
        </UiButton>
      </div>

      <AdminProductForm :initial="product" submit-label="Cập nhật sản phẩm" @submit="update" />
    </template>

    <UiEmptyState v-else title="Không tìm thấy sản phẩm">
      <template #action>
        <UiButton to="/admin/products" variant="secondary">Quay lại</UiButton>
      </template>
    </UiEmptyState>
  </div>
</template>
