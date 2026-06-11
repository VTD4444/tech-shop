<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

definePageMeta({ middleware: 'auth' });

const authStore = useAuthStore();
const { $api } = useNuxtApp();
const toast = useToast();

const addresses = ref<any[]>([]);
const showAddForm = ref(false);
const form = reactive({
  receiverName: '', phone: '', addressLine: '', ward: '', district: '', city: '', isDefault: false,
});

const data: any = await $api('/users/addresses');
addresses.value = data.data || [];

async function addAddress() {
  const res: any = await $api('/users/addresses', { method: 'POST', body: form });
  addresses.value.push(res.data);
  showAddForm.value = false;
  toast.success('Address added');
  Object.assign(form, { receiverName: '', phone: '', addressLine: '', ward: '', district: '', city: '', isDefault: false });
}

async function deleteAddress(id: string) {
  if (!confirm('Delete this address?')) return;
  await $api(`/users/addresses/${id}`, { method: 'DELETE' });
  addresses.value = addresses.value.filter((a: any) => a.id !== id);
  toast.info('Address removed');
}
</script>

<template>
  <UiContainer size="narrow" class="py-8">
    <UiText as="h1" size="2xl" class="mb-8">My Profile</UiText>
    <UiCard padding="md" class="mb-6">
      <UiText as="h2" size="lg" class="mb-4">Account Info</UiText>
      <dl class="space-y-2 text-sm">
        <div class="flex gap-2"><dt class="text-text-muted w-24">Username</dt><dd class="text-text-primary">{{ authStore.user?.username }}</dd></div>
        <div class="flex gap-2"><dt class="text-text-muted w-24">Email</dt><dd class="text-text-primary">{{ authStore.user?.email }}</dd></div>
        <div class="flex gap-2"><dt class="text-text-muted w-24">Role</dt><dd><UiBadge variant="neutral">{{ authStore.user?.role }}</UiBadge></dd></div>
      </dl>
    </UiCard>
    <UiCard padding="md">
      <div class="flex justify-between items-center mb-4">
        <UiText as="h2" size="lg">Addresses</UiText>
        <UiButton variant="secondary" size="sm" @click="showAddForm = !showAddForm">+ Add</UiButton>
      </div>
      <div v-for="addr in addresses" :key="addr.id" class="border border-subtle rounded-lg p-4 mb-3">
        <p class="font-medium text-text-primary">{{ addr.receiverName }} · {{ addr.phone }}</p>
        <p class="text-sm text-text-muted mt-1">{{ addr.addressLine }}, {{ addr.ward }}, {{ addr.district }}, {{ addr.city }}</p>
        <div class="flex gap-2 mt-2 items-center">
          <UiBadge v-if="addr.isDefault" variant="accent">Default</UiBadge>
          <UiButton variant="ghost" size="sm" class="!text-danger" @click="deleteAddress(addr.id)">Delete</UiButton>
        </div>
      </div>
      <form v-if="showAddForm" class="border-t border-subtle pt-4 space-y-3" @submit.prevent="addAddress">
        <div class="grid grid-cols-2 gap-3">
          <UiInput v-model="form.receiverName" placeholder="Receiver Name" required />
          <UiInput v-model="form.phone" placeholder="Phone" required />
        </div>
        <UiInput v-model="form.addressLine" placeholder="Address Line" required />
        <div class="grid grid-cols-3 gap-3">
          <UiInput v-model="form.ward" placeholder="Ward" />
          <UiInput v-model="form.district" placeholder="District" />
          <UiInput v-model="form.city" placeholder="City" />
        </div>
        <UiCheckbox v-model="form.isDefault" label="Set as default" />
        <div class="flex gap-2">
          <UiButton type="submit" variant="primary" size="sm">Save</UiButton>
          <UiButton variant="ghost" size="sm" type="button" @click="showAddForm = false">Cancel</UiButton>
        </div>
      </form>
    </UiCard>
  </UiContainer>
</template>
