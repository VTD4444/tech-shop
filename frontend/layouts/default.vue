<template>
  <div class="min-h-screen flex flex-col bg-surface-0">
    <ApiStatusBanner />
    <AppHeader />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
    <FabBuildPc />
  </div>
</template>
