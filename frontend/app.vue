<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ClientOnly>
    <UiToast />
    <UiConfirmDialog />
    <UiPromptDialog />
  </ClientOnly>
</template>
