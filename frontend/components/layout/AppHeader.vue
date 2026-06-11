<script setup lang="ts">
import { Search, ShoppingCart, User, Menu, X } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { useCartStore } from '~/stores/cart';

const authStore = useAuthStore();
const cartStore = useCartStore();
const route = useRoute();
const searchQuery = ref('');
const mobileOpen = ref(false);

const navLinks = [
  { label: 'Products', to: '/products' },
  { label: 'PC Builder', to: '/pc-builder' },
  { label: 'AI Advisor', to: '/advisor' },
];

function isActive(path: string) {
  return route.path.startsWith(path);
}

function onSearch() {
  if (!searchQuery.value.trim()) return;
  navigateTo({ path: '/products', query: { search: searchQuery.value.trim() } });
  mobileOpen.value = false;
}

onMounted(() => {
  if (authStore.isAuthenticated) cartStore.fetchCart();
});
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-subtle bg-surface-1/95 backdrop-blur-md">
    <UiContainer class="flex items-center justify-between h-16 gap-4">
      <div class="flex items-center gap-8">
        <NuxtLink to="/" class="text-xl font-bold tracking-wider text-text-primary shrink-0">
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
                : 'text-text-muted border-transparent hover:text-text-primary',
            ]"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
      </div>

      <form class="hidden md:flex flex-1 max-w-md" @submit.prevent="onSearch">
        <UiInput v-model="searchQuery" placeholder="Search components..." class="w-full">
          <template #prefix><Search class="w-4 h-4" /></template>
        </UiInput>
      </form>

      <div class="flex items-center gap-2 sm:gap-3">
        <UiButton to="/pc-builder" variant="primary" size="sm" class="hidden sm:inline-flex">
          BUILD PC
        </UiButton>
        <NuxtLink
          to="/cart"
          class="relative p-2 text-text-muted hover:text-accent transition-colors"
          aria-label="Cart"
        >
          <ShoppingCart class="w-5 h-5" />
          <span
            v-if="cartStore.totalItems > 0"
            class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-surface-0 text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {{ cartStore.totalItems }}
          </span>
        </NuxtLink>
        <template v-if="authStore.isAuthenticated">
          <NuxtLink to="/orders" class="hidden sm:block text-sm text-text-muted hover:text-accent">Orders</NuxtLink>
          <NuxtLink v-if="authStore.isAdmin" to="/admin" class="hidden sm:block text-sm text-text-muted hover:text-accent">Admin</NuxtLink>
          <button type="button" class="p-2 text-text-muted hover:text-accent" @click="authStore.logout()">
            <User class="w-5 h-5" />
          </button>
        </template>
        <template v-else>
          <UiButton to="/login" variant="ghost" size="sm">Login</UiButton>
          <UiButton to="/register" variant="secondary" size="sm" class="hidden sm:inline-flex">Register</UiButton>
        </template>
        <button type="button" class="lg:hidden p-2 text-text-muted" @click="mobileOpen = !mobileOpen">
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
        class="block text-sm text-text-muted hover:text-accent py-1"
        @click="mobileOpen = false"
      >
        {{ link.label }}
      </NuxtLink>
      <form @submit.prevent="onSearch">
        <UiInput v-model="searchQuery" placeholder="Search..." />
      </form>
    </div>
  </header>
</template>
