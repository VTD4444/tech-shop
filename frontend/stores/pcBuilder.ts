import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const usePcBuilderStore = defineStore('pcBuilder', () => {
  const components = ref<any[]>([]);
  const selectedComponents = ref<Record<string, any>>({});
  const validationResult = ref<any>(null);
  const builds = ref<any[]>([]);

  async function fetchComponents(type?: string) {
    const { $api } = useNuxtApp();
    const query = type ? `?type=${type}` : '';
    const data: any = await $api(`/pc-builder/components${query}`);
    components.value = data.data || [];
    return data.data;
  }

  function selectComponent(type: string, component: any) {
    selectedComponents.value[type] = component;
  }

  function removeComponent(type: string) {
    delete selectedComponents.value[type];
  }

  async function validateBuild() {
    const componentIds = Object.values(selectedComponents.value).map((c: any) => c.id);
    if (componentIds.length === 0) return;
    const { $api } = useNuxtApp();
    const data: any = await $api('/pc-builder/validate', {
      method: 'POST',
      body: { componentIds },
    });
    validationResult.value = data.data;
    return data.data;
  }

  async function saveBuild(name: string) {
    const componentIds = Object.values(selectedComponents.value).map((c: any) => c.id);
    const { $api } = useNuxtApp();
    return $api('/pc-builder/build', {
      method: 'POST',
      body: { name, componentIds },
    });
  }

  async function fetchBuilds() {
    const { $api } = useNuxtApp();
    const data: any = await $api('/pc-builder/builds');
    builds.value = data.data || [];
  }

  const totalPrice = computed(() =>
    Object.values(selectedComponents.value).reduce(
      (s: number, c: any) => s + Number(c.product?.price ?? 0),
      0,
    ),
  );

  return {
    components, selectedComponents, validationResult, builds,
    fetchComponents, selectComponent, removeComponent, validateBuild, saveBuild, fetchBuilds, totalPrice,
  };
});
