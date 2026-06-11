<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/stores/auth';
import { usePcBuilderStore } from '~/stores/pcBuilder';

const pcBuilderStore = usePcBuilderStore();
const authStore = useAuthStore();
const { formatPrice } = useFormatPrice();
const toast = useToast();

const { selectedComponents, validationResult, totalPrice } = storeToRefs(pcBuilderStore);
const showSelector = ref(false);
const selectedType = ref('');
const availableComponents = ref<any[]>([]);

const componentTypes = [
  { label: 'CPU', value: 'CPU' },
  { label: 'Mainboard', value: 'MAINBOARD' },
  { label: 'RAM', value: 'RAM' },
  { label: 'VGA / GPU', value: 'VGA' },
  { label: 'Storage', value: 'STORAGE' },
  { label: 'PSU', value: 'PSU' },
  { label: 'Case', value: 'CASE' },
  { label: 'Cooler', value: 'COOLER' },
];

function typeLabel(type: string) {
  return componentTypes.find((c) => c.value === type)?.label || type;
}

async function openSelector(type: string) {
  selectedType.value = type;
  availableComponents.value = await pcBuilderStore.fetchComponents(type);
  showSelector.value = true;
}

async function selectComponent(comp: any) {
  pcBuilderStore.selectComponent(selectedType.value, comp);
  showSelector.value = false;
  await pcBuilderStore.validateBuild();
}

function removeComponent(type: string) {
  pcBuilderStore.removeComponent(type);
  validationResult.value = null;
}

async function validateBuild() {
  await pcBuilderStore.validateBuild();
}

async function saveCurrentBuild() {
  const name = prompt('Build name:', 'My Build');
  if (!name) return;
  await pcBuilderStore.saveBuild(name);
  toast.success('Build saved!');
}
</script>

<template>
  <UiContainer class="py-8">
    <UiText as="h1" size="2xl" class="mb-2">PC Builder</UiText>
    <UiText variant="muted" class="mb-8">Select components and check compatibility in real-time.</UiText>
    <div class="grid lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-3">
        <ComponentSlot
          v-for="type in componentTypes"
          :key="type.value"
          :label="type.label"
          :type="type.value"
          :selected="selectedComponents[type.value]"
          @select="openSelector(type.value)"
          @remove="removeComponent(type.value)"
        />
      </div>
      <UiCard glass padding="md" class="h-fit sticky top-24">
        <UiText as="h2" size="lg" class="mb-4">Build Summary</UiText>
        <div v-for="(comp, type) in selectedComponents" :key="type" class="flex justify-between text-sm py-2 border-b border-subtle">
          <span class="text-text-muted">{{ typeLabel(String(type)) }}</span>
          <span class="text-text-primary truncate ml-2 max-w-[140px]">{{ comp.product?.name }}</span>
        </div>
        <UiText variant="accent" size="2xl" class="font-bold mt-4">{{ formatPrice(totalPrice) }}</UiText>
        <UiButton variant="primary" block class="mt-4" @click="validateBuild">Validate Build</UiButton>
        <div v-if="validationResult" class="mt-4 space-y-2">
          <div
            v-for="issue in validationResult.issues"
            :key="issue.message"
            class="text-xs p-2 rounded"
            :class="issue.type === 'error' ? 'bg-danger-muted text-danger' : 'bg-warning-muted text-warning'"
          >
            {{ issue.message }}
          </div>
          <p v-if="validationResult.compatible" class="text-accent font-semibold text-sm">Build is compatible!</p>
        </div>
        <UiButton
          v-if="authStore.isAuthenticated && Object.keys(selectedComponents).length"
          variant="secondary"
          block
          class="mt-3"
          @click="saveCurrentBuild"
        >
          Save Build
        </UiButton>
      </UiCard>
    </div>

    <UiModal :open="showSelector" :title="`Select ${typeLabel(selectedType)}`" @close="showSelector = false">
      <UiEmptyState v-if="!availableComponents.length" title="No components" description="No components available for this slot." />
      <div v-else class="space-y-2 max-h-[50vh] overflow-y-auto">
        <UiCard
          v-for="comp in availableComponents"
          :key="comp.id"
          padding="sm"
          hover
          class="cursor-pointer"
          :class="selectedComponents[selectedType]?.id === comp.id ? 'border-accent bg-accent-muted/20' : ''"
          @click="selectComponent(comp)"
        >
          <div class="flex items-center gap-4">
            <img :src="comp.product?.imageUrl || '/placeholder.svg'" class="w-14 h-14 object-cover rounded bg-surface-3" />
            <div class="flex-1 min-w-0">
              <p class="font-medium text-text-primary truncate">{{ comp.product?.name }}</p>
              <p class="text-accent font-semibold text-sm">{{ formatPrice(comp.product?.price || 0) }}</p>
            </div>
          </div>
        </UiCard>
      </div>
    </UiModal>
  </UiContainer>
</template>
