<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
</script>

<template>
  <header class="h-14 border-b border-subtle bg-surface-1 flex items-center justify-between px-6 shrink-0">
    <NuxtLink to="/" class="text-lg font-bold tracking-wider">
      TECH<span class="text-accent">SHOP</span>
      <span class="text-fg-muted text-xs font-normal ml-2">Quản trị</span>
    </NuxtLink>
    <div class="flex items-center gap-4">
      <ThemeToggle />
      <div class="hidden md:block w-64">
        <UiInput placeholder="Tìm kiếm..." disabled>
          <template #prefix><Search class="w-4 h-4" /></template>
        </UiInput>
      </div>
      <UiButton to="/pc-builder" variant="primary" size="sm">XÂY DỰNG PC</UiButton>
      <span class="text-sm text-fg-muted">{{ authStore.displayName }}</span>
      <UiButton variant="ghost" size="sm" @click="authStore.logout()">Đăng xuất</UiButton>
    </div>
  </header>
</template>
