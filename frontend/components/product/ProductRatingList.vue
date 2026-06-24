<script setup lang="ts">
defineProps<{
  ratings: any[];
  currentUserId?: string | null;
}>();

const emit = defineEmits<{ edit: [rating: any] }>();

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN');
}
</script>

<template>
  <div class="space-y-4">
    <div v-for="r in ratings" :key="r.id" class="border-b border-subtle pb-4 last:border-0">
      <div class="flex items-start justify-between gap-2">
        <div>
          <span class="font-medium text-text-primary">{{ r.user?.username }}</span>
          <span class="text-text-muted text-sm ml-2">{{ formatDate(r.createdAt) }}</span>
          <EditedLabel :is-edited="r.isEdited" class="mt-0.5" />
        </div>
        <button
          v-if="currentUserId && r.userId === currentUserId"
          type="button"
          class="text-xs text-accent hover:underline"
          @click="emit('edit', r)"
        >
          Sửa
        </button>
      </div>
      <ProductRatingStars :model-value="r.rating" readonly class="mt-1" />
      <ProductImageGallery :images="r.images || []" />
    </div>
  </div>
</template>
