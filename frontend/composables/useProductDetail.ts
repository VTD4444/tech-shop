import { useAuthStore } from '~/stores/auth';

export function useProductDetail(slug: string) {
  const { $api } = useNuxtApp();
  const authStore = useAuthStore();

  const ratingSummary = ref<any>(null);
  const ratings = ref<any[]>([]);
  const ratingsMeta = ref<any>({ page: 1, totalPages: 1 });
  const comments = ref<any[]>([]);
  const commentsMeta = ref<any>({ page: 1, totalPages: 1 });
  const unratedOrders = ref<{ orderId: string; label: string }[]>([]);
  const loadingRatings = ref(false);
  const loadingComments = ref(false);

  async function fetchRatingSummary() {
    try {
      const res: any = await $api(`/products/${slug}/rating-summary`);
      ratingSummary.value = res.data ?? res;
    } catch {
      ratingSummary.value = { average: 0, count: 0, distribution: {} };
    }
  }

  async function fetchRatings(page = 1) {
    loadingRatings.value = true;
    try {
      const res: any = await $api(`/products/${slug}/ratings?page=${page}&limit=10`);
      ratings.value = res.data || [];
      ratingsMeta.value = res.meta || { page: 1, totalPages: 1 };
    } finally {
      loadingRatings.value = false;
    }
  }

  async function fetchComments(page = 1) {
    loadingComments.value = true;
    try {
      const res: any = await $api(`/products/${slug}/comments?page=${page}&limit=10`);
      comments.value = res.data || [];
      commentsMeta.value = res.meta || { page: 1, totalPages: 1 };
    } finally {
      loadingComments.value = false;
    }
  }

  async function fetchEngagement() {
    if (!authStore.isAuthenticated) {
      unratedOrders.value = [];
      return;
    }
    try {
      const res: any = await $api(`/products/${slug}/engagement`);
      unratedOrders.value = res.data?.unratedOrders ?? res.unratedOrders ?? [];
    } catch {
      unratedOrders.value = [];
    }
  }

  async function refreshEngagement() {
    await Promise.all([fetchRatingSummary(), fetchRatings(ratingsMeta.value.page), fetchEngagement()]);
  }

  async function initEngagement() {
    await Promise.all([fetchRatingSummary(), fetchRatings(1), fetchComments(1), fetchEngagement()]);
  }

  return {
    ratingSummary,
    ratings,
    ratingsMeta,
    comments,
    commentsMeta,
    unratedOrders,
    loadingRatings,
    loadingComments,
    fetchRatings,
    fetchComments,
    fetchEngagement,
    refreshEngagement,
    initEngagement,
  };
}
