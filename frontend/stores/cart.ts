import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { isApiUnavailableError } from '~/utils/api-error';
import { useSystemStore } from '~/stores/system';

export const useCartStore = defineStore('cart', () => {
  const items = ref<any[]>([]);
  const unavailable = ref(false);
  const totalItems = computed(() => items.value.reduce((s, i) => s + i.quantity, 0));
  const totalPrice = computed(() =>
    items.value.reduce((s, i) => s + Number(i.product?.price ?? 0) * i.quantity, 0),
  );

  async function fetchCart() {
    unavailable.value = false;
    try {
      const { $api } = useNuxtApp();
      const data: any = await $api('/cart');
      items.value = data.data || [];
    } catch (error) {
      if (isApiUnavailableError(error)) {
        useSystemStore().markDegraded();
        unavailable.value = true;
      }
      items.value = [];
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
    } catch (error) {
      if (isApiUnavailableError(error)) useSystemStore().markDegraded();
      items.value = [];
    }
  }

  return {
    items,
    unavailable,
    totalItems,
    totalPrice,
    fetchCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };
});
