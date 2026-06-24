import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useWishlistStore = defineStore('wishlist', () => {
  const items = ref<any[]>([]);
  const productIds = ref<Set<string>>(new Set());
  const loaded = ref(false);

  const count = computed(() => items.value.length);

  async function fetchWishlist() {
    const { $api } = useNuxtApp();
    const data: any = await $api('/wishlist');
    items.value = data.data || [];
    productIds.value = new Set(
      items.value.map((i: any) => String(i.product?.id || i.productId)),
    );
    loaded.value = true;
    return items.value;
  }

  function isInWishlist(productId: string) {
    return productIds.value.has(String(productId));
  }

  async function addItem(productId: string) {
    const { $api } = useNuxtApp();
    await $api(`/wishlist/${productId}`, { method: 'POST' });
    productIds.value.add(String(productId));
    if (loaded.value) await fetchWishlist();
  }

  async function removeItem(productId: string) {
    const { $api } = useNuxtApp();
    await $api(`/wishlist/${productId}`, { method: 'DELETE' });
    productIds.value.delete(String(productId));
    items.value = items.value.filter(
      (i) => String(i.productId || i.product?.id) !== String(productId),
    );
  }

  async function toggle(productId: string) {
    if (isInWishlist(productId)) {
      await removeItem(productId);
      return false;
    }
    await addItem(productId);
    return true;
  }

  return {
    items,
    count,
    loaded,
    fetchWishlist,
    isInWishlist,
    addItem,
    removeItem,
    toggle,
  };
});
