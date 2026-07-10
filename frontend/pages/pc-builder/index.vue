<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/stores/auth';
import { useCartStore } from '~/stores/cart';
import { usePcBuilderStore } from '~/stores/pcBuilder';
import { useProductStore } from '~/stores/product';
import { useFormatPrice } from '~/composables/useFormatPrice';
import { useToast } from '~/composables/useToast';
import { useConfirmDialog } from '~/composables/useConfirmDialog';
import { usePromptDialog } from '~/composables/usePromptDialog';

const route = useRoute();
const router = useRouter();
const pcBuilderStore = usePcBuilderStore();
const productStore = useProductStore();
const authStore = useAuthStore();
const cartStore = useCartStore();
const { formatPrice } = useFormatPrice();
const toast = useToast();
const confirmDialog = useConfirmDialog();
const promptDialog = usePromptDialog();

const {
  selectedComponents,
  validationResult,
  totalPrice,
  builds,
  loading,
  selectedCount,
} = storeToRefs(pcBuilderStore);

const showSelector = ref(false);
const selectedType = ref('');
const availableComponents = ref<any[]>([]);
const showIncompatible = ref(false);
const selectorLoading = ref(false);
const saving = ref(false);
const addingToCart = ref(false);

const selectorFilters = reactive({
  category: '',
  brand: '',
  search: '',
  minPrice: undefined as number | undefined,
  maxPrice: undefined as number | undefined,
  sort: 'name_asc',
});

const componentTypes = [
  { label: 'CPU', value: 'CPU' },
  { label: 'Bo mạch chủ', value: 'MAINBOARD' },
  { label: 'RAM', value: 'RAM' },
  { label: 'VGA / GPU', value: 'VGA' },
  { label: 'Ổ cứng', value: 'STORAGE' },
  { label: 'Nguồn', value: 'PSU' },
  { label: 'Vỏ máy', value: 'CASE' },
  { label: 'Tản nhiệt', value: 'COOLER' },
];

function typeLabel(type: string) {
  return componentTypes.find((c) => c.value === type)?.label || type;
}

function selectedIdsExcluding(type: string) {
  return Object.entries(selectedComponents.value)
    .filter(([t]) => t !== type)
    .map(([, comp]) => comp.id);
}

const visibleComponents = computed(() => {
  if (showIncompatible.value) return availableComponents.value;
  return availableComponents.value.filter((c) => c.compatible !== false);
});

function resetSelectorFilters() {
  Object.assign(selectorFilters, {
    category: '',
    brand: '',
    search: '',
    minPrice: undefined,
    maxPrice: undefined,
    sort: 'name_asc',
  });
}

async function loadSelectorComponents() {
  if (!selectedType.value) return;
  selectorLoading.value = true;
  try {
    const selectedIds = selectedIdsExcluding(selectedType.value);
    availableComponents.value = await pcBuilderStore.fetchComponents(
      selectedType.value,
      selectedIds,
      {
        search: selectorFilters.search || undefined,
        brand: selectorFilters.brand || undefined,
        minPrice: selectorFilters.minPrice,
        maxPrice: selectorFilters.maxPrice,
        sort: selectorFilters.sort,
      },
    );
  } finally {
    selectorLoading.value = false;
  }
}

async function openSelector(type: string) {
  selectedType.value = type;
  showIncompatible.value = false;
  resetSelectorFilters();
  if (!productStore.brands.length) {
    await productStore.fetchBrands();
  }
  showSelector.value = true;
  await loadSelectorComponents();
}

function onSelectorFilterUpdate(key: string, value: unknown) {
  (selectorFilters as Record<string, unknown>)[key] = value;
  loadSelectorComponents();
}

function clearSelectorFilters() {
  resetSelectorFilters();
  loadSelectorComponents();
}

function onSelectorSortChange(sort: string) {
  selectorFilters.sort = sort;
  loadSelectorComponents();
}

async function selectComponent(comp: any) {
  pcBuilderStore.selectComponent(selectedType.value, comp);
  showSelector.value = false;
  await pcBuilderStore.validateBuild();
}

function removeComponent(type: string) {
  pcBuilderStore.removeComponent(type);
  validationResult.value = null;
  if (selectedCount.value > 0) {
    pcBuilderStore.validateBuild();
  }
}

async function validateBuild() {
  if (selectedCount.value === 0) {
    toast.info('Hãy chọn ít nhất một linh kiện');
    return;
  }
  await pcBuilderStore.validateBuild();
}

