<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();

if (!authStore.bootstrapped) {
  await authStore.bootstrap();
}
</script>

<template>
  <div class="min-h-screen bg-surface-0 flex flex-col">
    <AdminTopbar />
    <div class="flex flex-1 max-w-[1600px] mx-auto w-full">
      <div class="hidden md:block p-6 border-r border-subtle bg-surface-1">
        <AdminSidebar />
      </div>
      <main class="flex-1 p-6 md:p-8 overflow-x-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
