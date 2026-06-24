import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { isApiUnavailableError } from '~/utils/api-error';
import { useSystemStore } from '~/stores/system';

const DEFAULT_SUMMARY = { subtotal: 0, tax: 0, taxRate: 0.1, shipping: 0, total: 0 };

export const useCartStore = defineStore('cart', () => {
  const items = ref<any[]>([]);
  const summary = ref({ ...DEFAULT_SUMMARY });
  const unavailable = ref(false);
  const totalItems = computed(() => items.value.reduce((s, i) => s + i.quantity, 0));
  const subtotal = computed(() => summary.value.subtotal);
  const tax = computed(() => summary.value.tax);
  const totalPrice = computed(() => summary.value.total);

  function applyCartPayload(data: any) {
    if (data?.items) {
      items.value = data.items;
      summary.value = data.summary || DEFAULT_SUMMARY;
    } else if (Array.isArray(data)) {
      items.value = data;
      const sub = data.reduce((s, i) => s + Number(i.product?.price ?? 0) * i.quantity, 0);
      const taxRate = 0.1;
      const taxAmt = Math.round(sub * taxRate);
      summary.value = { subtotal: sub, tax: taxAmt, taxRate, shipping: 0, total: sub + taxAmt };
    } else {
      items.value = [];
      summary.value = { ...DEFAULT_SUMMARY };
    }
  }

  async function fetchCart() {
    unavailable.value = false;
    try {
      const { $api } = useNuxtApp();
      const data: any = await $api('/cart');
      applyCartPayload(data.data);
    } catch (error) {
      if (isApiUnavailableError(error)) {
        useSystemStore().markDegraded();
        unavailable.value = true;
      }
      items.value = [];
      summary.value = { ...DEFAULT_SUMMARY };
    }
  }

  async function addItem(productId: string, quantity = 1) {
    try {
      const { $api } = useNuxtApp();
      await $api('/cart', { method: 'POST', body: { productId, quantity } });
      await fetchCart();
      return true;
    } catch (error) {
      if (isApiUnavailableError(error)) {
        useSystemStore().markDegraded('Cart is unavailable while the server is offline.');
      }
      throw error;
    }
  }

  async function updateQuantity(productId: string, quantity: number) {
    try {
      const { $api } = useNuxtApp();
      await $api(`/cart/${productId}`, { method: 'PATCH', body: { quantity } });
      await fetchCart();
    } catch (error) {
      if (isApiUnavailableError(error)) useSystemStore().markDegraded();
      throw error;
    }
  }

  async function removeItem(productId: string) {
    try {
      const { $api } = useNuxtApp();
      await $api(`/cart/${productId}`, { method: 'DELETE' });
      await fetchCart();
    } catch (error) {
      if (isApiUnavailableError(error)) useSystemStore().markDegraded();
      throw error;
    }
  }

  async function clearCart() {
    try {
      const { $api } = useNuxtApp();
      await $api('/cart', { method: 'DELETE' });
      items.value = [];
      summary.value = { ...DEFAULT_SUMMARY };
    } catch (error) {
      if (isApiUnavailableError(error)) useSystemStore().markDegraded();
      items.value = [];
      summary.value = { ...DEFAULT_SUMMARY };
    }
  }

  return {
    items,
    summary,
    unavailable,
    totalItems,
    subtotal,
    tax,
    totalPrice,
    fetchCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };
});
