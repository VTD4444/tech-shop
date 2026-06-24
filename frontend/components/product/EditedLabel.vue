<script setup lang="ts">
defineProps<{ isEdited?: boolean }>();
</script>

<template>
  <p v-if="isEdited" class="text-xs text-text-muted italic">Đã chỉnh sửa</p>
</template>
