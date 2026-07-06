<script setup lang="ts">
defineProps<{
  average: number;
  count: number;
  distribution?: Record<string, number>;
}>();
</script>

<template>
  <div class="flex flex-wrap items-center gap-4">
    <div class="text-center">
      <div class="text-3xl font-bold text-fg">{{ average.toFixed(1) }}</div>
      <ProductRatingStars :model-value="Math.round(average)" readonly />
      <div class="text-sm text-fg-muted mt-1">{{ count }} đánh giá</div>
    </div>
    <div v-if="distribution" class="flex-1 min-w-[160px] space-y-1">
      <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="flex items-center gap-2 text-xs">
        <span class="w-8 text-fg-muted">{{ star }}★</span>
        <div class="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
          <div
            class="h-full bg-warning rounded-full"
            :style="{ width: count ? `${((distribution[String(star)] || 0) / count) * 100}%` : '0%' }"
          />
        </div>
        <span class="w-6 text-fg-muted text-right">{{ distribution[String(star)] || 0 }}</span>
      </div>
    </div>
  </div>
</template>
