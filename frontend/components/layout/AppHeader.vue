<script setup lang="ts">
import { ShoppingCart, Menu, X } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { useCartStore } from '~/stores/cart';
import { useWishlistStore } from '~/stores/wishlist';

const authStore = useAuthStore();
const cartStore = useCartStore();
const wishlistStore = useWishlistStore();
const route = useRoute();
const mobileOpen = ref(false);

const navLinks = [
  { label: 'Sản phẩm', to: '/products' },
  { label: 'Xây dựng PC', to: '/pc-builder' },
  { label: 'Tư vấn AI', to: '/advisor' },
];

function isActive(path: string) {
  return route.path.startsWith(path);
}

function closeMobile() {
  mobileOpen.value = false;
}

onMounted(async () => {
  if (authStore.isAuthenticated) {
    cartStore.fetchCart();
    try {
      await wishlistStore.fetchWishlist();
    } catch {
      /* guest flow */
    }
  }
});
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-subtle bg-surface-1/95 backdrop-blur-md">
    <UiContainer class="flex items-center justify-between h-16 gap-4">
      <div class="flex items-center gap-8">
        <NuxtLink to="/" class="text-xl font-bold tracking-wider text-fg shrink-0">
          TECH<span class="text-accent">SHOP</span>
        </NuxtLink>
        <nav class="hidden lg:flex items-center gap-6">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            :class="[
              'text-sm font-medium transition-colors pb-0.5 border-b-2',
              isActive(link.to)
                ? 'text-accent border-accent'
                : 'text-fg-muted border-transparent hover:text-fg',
            ]"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
      </div>

      <div class="hidden md:flex flex-1 max-w-md">
        <HeaderSearchBox />
      </div>

      <div class="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <NuxtLink
          to="/cart"
          class="relative p-2 text-fg-muted hover:text-accent transition-colors"
          aria-label="Giỏ hàng"
        >
          <ShoppingCart class="w-5 h-5" />
          <span
            v-if="cartStore.totalItems > 0"
            class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-on-accent text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {{ cartStore.totalItems }}
          </span>
        </NuxtLink>
        <template v-if="authStore.isAuthenticated">
          <AppUserMenu />
        </template>
        <template v-else>
          <UiButton to="/login" variant="ghost" size="sm">Đăng nhập</UiButton>
          <UiButton to="/register" variant="secondary" size="sm" class="hidden sm:inline-flex">Đăng ký</UiButton>
        </template>
        <button type="button" class="lg:hidden p-2 text-fg-muted" @click="mobileOpen = !mobileOpen">
          <X v-if="mobileOpen" class="w-5 h-5" />
          <Menu v-else class="w-5 h-5" />
        </button>
      </div>
    </UiContainer>

    <div v-if="mobileOpen" class="lg:hidden border-t border-subtle bg-surface-1 px-4 py-4 space-y-3">
      <NuxtLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="block text-sm text-fg-muted hover:text-accent py-1"
        @click="closeMobile"
      >
        {{ link.label }}
      </NuxtLink>
      <template v-if="authStore.isAuthenticated">
        <p class="text-xs text-fg-muted uppercase tracking-wide pt-2">Tài khoản</p>
        <NuxtLink to="/forgot-password" class="block text-sm text-fg-muted hover:text-accent py-1" @click="closeMobile">
          Đổi mật khẩu
        </NuxtLink>
        <NuxtLink to="/orders" class="block text-sm text-fg-muted hover:text-accent py-1" @click="closeMobile">
          Đơn hàng
        </NuxtLink>
        <NuxtLink to="/wishlist" class="block text-sm text-fg-muted hover:text-accent py-1" @click="closeMobile">
          Yêu thích của tôi
        </NuxtLink>
        <NuxtLink v-if="authStore.isAdmin" to="/admin" class="block text-sm text-fg-muted hover:text-accent py-1" @click="closeMobile">
          Quản trị
        </NuxtLink>
        <button type="button" class="block text-sm text-danger hover:underline py-1 text-left" @click="authStore.logout(); closeMobile()">
          Đăng xuất
        </button>
      </template>
      <HeaderSearchBox placeholder="Tìm kiếm..." @picked="closeMobile" />
    </div>
  </header>
</template>
