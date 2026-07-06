<script setup lang="ts">
const props = defineProps<{
  spec?: Record<string, any> | null;
  pcComponent?: Record<string, any> | null;
}>();

const rows = computed(() => {
  const list: { label: string; value: string }[] = [];
  const s = props.spec;
  if (s?.cpuBrand || s?.cpuModel) list.push({ label: 'CPU', value: [s.cpuBrand, s.cpuSeries, s.cpuModel].filter(Boolean).join(' ') });
  if (s?.ramCapacity) list.push({ label: 'RAM', value: `${s.ramCapacity}GB ${s.ramGeneration || ''}`.trim() });
  if (s?.storageCapacity) list.push({ label: 'Ổ cứng', value: `${s.storageCapacity}GB ${s.storageType || ''}`.trim() });
  if (s?.gpuModel) list.push({ label: 'GPU', value: s.gpuModel });
  if (s?.screenSize) list.push({ label: 'Màn hình', value: `${s.screenSize}"` });
  if (s?.specs && typeof s.specs === 'object') {
    for (const [k, v] of Object.entries(s.specs)) {
      list.push({ label: k, value: String(v) });
    }
  }
  const pc = props.pcComponent;
  if (pc?.socket) list.push({ label: 'Socket', value: pc.socket });
  if (pc?.chipset) list.push({ label: 'Chipset', value: pc.chipset });
  if (pc?.ramGeneration) list.push({ label: 'Loại RAM', value: pc.ramGeneration });
  if (pc?.powerConsumption) list.push({ label: 'TDP', value: `${pc.powerConsumption}W` });
  if (pc?.formFactor) list.push({ label: 'Kích thước', value: pc.formFactor });
  return list;
});
</script>

<template>
  <dl v-if="rows.length" class="grid sm:grid-cols-2 gap-3 text-sm">
    <div v-for="row in rows" :key="row.label" class="flex justify-between border-b border-subtle pb-2 gap-4">
      <dt class="text-fg-muted shrink-0">{{ row.label }}</dt>
      <dd class="text-fg text-right">{{ row.value }}</dd>
    </div>
  </dl>
  <p v-else class="text-fg-muted text-sm">Chưa có thông số kỹ thuật.</p>
</template>
