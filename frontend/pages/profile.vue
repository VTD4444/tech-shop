<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

definePageMeta({ middleware: ['auth', 'customer'] });

const authStore = useAuthStore();
const { $api } = useNuxtApp();
const toast = useToast();
const confirmDialog = useConfirmDialog();

const addresses = ref<any[]>([]);
const showAddForm = ref(false);
const form = reactive({
  receiverName: '', phone: '', addressLine: '', ward: '', district: '', city: '', isDefault: false,
});

const roleLabels: Record<string, string> = {
  admin: 'Quản trị viên',
  customer: 'Khách hàng',
};

const roleLabel = computed(() => roleLabels[authStore.user?.role || ''] || authStore.user?.role);

const route = useRoute();

const data: any = await $api('/users/addresses');
addresses.value = data.data || [];

onMounted(() => {
  if (route.hash === '#addresses') {
    nextTick(() => {
      document.getElementById('addresses')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
});

async function addAddress() {
  const res: any = await $api('/users/addresses', { method: 'POST', body: form });
  addresses.value.push(res.data);
  showAddForm.value = false;
  toast.success('Đã thêm địa chỉ');
  Object.assign(form, { receiverName: '', phone: '', addressLine: '', ward: '', district: '', city: '', isDefault: false });
}

async function deleteAddress(id: string) {
  const ok = await confirmDialog.confirm('Xóa địa chỉ này?');
  if (!ok) return;
  await $api(`/users/addresses/${id}`, { method: 'DELETE' });
  addresses.value = addresses.value.filter((a: any) => a.id !== id);
  toast.info('Đã xóa địa chỉ');
}
</script>

<template>
  <UiContainer size="narrow" class="py-8">
    <UiText as="h1" size="2xl" class="mb-8">Hồ sơ của tôi</UiText>
    <UiCard padding="md" class="mb-6">
      <UiText as="h2" size="lg" class="mb-4">Thông tin tài khoản</UiText>
      <dl class="space-y-2 text-sm">
        <div class="flex gap-2"><dt class="text-text-muted w-28">Họ tên</dt><dd class="text-text-primary">{{ authStore.user?.fullName }}</dd></div>
        <div class="flex gap-2"><dt class="text-text-muted w-28">Email</dt><dd class="text-text-primary">{{ authStore.user?.email }}</dd></div>
        <div class="flex gap-2"><dt class="text-text-muted w-28">Số điện thoại</dt><dd class="text-text-primary">{{ authStore.user?.phone || '—' }}</dd></div>
        <div class="flex gap-2"><dt class="text-text-muted w-24">Vai trò</dt><dd><UiBadge variant="neutral">{{ roleLabel }}</UiBadge></dd></div>
      </dl>
    </UiCard>
    <UiCard id="addresses" padding="md" class="scroll-mt-24">
      <div class="flex justify-between items-center mb-4">
        <UiText as="h2" size="lg">Địa chỉ</UiText>
        <UiButton variant="secondary" size="sm" @click="showAddForm = !showAddForm">+ Thêm</UiButton>
      </div>
      <div v-for="addr in addresses" :key="addr.id" class="border border-subtle rounded-lg p-4 mb-3">
        <p class="font-medium text-text-primary">{{ addr.receiverName }} · {{ addr.phone }}</p>
        <p class="text-sm text-text-muted mt-1">{{ addr.addressLine }}, {{ addr.ward }}, {{ addr.district }}, {{ addr.city }}</p>
        <div class="flex gap-2 mt-2 items-center">
          <UiBadge v-if="addr.isDefault" variant="accent">Mặc định</UiBadge>
          <UiButton variant="ghost" size="sm" class="!text-danger" @click="deleteAddress(addr.id)">Xóa</UiButton>
        </div>
      </div>
      <form v-if="showAddForm" class="border-t border-subtle pt-4 space-y-3" @submit.prevent="addAddress">
        <div class="grid grid-cols-2 gap-3">
          <UiInput v-model="form.receiverName" placeholder="Tên người nhận" required />
          <UiInput v-model="form.phone" placeholder="Số điện thoại" required />
        </div>
        <UiInput v-model="form.addressLine" placeholder="Địa chỉ" required />
        <div class="grid grid-cols-3 gap-3">
          <UiInput v-model="form.ward" placeholder="Phường/Xã" />
          <UiInput v-model="form.district" placeholder="Quận/Huyện" />
          <UiInput v-model="form.city" placeholder="Tỉnh/Thành phố" />
        </div>
        <UiCheckbox v-model="form.isDefault" label="Đặt làm mặc định" />
        <div class="flex gap-2">
          <UiButton type="submit" variant="primary" size="sm">Lưu</UiButton>
          <UiButton variant="ghost" size="sm" type="button" @click="showAddForm = false">Hủy</UiButton>
        </div>
      </form>
    </UiCard>
  </UiContainer>
</template>
