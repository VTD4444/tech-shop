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
    <UiText as="h3" size="lg">Technical specifications</UiText>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <UiText variant="muted" size="xs" class="mb-1 block">CPU brand</UiText>
        <UiInput v-model="model.cpuBrand" />
      </div>
      <div>
        <UiText variant="muted" size="xs" class="mb-1 block">CPU series</UiText>
        <UiInput v-model="model.cpuSeries" />
      </div>
      <div>
        <UiText variant="muted" size="xs" class="mb-1 block">CPU model</UiText>
        <UiInput v-model="model.cpuModel" />
      </div>
      <div>
        <UiText variant="muted" size="xs" class="mb-1 block">RAM (GB)</UiText>
        <UiInput v-model="model.ramCapacity" type="number" />
      </div>
      <div>
        <UiText variant="muted" size="xs" class="mb-1 block">RAM generation</UiText>
        <UiInput v-model="model.ramGeneration" placeholder="DDR5" />
      </div>
      <div>
        <UiText variant="muted" size="xs" class="mb-1 block">Storage (GB)</UiText>
        <UiInput v-model="model.storageCapacity" type="number" />
      </div>
      <div>
        <UiText variant="muted" size="xs" class="mb-1 block">Storage type</UiText>
        <UiInput v-model="model.storageType" placeholder="SSD" />
      </div>
      <div>
        <UiText variant="muted" size="xs" class="mb-1 block">GPU model</UiText>
        <UiInput v-model="model.gpuModel" />
      </div>
      <div>
        <UiText variant="muted" size="xs" class="mb-1 block">Screen size (inch)</UiText>
        <UiInput v-model="model.screenSize" type="number" step="0.1" />
      </div>
    </div>

    <div>
      <div class="flex items-center justify-between mb-2">
        <UiText variant="muted" size="xs" uppercase>Custom specs (JSON)</UiText>
        <UiButton type="button" variant="secondary" size="sm" @click="addRow">Add row</UiButton>
      </div>
      <div v-for="(row, i) in customSpecs" :key="i" class="flex gap-2 mb-2">
        <UiInput v-model="row.key" placeholder="Key" class="flex-1" />
        <UiInput v-model="row.value" placeholder="Value" class="flex-1" />
        <UiButton type="button" variant="secondary" size="sm" @click="removeRow(i)">×</UiButton>
      </div>
    </div>
  </UiCard>
</template>