async function saveCurrentBuild() {
  if (!authStore.isAuthenticated) {
    toast.info('Vui lòng đăng nhập để lưu cấu hình');
    navigateTo('/login?redirect=/pc-builder');
    return;
  }
  if (selectedCount.value === 0) return;
  const name = await promptDialog.prompt({
    title: 'Lưu cấu hình',
    message: 'Đặt tên cho cấu hình PC của bạn',
    defaultValue: 'Cấu hình của tôi',
    placeholder: 'Tên cấu hình',
    confirmLabel: 'Lưu',
  });
  if (!name) return;
  saving.value = true;
  try {
    await pcBuilderStore.saveBuild(name);
    const incompatible = validationResult.value && !validationResult.value.compatible;
    toast.success(
      incompatible
        ? 'Đã lưu cấu hình (có cảnh báo tương thích)'
        : 'Đã lưu cấu hình!',
    );
  } catch (e: any) {
    toast.error(e?.data?.message || 'Không thể lưu cấu hình');
  } finally {
    saving.value = false;
  }
}

async function loadBuild(build: any) {
  try {
    await pcBuilderStore.loadSavedBuild(build);
    toast.success(`Đã tải "${build.name}"`);
  } catch {
    toast.error('Không thể tải cấu hình');
  }
}

async function removeSavedBuild(buildId: string) {
  const ok = await confirmDialog.confirm('Xóa cấu hình đã lưu này?');
  if (!ok) return;
  try {
    await pcBuilderStore.deleteBuild(buildId);
    toast.info('Đã xóa cấu hình');
  } catch {
    toast.error('Không thể xóa cấu hình');
  }
}

async function addBuildToCart() {
  if (!authStore.isAuthenticated) {
    toast.info('Vui lòng đăng nhập để thêm vào giỏ hàng');
    navigateTo('/login?redirect=/pc-builder');
    return;
  }
  if (selectedCount.value === 0) return;
  addingToCart.value = true;
  try {
    await pcBuilderStore.addBuildToCart();
    const incompatible = validationResult.value && !validationResult.value.compatible;
    toast.success(
      incompatible
        ? 'Đã thêm vào giỏ (cấu hình có cảnh báo tương thích)'
        : 'Đã thêm tất cả linh kiện vào giỏ hàng',
    );
    navigateTo('/cart');
  } catch (e: any) {
    toast.error(e?.data?.message || 'Không thể thêm vào giỏ hàng');
  } finally {
    addingToCart.value = false;
  }
}

async function applyAddFromQuery() {
  const slug = route.query.add;
  if (!slug || typeof slug !== 'string') return;
  try {
    const component = await pcBuilderStore.addProductBySlug(slug);
    toast.success(`Đã thêm ${component.product?.name} vào cấu hình`);
    await router.replace({ path: '/pc-builder', query: {} });
  } catch {
    toast.error('Sản phẩm này không thể thêm vào cấu hình PC');
    await router.replace({ path: '/pc-builder', query: {} });
  }
}

onMounted(async () => {
  if (authStore.isAuthenticated) {
    try {
      await pcBuilderStore.fetchBuilds();
    } catch {
      /* guest-only flow still works */
    }
  }
  await applyAddFromQuery();
});
</script>

