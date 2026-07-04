<script setup lang="ts">
const model = defineModel<Record<string, any>>({ default: () => ({}) });

const customSpecs = ref<{ key: string; value: string }[]>([]);

watch(
  () => model.value?.specs,
  (specs) => {
    if (specs && typeof specs === 'object' && !customSpecs.value.length) {
      customSpecs.value = Object.entries(specs).map(([key, value]) => ({
        key,
        value: String(value),
      }));
    }
  },
  { immediate: true },
);

function addRow() {
  customSpecs.value.push({ key: '', value: '' });
}

function removeRow(i: number) {
  customSpecs.value.splice(i, 1);
  syncSpecs();
}

function syncSpecs() {
  const specs: Record<string, string> = {};
  for (const row of customSpecs.value) {
    if (row.key.trim() && row.value.trim()) specs[row.key.trim()] = row.value.trim();
  }
  model.value = { ...model.value, specs };
}

watch(customSpecs, syncSpecs, { deep: true });
</script>

<template>
  <UiCard padding="md" class="space-y-4">
    <UiText as="h3" size="lg">Thông số kỹ thuật</UiText>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <UiText variant="muted" size="xs" class="mb-1 block">Hãng CPU</UiText>
        <UiInput v-model="model.cpuBrand" />
      </div>
      <div>
        <UiText variant="muted" size="xs" class="mb-1 block">Dòng CPU</UiText>
        <UiInput v-model="model.cpuSeries" />
      </div>
      <div>
        <UiText variant="muted" size="xs" class="mb-1 block">Model CPU</UiText>
        <UiInput v-model="model.cpuModel" />
      </div>
      <div>
        <UiText variant="muted" size="xs" class="mb-1 block">Dung lượng RAM (GB)</UiText>
        <UiInput v-model="model.ramCapacity" type="number" />
      </div>
      <div>
        <UiText variant="muted" size="xs" class="mb-1 block">Thế hệ RAM</UiText>
        <UiInput v-model="model.ramGeneration" placeholder="DDR5" />
      </div>
      <div>
        <UiText variant="muted" size="xs" class="mb-1 block">Dung lượng lưu trữ (GB)</UiText>
        <UiInput v-model="model.storageCapacity" type="number" />
      </div>
      <div>
        <UiText variant="muted" size="xs" class="mb-1 block">Loại lưu trữ</UiText>
        <UiInput v-model="model.storageType" placeholder="SSD" />
      </div>
      <div>
        <UiText variant="muted" size="xs" class="mb-1 block">Model GPU</UiText>
        <UiInput v-model="model.gpuModel" />
      </div>
      <div>
        <UiText variant="muted" size="xs" class="mb-1 block">Kích thước màn hình (inch)</UiText>
        <UiInput v-model="model.screenSize" type="number" step="0.1" />
      </div>
    </div>

    <div>
      <div class="flex items-center justify-between mb-2">
        <UiText variant="muted" size="xs" uppercase>Thông số tùy chỉnh</UiText>
        <UiButton type="button" variant="secondary" size="sm" @click="addRow">Thêm dòng</UiButton>
      </div>
      <div v-for="(row, i) in customSpecs" :key="i" class="flex gap-2 mb-2">
        <UiInput v-model="row.key" placeholder="Tên trường" class="flex-1" />
        <UiInput v-model="row.value" placeholder="Giá trị" class="flex-1" />
        <UiButton type="button" variant="secondary" size="sm" @click="removeRow(i)">×</UiButton>
      </div>
    </div>
  </UiCard>
</template>
