<template>
  <div class="sales-chart-widget">
    <div class="widget-header">
      <h3 class="widget-title">Sales Trend</h3>
      <div class="period-selector">
        <button 
          v-for="p in periods" 
          :key="p.value"
          @click="changePeriod(p.value)"
          class="period-btn"
          :class="{ active: period === p.value }"
        >
          {{ p.label }}
        </button>
      </div>
    </div>
    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  period: {
    type: String,
    default: 'week'
  }
});

const emit = defineEmits(['period-change']);

const chartCanvas = ref(null);
let chartInstance = null;

const periods = ref([
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' }
]);

onMounted(async () => {
  await nextTick();
  renderChart();
});

watch(() => props.data, () => {
  renderChart();
}, { deep: true });

const changePeriod = (newPeriod) => {
  emit('period-change', newPeriod);
};

const renderChart = () => {
  if (!chartCanvas.value || props.data.length === 0) return;
  
  const ctx = chartCanvas.value.getContext('2d');
  const width = chartCanvas.value.offsetWidth;
  const height = 300;
  
  chartCanvas.value.width = width;
  chartCanvas.value.height = height;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Calculate max value for scaling
  const maxSales = Math.max(...props.data.map(d => d.sales), 1);
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  // Draw grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = padding + (chartHeight / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }
  
  // Draw bars
  const barWidth = chartWidth / props.data.length;
  const barPadding = barWidth * 0.2;
  
  props.data.forEach((point, index) => {
    const barHeight = (point.sales / maxSales) * chartHeight;
    const x = padding + index * barWidth + barPadding / 2;
    const y = height - padding - barHeight;
    
    // Gradient fill
    const gradient = ctx.createLinearGradient(0, y, 0, height - padding);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.2)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth - barPadding, barHeight);
    
    // Draw date label
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    const date = new Date(point.date);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    ctx.fillText(label, x + (barWidth - barPadding) / 2, height - padding + 20);
    
    // Draw value on top of bar
    ctx.fillStyle = '#e5e7eb';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`$${(point.sales ?? 0).toFixed(0)}`, x + (barWidth - barPadding) / 2, y - 5);
  });
};
</script>

<style scoped>
.sales-chart-widget {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  overflow: hidden;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.widget-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #f9fafb;
  margin: 0;
}

.period-selector {
  display: flex;
  gap: 0.5rem;
}

.period-btn {
  padding: 0.375rem 0.875rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #9ca3af;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.period-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e5e7eb;
}

.period-btn.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
  color: #93c5fd;
}

.chart-container {
  padding: 1.5rem;
  min-height: 300px;
}

canvas {
  width: 100%;
  height: 300px;
}
</style>
