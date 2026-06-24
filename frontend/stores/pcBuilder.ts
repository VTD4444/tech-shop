import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const usePcBuilderStore = defineStore('pcBuilder', () => {
  const components = ref<any[]>([]);
  const selectedComponents = ref<Record<string, any>>({});
  const validationResult = ref<any>(null);
  const builds = ref<any[]>([]);
  const loading = ref(false);

  async function fetchComponents(type?: string) {
    const { $api } = useNuxtApp();
    const query = type ? `?type=${type}` : '';
    const data: any = await $api(`/pc-builder/components${query}`);
    components.value = data.data || [];
    return components.value;
  }

  async function fetchComponentByProductSlug(slug: string) {
    const { $api } = useNuxtApp();
    const data: any = await $api(`/pc-builder/components/by-product/${slug}`);
    return data.data;
  }

  function selectComponent(type: string, component: any) {
    selectedComponents.value[type] = component;
  }

  function removeComponent(type: string) {
    delete selectedComponents.value[type];
  }

  function clearBuild() {
    selectedComponents.value = {};
    validationResult.value = null;
  }

  async function validateBuild() {
    const componentIds = Object.values(selectedComponents.value).map((c: any) => c.id);
    if (componentIds.length === 0) {
      validationResult.value = null;
      return null;
    }
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
    const data: any = await $api('/pc-builder/build', {
      method: 'POST',
      body: { name, componentIds },
    });
    await fetchBuilds();
    return data.data;
  }

  async function fetchBuilds() {
    const { $api } = useNuxtApp();
    const data: any = await $api('/pc-builder/builds');
    builds.value = data.data || [];
    return builds.value;
  }

  async function deleteBuild(buildId: string) {
    const { $api } = useNuxtApp();
    await $api(`/pc-builder/builds/${buildId}`, { method: 'DELETE' });
    builds.value = builds.value.filter((b) => b.id !== buildId);
  }

  async function loadSavedBuild(build: any) {
    loading.value = true;
    clearBuild();
    try {
      for (const item of build.items ?? []) {
        const list = await fetchComponents(item.componentType);
        const match = list.find((c: any) => c.productId === item.productId);
        if (match) {
          selectComponent(item.componentType, match);
        }
      }
      await validateBuild();
    } finally {
      loading.value = false;
    }
  }

  async function addProductBySlug(slug: string) {
    const component = await fetchComponentByProductSlug(slug);
    selectComponent(component.componentType, component);
    await validateBuild();
    return component;
  }

  async function addBuildToCart() {
    const cartStore = useCartStore();
    for (const comp of Object.values(selectedComponents.value)) {
      await cartStore.addItem((comp as any).productId, 1);
    }
  }

  const totalPrice = computed(() =>
    Object.values(selectedComponents.value).reduce(
      (s: number, c: any) => s + Number(c.product?.price ?? 0),
      0,
    ),
  );

  const selectedCount = computed(() => Object.keys(selectedComponents.value).length);

  return {
    components,
    selectedComponents,
    validationResult,
    builds,
    loading,
    fetchComponents,
    fetchComponentByProductSlug,
    selectComponent,
    removeComponent,
    clearBuild,
    validateBuild,
    saveBuild,
    fetchBuilds,
    deleteBuild,
    loadSavedBuild,
    addProductBySlug,
    addBuildToCart,
    totalPrice,
    selectedCount,
  };
});
