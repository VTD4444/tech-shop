<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/stores/auth';
import { useCartStore } from '~/stores/cart';
import { usePcBuilderStore } from '~/stores/pcBuilder';
import { useFormatPrice } from '~/composables/useFormatPrice';
import { useToast } from '~/composables/useToast';
import { useConfirmDialog } from '~/composables/useConfirmDialog';
import { usePromptDialog } from '~/composables/usePromptDialog';

const route = useRoute();
const router = useRouter();
const pcBuilderStore = usePcBuilderStore();
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
const saving = ref(false);
const addingToCart = ref(false);

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

async function openSelector(type: string) {
  selectedType.value = type;
  showIncompatible.value = false;
  const selectedIds = selectedIdsExcluding(type);
  availableComponents.value = await pcBuilderStore.fetchComponents(type, selectedIds);
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
    await pcBuilderStore.validateBuild();
    if (validationResult.value && !validationResult.value.compatible) {
      toast.error('Hãy sửa lỗi tương thích trước khi lưu');
      return;
    }
    await pcBuilderStore.saveBuild(name);
    toast.success('Đã lưu cấu hình!');
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
    await pcBuilderStore.validateBuild();
    if (validationResult.value && !validationResult.value.compatible) {
      toast.error('Hãy sửa lỗi tương thích trước khi thêm vào giỏ hàng');
      return;
    }
    await pcBuilderStore.addBuildToCart();
    toast.success('Đã thêm tất cả linh kiện vào giỏ hàng');
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
            <span class="text-text-muted">{{ typeLabel(String(type)) }}</span>
            <span class="text-text-primary truncate ml-2 max-w-[140px]">{{ comp.product?.name }}</span>
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
          :disabled="validationResult && !validationResult.compatible"
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
                <p class="text-sm font-medium text-text-primary truncate">{{ build.name }}</p>
                <p class="text-xs text-text-muted">{{ formatPrice(build.totalPrice) }}</p>
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

    <UiModal :open="showSelector" :title="`Chọn ${typeLabel(selectedType)}`" @close="showSelector = false">
      <div class="flex items-center justify-between mb-3">
        <UiText variant="muted" size="xs">Mặc định chỉ hiển thị linh kiện tương thích</UiText>
        <UiCheckbox v-model="showIncompatible" label="Hiện linh kiện không tương thích" />
      </div>
      <UiEmptyState v-if="!visibleComponents.length" title="Không có linh kiện" description="Không có linh kiện tương thích cho vị trí này. Hãy thử hiện linh kiện không tương thích hoặc thay đổi lựa chọn." />
      <div v-else class="space-y-2 max-h-[50vh] overflow-y-auto">
        <UiCard
          v-for="comp in visibleComponents"
          :key="comp.id"
          padding="sm"
          :hover="comp.compatible !== false"
          :class="[
            comp.compatible === false ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            selectedComponents[selectedType]?.id === comp.id ? 'border-accent bg-accent-muted/20' : '',
          ]"
          @click="comp.compatible !== false && selectComponent(comp)"
        >
          <div class="flex items-center gap-4">
            <img :src="comp.product?.imageUrl || '/placeholder.svg'" class="w-14 h-14 object-cover rounded bg-surface-3" />
            <div class="flex-1 min-w-0">
              <p class="font-medium text-text-primary truncate">{{ comp.product?.name }}</p>
              <p class="text-accent font-semibold text-sm">{{ formatPrice(comp.product?.price || 0) }}</p>
              <p
                v-for="reason in comp.incompatibilityReasons"
                :key="reason"
                class="text-xs text-warning mt-1"
              >
                ⚠ {{ reason }}
              </p>
            </div>
          </div>
        </UiCard>
      </div>
    </UiModal>
  </UiContainer>
</template>