<template>
  <UiContainer class="py-8">
    <UiText as="h1" size="2xl" class="mb-2">Xây dựng PC</UiText>
    <UiText variant="muted" class="mb-8">
      Chọn linh kiện, kiểm tra tương thích, lưu cấu hình hoặc thêm tất cả vào giỏ hàng.
    </UiText>

    <div class="grid lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-3">
        <div v-if="loading" class="space-y-3">
          <UiSkeleton v-for="i in 4" :key="i" class="h-20" />
        </div>
        <template v-else>
          <ComponentSlot
            v-for="type in componentTypes"
            :key="type.value"
            :label="type.label"
            :type="type.value"
            :selected="selectedComponents[type.value]"
            @select="openSelector(type.value)"
            @remove="removeComponent(type.value)"
          />
        </template>
      </div>

      <UiCard glass padding="md" class="h-fit sticky top-24 space-y-4">
        <UiText as="h2" size="lg">Tóm tắt cấu hình</UiText>

        <UiEmptyState
          v-if="selectedCount === 0"
          title="Chưa có linh kiện"
          description="Chọn linh kiện từ các ô hoặc dùng Thêm vào cấu hình trên trang sản phẩm."
        />

        <template v-else>
          <div
            v-for="(comp, type) in selectedComponents"
            :key="type"
            class="flex justify-between text-sm py-2 border-b border-subtle"
          >
            <span class="text-fg-muted">{{ typeLabel(String(type)) }}</span>
            <span class="text-fg truncate ml-2 max-w-[140px]">{{ comp.product?.name }}</span>
          </div>
          <UiText variant="accent" size="2xl" class="font-bold">{{ formatPrice(totalPrice) }}</UiText>
        </template>

        <UiButton variant="primary" block :disabled="selectedCount === 0" @click="validateBuild">
          Kiểm tra tương thích
        </UiButton>

        <div v-if="validationResult" class="space-y-2">
          <div
            v-for="issue in validationResult.issues"
            :key="issue.message"
            class="text-xs p-2 rounded"
            :class="issue.type === 'error' ? 'bg-danger-muted text-danger' : 'bg-warning-muted text-warning'"
          >
            {{ issue.message }}
          </div>
          <p v-if="validationResult.compatible" class="text-accent font-semibold text-sm">
            Cấu hình tương thích!
          </p>
        </div>

        <UiButton
          v-if="selectedCount > 0"
          variant="secondary"
          block
          :loading="addingToCart"
          @click="addBuildToCart"
        >
          Thêm cấu hình vào giỏ
        </UiButton>

        <UiButton
          v-if="selectedCount > 0"
          variant="ghost"
          block
          :loading="saving"
          @click="saveCurrentBuild"
        >
          Lưu cấu hình
        </UiButton>

        <UiButton
          v-if="selectedCount > 0"
          variant="ghost"
          block
          class="!text-danger"
          @click="pcBuilderStore.clearBuild()"
        >
          Xóa cấu hình
        </UiButton>

        <div v-if="authStore.isAuthenticated && builds.length" class="pt-4 border-t border-subtle">
          <UiText as="h3" size="sm" class="mb-3 uppercase tracking-wide">Cấu hình đã lưu</UiText>
          <div class="space-y-2 max-h-48 overflow-y-auto">
            <div
              v-for="build in builds"
              :key="build.id"
              class="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface-2 border border-subtle"
            >
              <button type="button" class="text-left flex-1 min-w-0" @click="loadBuild(build)">
                <p class="text-sm font-medium text-fg truncate">{{ build.name }}</p>
                <p class="text-xs text-fg-muted">{{ formatPrice(build.totalPrice) }}</p>
              </button>
              <button
                type="button"
                class="text-xs text-danger shrink-0 hover:underline"
                @click="removeSavedBuild(build.id)"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      </UiCard>
    </div>

    <UiModal
      :open="showSelector"
      size="2xl"
      :title="`Chọn ${typeLabel(selectedType)}`"
      @close="showSelector = false"
    >
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div class="w-full sm:w-56 shrink-0 space-y-3">
          <ProductFilterSidebar
            compact
            hide-category
            hide-pc-component
            :filters="selectorFilters"
            @update="onSelectorFilterUpdate"
            @clear="clearSelectorFilters"
          />
          <UiCheckbox
            v-model="showIncompatible"
            label="Hiện linh kiện không tương thích"
            description="Mặc định chỉ liệt kê linh kiện tương thích với cấu hình hiện tại."
          />
        </div>

        <div class="min-w-0 flex-1">
          <ProductGridHeader
            compact
            :sort="selectorFilters.sort"
            @update:sort="onSelectorSortChange"
          />

          <div v-if="selectorLoading" class="space-y-2">
            <UiSkeleton v-for="i in 4" :key="i" class="h-20" />
          </div>

          <UiEmptyState
            v-else-if="!visibleComponents.length"
            title="Không có linh kiện"
            description="Không tìm thấy linh kiện phù hợp. Thử xóa bộ lọc hoặc hiện linh kiện không tương thích."
          >
            <template #action>
              <UiButton variant="secondary" size="sm" @click="clearSelectorFilters">
                Xóa bộ lọc
              </UiButton>
            </template>
          </UiEmptyState>

          <div v-else class="space-y-2 max-h-[min(52vh,28rem)] overflow-y-auto pr-1">
            <button
              v-for="comp in visibleComponents"
              :key="comp.id"
              type="button"
              :class="[
                'flex w-full items-start gap-3 rounded-lg border border-subtle bg-surface-1 p-3 text-left transition-colors hover:border-accent/50 hover:bg-surface-2',
                comp.compatible === false ? 'opacity-80' : '',
                selectedComponents[selectedType]?.id === comp.id
                  ? 'border-accent bg-accent-muted/20 ring-1 ring-accent/30'
                  : '',
              ]"
              @click="selectComponent(comp)"
            >
              <img
                :src="comp.product?.imageUrl || '/placeholder.svg'"
                alt=""
                class="h-16 w-16 shrink-0 rounded-md object-cover bg-surface-3"
              />
              <div class="min-w-0 flex-1">
                <p class="font-medium text-fg leading-snug">{{ comp.product?.name }}</p>
                <p v-if="comp.product?.brand?.name" class="mt-0.5 text-xs text-fg-muted">
                  {{ comp.product.brand.name }}
                </p>
                <p class="mt-1 text-sm font-semibold text-accent">
                  {{ formatPrice(comp.product?.price || 0) }}
                </p>
                <ul
                  v-if="comp.incompatibilityReasons?.length"
                  class="mt-2 space-y-1"
                >
                  <li
                    v-for="reason in comp.incompatibilityReasons"
                    :key="reason"
                    class="text-xs text-warning leading-snug"
                  >
                    {{ reason }}
                  </li>
                </ul>
              </div>
            </button>
          </div>
        </div>
      </div>
    </UiModal>
  </UiContainer>
</template>
