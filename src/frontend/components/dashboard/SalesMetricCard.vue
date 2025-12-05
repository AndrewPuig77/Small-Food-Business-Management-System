<template>
  <div 
    class="metric-card" 
    :class="[`color-${color}`, { clickable: clickable }]"
    @click="handleClick"
  >
    <div class="metric-content">
      <p class="metric-label">{{ label }}</p>
      <p class="metric-value">{{ formattedValue }}</p>
      <div v-if="trend !== undefined" class="metric-trend" :class="trendClass">
        <svg v-if="trend > 0" class="trend-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <svg v-else-if="trend < 0" class="trend-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
        <span>{{ Math.abs(trend ?? 0).toFixed(1) }}%</span>
      </div>
      <p v-if="subtitle || comparison" class="metric-subtitle">
        {{ subtitle || comparison }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: String,
  value: [Number, String],
  format: {
    type: String,
    default: 'number',
    validator: (value) => ['number', 'currency', 'text', 'percentage'].includes(value)
  },
  trend: Number,
  subtitle: String,
  comparison: String,
  color: {
    type: String,
    default: 'blue'
  },
  clickable: Boolean
});

const emit = defineEmits(['click']);

const formattedValue = computed(() => {
  const val = props.value ?? 0;
  if (props.format === 'currency') {
    return `$${Number(val).toFixed(2)}`;
  } else if (props.format === 'percentage') {
    return `${Number(val).toFixed(1)}%`;
  } else if (props.format === 'text') {
    return val;
  } else {
    return val;
  }
});

const trendClass = computed(() => {
  if (props.trend > 0) return 'trend-up';
  if (props.trend < 0) return 'trend-down';
  return '';
});

const handleClick = () => {
  if (props.clickable) {
    emit('click');
  }
};
</script>

<style scoped>
.metric-card {
  position: relative;
  display: flex;
  gap: 1.25rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  transition: all 0.3s ease;
  overflow: hidden;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  transition: width 0.3s ease;
}

.metric-card.clickable {
  cursor: pointer;
}

.metric-card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.2);
}

.metric-card.clickable:hover::before {
  width: 100%;
  opacity: 0.1;
}

.metric-card.color-blue::before { background-color: #3b82f6; }
.metric-card.color-green::before { background-color: #10b981; }
.metric-card.color-orange::before { background-color: #f59e0b; }
.metric-card.color-red::before { background-color: #ef4444; }
.metric-card.color-purple::before { background-color: #8b5cf6; }
.metric-card.color-yellow::before { background-color: #eab308; }

.metric-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-label {
  font-size: 0.875rem;
  color: #9ca3af;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: #f9fafb;
  line-height: 1.2;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.metric-trend.trend-up {
  color: #4ade80;
}

.metric-trend.trend-down {
  color: #f87171;
}

.trend-icon {
  width: 16px;
  height: 16px;
}

.metric-subtitle {
  font-size: 0.8125rem;
  color: #6b7280;
  margin-top: 0.25rem;
}
</style>
