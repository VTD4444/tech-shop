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

const props = defineProps<{ revenue?: number; orders?: number }>();

const period = ref<'7D' | '30D' | '90D'>('7D');

const chartData = computed(() => {
  const days = period.value === '7D' ? 7 : period.value === '30D' ? 30 : 90;
  const labels = Array.from({ length: Math.min(days, 7) }, (_, i) => `Day ${i + 1}`);
  const base = (props.revenue ?? 1000000) / 7;
  return {
    labels,
    datasets: [
      {
        label: 'Revenue (VND)',
        data: labels.map((_, i) => base * (0.7 + Math.random() * 0.6)),
        backgroundColor: 'rgba(0, 229, 195, 0.5)',
        borderColor: '#00E5C3',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
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
</script>

<template>
  <UiCard padding="md">
    <div class="flex items-center justify-between mb-4">
      <UiText as="h3" size="lg">Revenue Forecast</UiText>
      <div class="flex gap-1">
        <button
          v-for="p in (['7D', '30D', '90D'] as const)"
          :key="p"
          type="button"
          :class="[
            'px-3 py-1 text-xs rounded transition-colors',
            period === p ? 'bg-accent text-surface-0' : 'text-text-muted hover:bg-surface-3',
          ]"
          @click="period = p"
        >
          {{ p }}
        </button>
      </div>
    </div>
    <div class="h-64">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </UiCard>
</template>
