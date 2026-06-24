<script setup lang="ts">
defineProps<{ images: string[] }>();

function thumb(url: string) {
  if (url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/w_200,h_200,c_fill/');
  }
  return url;
}
</script>

<template>
  <div v-if="images?.length" class="flex flex-wrap gap-2 mt-2">
    <img
      v-for="(url, i) in images"
      :key="i"
      :src="thumb(url)"
      :alt="`Attachment ${i + 1}`"
      loading="lazy"
      class="w-16 h-16 object-cover rounded-lg border border-subtle"
    />
  </div>
</template>
