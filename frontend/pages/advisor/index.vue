<script setup lang="ts">
import { Bot } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth';
import { useCartStore } from '~/stores/cart';

const authStore = useAuthStore();
const cartStore = useCartStore();
const { formatPrice } = useFormatPrice();
const toast = useToast();
const { $aiApi } = useNuxtApp();

const budget = ref(20000000);
const purpose = ref('gaming');
const preferences = ref('');
const loading = ref(false);
const recommendation = ref<any[]>([]);
const error = ref('');

const totalRecommended = computed(() =>
  recommendation.value.reduce((sum, item) => sum + Number(item.price || 0), 0),
);

async function getRecommendation() {
  loading.value = true;
  error.value = '';
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
  } catch (e: any) {
    error.value = e.data?.message || 'AI service unavailable. Check if AI service is running.';
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
  toast.success('Added to cart');
}
</script>

<template>
  <ClientOnly>
    <UiContainer size="narrow" class="py-8">
      <div class="flex items-center gap-3 mb-2">
        <Bot class="w-8 h-8 text-accent" />
        <UiText as="h1" size="2xl">AI Advisor</UiText>
      </div>
      <UiText variant="muted" class="mb-8">Describe your needs and budget to get personalized PC build recommendations.</UiText>

      <UiCard padding="md" class="mb-6">
        <div class="space-y-4">
          <div>
            <UiText variant="muted" size="xs" uppercase class="mb-1 block">Budget (VND)</UiText>
            <UiInput v-model="budget" type="number" placeholder="20000000" />
          </div>
          <div>
            <UiText variant="muted" size="xs" uppercase class="mb-1 block">Purpose</UiText>
            <UiSelect
              v-model="purpose"
              :options="[
                { label: 'Gaming', value: 'gaming' },
                { label: 'Office / Work', value: 'work' },
                { label: 'Graphics / Design', value: 'graphics' },
                { label: 'Development', value: 'development' },
                { label: 'General Use', value: 'general' },
              ]"
            />
          </div>
          <div>
            <UiText variant="muted" size="xs" uppercase class="mb-1 block">Preferences</UiText>
            <textarea
              v-model="preferences"
              rows="2"
              placeholder="e.g. prefer Intel, need WiFi..."
              class="w-full rounded-md border border-subtle bg-surface-3 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <UiButton variant="primary" :loading="loading" @click="getRecommendation">
            Get Recommendation
          </UiButton>
        </div>
      </UiCard>

      <UiCard v-if="recommendation.length" padding="md">
        <UiText as="h2" size="xl" class="mb-4">Recommended Build</UiText>
        <div v-for="item in recommendation" :key="item.component_type || item.name" class="flex items-center gap-4 py-3 border-b border-subtle last:border-0">
          <div class="flex-1 min-w-0">
            <p class="font-medium text-text-primary">{{ item.product_name || item.name }}</p>
            <p v-if="item.explanation" class="text-sm text-text-muted">{{ item.explanation }}</p>
          </div>
          <p class="font-semibold text-accent shrink-0">{{ formatPrice(item.price) }}</p>
          <UiButton v-if="item.product_id || item.slug" variant="secondary" size="sm" @click="addToCart(item)">Add</UiButton>
        </div>
        <p class="text-right text-lg font-bold mt-4 text-text-primary">
          Total: <span class="text-accent">{{ formatPrice(totalRecommended) }}</span>
        </p>
      </UiCard>
      <p v-if="error" class="text-danger text-sm mt-2">{{ error }}</p>
    </UiContainer>
  </ClientOnly>
</template>
