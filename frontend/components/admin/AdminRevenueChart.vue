<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'vue-chartjs';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const props = defineProps<{
  monthlyData?: { label: string; revenue: number; orders: number }[];
}>();

const { $api } = useNuxtApp();
const loading = ref(true);
const data = ref<{ label: string; revenue: number; orders: number }[]>([]);

const chartData = computed(() => ({
  labels: data.value.map((d) => d.label),
  datasets: [
    {
      label: 'Revenue (VND)',
      data: data.value.map((d) => d.revenue),
      backgroundColor: 'rgba(0, 229, 195, 0.5)',
      borderColor: '#00E5C3',
      borderWidth: 1,
      borderRadius: 4,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#94A3B8' },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#94A3B8' },
    },
  },
};

async function loadChart() {
  if (props.monthlyData?.length) {
    data.value = props.monthlyData;
    loading.value = false;
    return;
  }
  try {
    const res: any = await $api('/admin/analytics/revenue-by-month?months=12');
    data.value = res.data || [];
  } catch {
    data.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(loadChart);
watch(() => props.monthlyData, loadChart);
</script>

<template>
  <UiCard padding="md">
    <UiText as="h3" size="lg" class="mb-4">Revenue by Month</UiText>
    <div class="h-64">
      <ClientOnly>
        <div v-if="loading" class="h-full flex items-center justify-center text-sm text-text-muted">
          Loading chart...
        </div>
        <Bar v-else-if="data.length" :data="chartData" :options="chartOptions" />
        <div v-else class="h-full flex items-center justify-center text-sm text-text-muted">
          No paid orders yet
        </div>
        <template #fallback>
          <div class="h-full flex items-center justify-center text-sm text-text-muted">Loading chart...</div>
        </template>
      </ClientOnly>
    </div>
  </UiCard>
</template>
