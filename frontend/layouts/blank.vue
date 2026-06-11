<template>
  <div class="min-h-screen bg-surface-0 flex flex-col items-center justify-center p-4">
    <NuxtLink to="/" class="text-2xl font-bold tracking-wider mb-8">
      TECH<span class="text-accent">SHOP</span>
    </NuxtLink>
    <div class="w-full max-w-md">
      <slot />
    </div>
  </div>
</template>
