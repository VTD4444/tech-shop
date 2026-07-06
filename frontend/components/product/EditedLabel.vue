<script setup lang="ts">
defineProps<{ isEdited?: boolean }>();
</script>

<template>
  <p v-if="isEdited" class="text-xs text-fg-muted italic">Đã chỉnh sửa</p>
</template>
