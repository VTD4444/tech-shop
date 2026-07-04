<script setup lang="ts">
import { Bot } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { useCartStore } from '~/stores/cart';

const authStore = useAuthStore();
const cartStore = useCartStore();
const { formatPrice } = useFormatPrice();
const toast = useToast();
const { $aiApi } = useNuxtApp();

const activeTab = ref<'recommend' | 'chat'>('recommend');
const budget = ref(20000000);
const purpose = ref('gaming');
const preferences = ref('');
const loading = ref(false);
const recommendation = ref<any[]>([]);
const recommendationNote = ref('');
const aiSummary = ref('');
const recommendationSource = ref<'gemini' | 'rule_based' | ''>('');
const error = ref('');

const totalRecommended = computed(() =>
  recommendation.value.reduce((sum, item) => sum + Number(item.price || 0), 0),
);

async function getRecommendation() {
  loading.value = true;
  error.value = '';
  recommendationNote.value = '';
  aiSummary.value = '';
  recommendationSource.value = '';
  recommendation.value = [];
  try {
    const res: any = await $aiApi('/advisor/recommend', {
      method: 'POST',
      body: {
        budget_total: budget.value,
        purpose: purpose.value,
        preferences: preferences.value ? [preferences.value] : [],
      },
    });
    recommendation.value = res.data?.recommended_components || [];
    aiSummary.value = res.data?.ai_summary || res.data?.explanation || '';
    recommendationNote.value = res.data?.explanation || '';
    recommendationSource.value = res.data?.source || (res.data?.fallback_used ? 'rule_based' : 'gemini');
    if (res.data?.fallback_used) {
      toast.info('Đang dùng gợi ý theo quy tắc vì Gemini không khả dụng.');
    } else if (recommendationSource.value === 'gemini') {
      toast.success('Gợi ý được hỗ trợ bởi Gemini.');
    }
  } catch (e: any) {
    error.value = e.data?.detail || e.data?.message || 'Dịch vụ AI không khả dụng. Hãy kiểm tra dịch vụ AI đang chạy.';
    toast.error(error.value);
  } finally {
    loading.value = false;
  }
}

async function addToCart(item: any) {
  if (!authStore.isAuthenticated) return navigateTo('/login');
  const id = item.product_id || item.productId;
  if (!id) return;
  await cartStore.addItem(String(id));
  toast.success('Đã thêm vào giỏ hàng');
}
</script>

<template>
  <ClientOnly>
    <UiContainer size="narrow" class="py-8">
      <div class="flex items-center gap-3 mb-2">
        <Bot class="w-8 h-8 text-accent" />
        <UiText as="h1" size="2xl">Cố vấn AI</UiText>
      </div>
      <UiText variant="muted" class="mb-6">
        Nhận gợi ý cấu hình hoặc trò chuyện với Gemini về linh kiện PC.
      </UiText>

      <div class="flex gap-2 mb-6 border-b border-subtle">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
          :class="activeTab === 'recommend' ? 'border-accent text-accent' : 'border-transparent text-text-muted'"
          @click="activeTab = 'recommend'"
        >
          Gợi ý
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
          :class="activeTab === 'chat' ? 'border-accent text-accent' : 'border-transparent text-text-muted'"
          @click="activeTab = 'chat'"
        >
          Trò chuyện
        </button>
      </div>

      <template v-if="activeTab === 'recommend'">
        <UiCard padding="md" class="mb-6">
          <div class="space-y-4">
            <div>
              <UiText variant="muted" size="xs" uppercase class="mb-1 block">Ngân sách (VND)</UiText>
              <UiInput v-model="budget" type="number" placeholder="20000000" />
            </div>
            <div>
              <UiText variant="muted" size="xs" uppercase class="mb-1 block">Mục đích</UiText>
              <UiSelect
                v-model="purpose"
                :options="[
                  { label: 'Chơi game', value: 'gaming' },
                  { label: 'Văn phòng / Làm việc', value: 'work' },
                  { label: 'Đồ họa / Thiết kế', value: 'graphics' },
                  { label: 'Lập trình', value: 'development' },
                  { label: 'Sử dụng chung', value: 'general' },
                ]"
              />
            </div>
            <div>
              <UiText variant="muted" size="xs" uppercase class="mb-1 block">Sở thích</UiText>
              <textarea
                v-model="preferences"
                rows="2"
                placeholder="VD: ưu tiên Intel, cần WiFi..."
                class="w-full rounded-md border border-subtle bg-surface-3 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <UiButton variant="primary" :loading="loading" @click="getRecommendation">
              Nhận gợi ý
            </UiButton>
          </div>
        </UiCard>

        <UiCard v-if="recommendation.length || aiSummary" padding="md">
          <div class="flex items-center justify-between gap-3 mb-4">
            <UiText as="h2" size="xl">Cấu hình gợi ý</UiText>
            <UiText
              v-if="recommendationSource"
              size="xs"
              class="uppercase tracking-wide"
              :class="recommendationSource === 'gemini' ? 'text-accent' : 'text-text-muted'"
            >
              {{ recommendationSource === 'gemini' ? 'Hỗ trợ bởi Gemini' : 'Dự phòng theo quy tắc' }}
            </UiText>
          </div>
          <p v-if="aiSummary" class="text-sm text-text-primary mb-4 whitespace-pre-wrap">{{ aiSummary }}</p>
          <p v-else-if="recommendationNote" class="text-sm text-text-muted mb-4">{{ recommendationNote }}</p>
          <div v-for="item in recommendation" :key="item.component_type || item.name" class="flex items-center gap-4 py-3 border-b border-subtle last:border-0">
            <div class="flex-1 min-w-0">
              <p class="font-medium text-text-primary">{{ item.product_name || item.name }}</p>
              <p v-if="item.explanation" class="text-sm text-text-muted">{{ item.explanation }}</p>
            </div>
            <p class="font-semibold text-accent shrink-0">{{ formatPrice(item.price) }}</p>
            <UiButton v-if="item.product_id || item.slug" variant="secondary" size="sm" @click="addToCart(item)">Thêm</UiButton>
          </div>
          <p class="text-right text-lg font-bold mt-4 text-text-primary">
            Tổng cộng: <span class="text-accent">{{ formatPrice(totalRecommended) }}</span>
          </p>
        </UiCard>
        <p v-if="error" class="text-danger text-sm mt-2">{{ error }}</p>
      </template>

      <AdvisorChat v-else />
    </UiContainer>
  </ClientOnly>
</template>
