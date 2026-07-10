import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useWishlistStore = defineStore('wishlist', () => {
  const items = ref<any[]>([]);
  /** Reactive id list — replace array (do not mutate Set) so UI tracks changes. */
  const productIdList = ref<string[]>([]);
  const loaded = ref(false);

  const count = computed(() => items.value.length);

  function syncIdsFromItems() {
    productIdList.value = items.value
      .map((i: any) => String(i.product?.id || i.productId))
      .filter(Boolean);
  }

  function setHasId(productId: string, present: boolean) {
    const id = String(productId);
    const has = productIdList.value.includes(id);
    if (present && !has) {
      productIdList.value = [...productIdList.value, id];
    } else if (!present && has) {
      productIdList.value = productIdList.value.filter((x) => x !== id);
    }
  }

  async function fetchWishlist() {
    const { $api } = useNuxtApp();
    const data: any = await $api('/wishlist');
    items.value = data.data || [];
    syncIdsFromItems();
    loaded.value = true;
    return items.value;
  }

  function isInWishlist(productId: string) {
    return productIdList.value.includes(String(productId));
  }

  async function addItem(productId: string) {
    const { $api } = useNuxtApp();
    const id = String(productId);
    if (isInWishlist(id)) return;

    // Optimistic: UI flips immediately
    setHasId(id, true);
    try {
      await $api(`/wishlist/${id}`, { method: 'POST' });
    } catch (error) {
      setHasId(id, false);
      throw error;
    }

    // Soft refresh — never roll back a successful POST if this fails
    if (loaded.value) {
      try {
        await fetchWishlist();
      } catch {
        /* keep optimistic state */
      }
    }
  }

  async function removeItem(productId: string) {
    const { $api } = useNuxtApp();
    const id = String(productId);
    if (!isInWishlist(id)) return;

    const prevItems = items.value;
    // Optimistic: UI flips immediately
    setHasId(id, false);
    items.value = items.value.filter(
      (i) => String(i.productId || i.product?.id) !== id,
    );
    try {
      await $api(`/wishlist/${id}`, { method: 'DELETE' });
    } catch (error) {
      setHasId(id, true);
      items.value = prevItems;
      throw error;
    }
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
    productIdList,
    count,
    loaded,
    fetchWishlist,
    isInWishlist,
    addItem,
    removeItem,
    toggle,
  };
});
