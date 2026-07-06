<script setup lang="ts">
import { User, KeyRound, Package, Heart, Shield, LogOut, MapPin } from 'lucide-vue-next';
import { onClickOutside } from '@vueuse/core';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const open = ref(false);
const menuRef = ref<HTMLElement | null>(null);

onClickOutside(menuRef, () => {
  open.value = false;
});

function close() {
  open.value = false;
}

async function logout() {
  close();
  await authStore.logout();
}

const items = computed(() => {
  const links = [
    { label: 'Đổi mật khẩu', to: '/forgot-password', icon: KeyRound },
    { label: 'Quản lý địa chỉ', to: '/profile#addresses', icon: MapPin },
    { label: 'Đơn hàng', to: '/orders', icon: Package },
    { label: 'Yêu thích của tôi', to: '/wishlist', icon: Heart },
  ];
  if (authStore.isAdmin) {
    links.push({ label: 'Quản trị', to: '/admin', icon: Shield });
  }
  return links;
});
</script>

<template>
  <div ref="menuRef" class="relative">
    <button
      type="button"
      class="p-2 text-fg-muted hover:text-accent transition-colors rounded-lg hover:bg-surface-2"
      aria-label="Menu tài khoản"
      aria-haspopup="true"
      :aria-expanded="open"
      @click="open = !open"
    >
      <User class="w-5 h-5" />
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="open"
        class="absolute right-0 mt-2 w-52 py-1 rounded-lg border border-subtle bg-surface-1 shadow-xl z-50"
        role="menu"
      >
        <p class="px-3 py-2 text-xs text-fg-muted border-b border-subtle truncate">
          {{ authStore.displayName }}
        </p>
        <NuxtLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          role="menuitem"
          class="flex items-center gap-2.5 px-3 py-2.5 text-sm text-fg hover:bg-surface-2 hover:text-accent transition-colors"
          @click="close"
        >
          <component :is="item.icon" class="w-4 h-4 shrink-0 text-fg-muted" />
          {{ item.label }}
        </NuxtLink>
        <div class="border-t border-subtle mt-1 pt-1">
          <button
            type="button"
            role="menuitem"
            class="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-danger hover:bg-danger-muted/30 transition-colors"
            @click="logout"
          >
            <LogOut class="w-4 h-4 shrink-0" />
            Đăng xuất
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
