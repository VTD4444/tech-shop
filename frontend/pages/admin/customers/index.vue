<script setup lang="ts">
import { Search } from 'lucide-vue-next';

definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] });

const { $api } = useNuxtApp();
const toast = useToast();
const confirmDialog = useConfirmDialog();

const customers = ref<any[]>([]);
const meta = ref({ page: 1, limit: 20, total: 0, totalPages: 1 });
const loading = ref(true);
const search = ref('');
const searchDebounced = ref('');

const resetOpen = ref(false);
const resetTarget = ref<any>(null);
const resetPassword = ref('');
const resetLoading = ref(false);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

watch(search, (value) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchDebounced.value = value.trim();
    meta.value.page = 1;
    loadCustomers();
  }, 350);
});

async function loadCustomers() {
  loading.value = true;
  try {
    const query = new URLSearchParams({
      page: String(meta.value.page),
      limit: String(meta.value.limit),
    });
    if (searchDebounced.value) query.set('search', searchDebounced.value);

    const res: any = await $api(`/admin/customers?${query}`);
    customers.value = res.data || [];
    meta.value = { ...meta.value, ...(res.meta || {}) };
  } catch (e: any) {
    toast.error(extractApiMessage(e, 'Không tải được danh sách khách hàng'));
  } finally {
    loading.value = false;
  }
}

await loadCustomers();

function openReset(customer: any) {
  resetTarget.value = customer;
  resetPassword.value = '';
  resetOpen.value = true;
}

function closeReset() {
  resetOpen.value = false;
  resetTarget.value = null;
  resetPassword.value = '';
}

async function submitReset() {
  if (!resetTarget.value) return;
  if (resetPassword.value.length < 6) {
    toast.error('Mật khẩu phải có ít nhất 6 ký tự');
    return;
  }

  resetLoading.value = true;
  try {
    await $api(`/admin/customers/${resetTarget.value.id}/reset-password`, {
      method: 'POST',
      body: { password: resetPassword.value },
    });
    toast.success('Đã đặt lại mật khẩu cho khách hàng');
    closeReset();
  } catch (e: any) {
    toast.error(extractApiMessage(e, 'Không thể đặt lại mật khẩu'));
  } finally {
    resetLoading.value = false;
  }
}

async function removeCustomer(customer: any) {
  const ok = await confirmDialog.confirm(
    `Xóa khách hàng "${customer.username}"? Hành động không thể hoàn tác.`,
  );
  if (!ok) return;

  try {
    await $api(`/admin/customers/${customer.id}`, { method: 'DELETE' });
    toast.info('Đã xóa khách hàng');
    await loadCustomers();
  } catch (e: any) {
    toast.error(extractApiMessage(e, 'Không thể xóa khách hàng'));
  }
}

function goPage(page: number) {
  if (page < 1 || page > meta.value.totalPages) return;
  meta.value.page = page;
  loadCustomers();
}

const authProviderLabels: Record<string, string> = {
  local: 'Email',
  google: 'Google',
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('vi-VN');
}
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <UiText as="h1" size="2xl">Khách hàng</UiText>
        <UiText variant="muted" size="sm" class="mt-1">
          Quản lý tài khoản khách hàng (không hiển thị mật khẩu)
        </UiText>
      </div>
      <div class="w-full max-w-sm">
        <UiInput v-model="search" placeholder="Tìm theo nick, tên, email...">
          <template #prefix><Search class="h-4 w-4" /></template>
        </UiInput>
      </div>
    </div>

    <UiDataTable
      :loading="loading"
      :empty="!loading && customers.length === 0"
      :count="meta.total"
      empty-title="Chưa có khách hàng"
      empty-description="Khách hàng đăng ký sẽ hiển thị tại đây."
    >
      <template #head>
        <UiTableHead>Nick / Username</UiTableHead>
        <UiTableHead>Họ tên</UiTableHead>
        <UiTableHead>Email</UiTableHead>
        <UiTableHead>SĐT</UiTableHead>
        <UiTableHead>Đăng nhập</UiTableHead>
        <UiTableHead align="right">Đơn hàng</UiTableHead>
        <UiTableHead>Ngày tạo</UiTableHead>
        <UiTableHead align="right" width="md">Thao tác</UiTableHead>
      </template>

      <UiTableRow v-for="c in customers" :key="c.id">
        <UiTableCell variant="emphasis">
          <span class="font-mono text-sm">{{ c.username }}</span>
        </UiTableCell>
        <UiTableCell>{{ c.fullName }}</UiTableCell>
        <UiTableCell variant="muted">{{ c.email }}</UiTableCell>
        <UiTableCell variant="muted">{{ c.phone || '—' }}</UiTableCell>
        <UiTableCell>
          <UiBadge variant="neutral">
            {{ authProviderLabels[c.authProvider] || c.authProvider }}
          </UiBadge>
        </UiTableCell>
        <UiTableCell align="right" variant="numeric">{{ c.orderCount }}</UiTableCell>
        <UiTableCell variant="muted">{{ formatDate(c.createdAt) }}</UiTableCell>
        <UiTableCell variant="actions">
          <div class="flex items-center justify-end gap-1">
            <UiButton variant="ghost" size="sm" @click="openReset(c)">
              Đặt lại MK
            </UiButton>
            <UiButton
              variant="ghost"
              size="sm"
              class="!text-danger"
              @click="removeCustomer(c)"
            >
              Xóa
            </UiButton>
          </div>
        </UiTableCell>
      </UiTableRow>

      <template v-if="meta.totalPages > 1" #footer>
        <div class="flex items-center justify-between gap-3">
          <UiText variant="muted" size="sm">
            Trang {{ meta.page }} / {{ meta.totalPages }}
          </UiText>
          <div class="flex gap-2">
            <UiButton
              variant="secondary"
              size="sm"
              :disabled="meta.page <= 1 || loading"
              @click="goPage(meta.page - 1)"
            >
              Trước
            </UiButton>
            <UiButton
              variant="secondary"
              size="sm"
              :disabled="meta.page >= meta.totalPages || loading"
              @click="goPage(meta.page + 1)"
            >
              Sau
            </UiButton>
          </div>
        </div>
      </template>
    </UiDataTable>

    <UiModal
      :open="resetOpen"
      :title="`Đặt lại mật khẩu — ${resetTarget?.username || ''}`"
      @close="closeReset"
    >
      <UiText variant="muted" size="sm" class="mb-4 block">
        Mật khẩu mới cho <strong class="text-fg">{{ resetTarget?.fullName }}</strong>
        ({{ resetTarget?.email }}). Khách có thể đăng nhập ngay bằng mật khẩu này.
      </UiText>
      <UiInput
        v-model="resetPassword"
        type="password"
        placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
        autocomplete="new-password"
        class="mb-4"
      />
      <div class="flex justify-end gap-2">
        <UiButton variant="secondary" size="sm" :disabled="resetLoading" @click="closeReset">
          Hủy
        </UiButton>
        <UiButton variant="primary" size="sm" :loading="resetLoading" @click="submitReset">
          Lưu mật khẩu
        </UiButton>
      </div>
    </UiModal>
  </div>
</template>
