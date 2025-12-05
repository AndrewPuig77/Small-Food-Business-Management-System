<template>
  <div class="financial-summary-widget">
    <div class="widget-header">
      <h3 class="widget-title">Financial Summary</h3>
      <div class="period-selector">
        <button 
          v-for="period in periods" 
          :key="period.value"
          @click="changePeriod(period.value)"
          class="period-btn"
          :class="{ active: activePeriod === period.value }"
        >
          {{ period.label }}
        </button>
      </div>
    </div>
    <div class="financial-content">
      <h4 class="period-title">{{ financialData.period }}</h4>
      <div class="financial-grid">
        <div class="financial-card">
          <svg class="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="card-content">
            <p class="card-label">Revenue</p>
            <p class="card-value positive">${{ (financialData?.revenue ?? 0).toFixed(2) }}</p>
          </div>
        </div>
        
        <div class="financial-card">
          <svg class="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <div class="card-content">
            <p class="card-label">Expenses</p>
            <p class="card-value negative">${{ (financialData?.expenses ?? 0).toFixed(2) }}</p>
          </div>
        </div>
        
        <div class="financial-card">
          <svg class="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <div class="card-content">
            <p class="card-label">Labor Cost</p>
            <p class="card-value">${{ (financialData?.laborCost ?? 0).toFixed(2) }}</p>
          </div>
        </div>
        
        <div class="financial-card highlight">
          <svg class="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <div class="card-content">
            <p class="card-label">Net Profit</p>
            <p class="card-value" :class="financialData.profit >= 0 ? 'positive' : 'negative'">
              ${{ Math.abs(financialData?.profit ?? 0).toFixed(2) }}
            </p>
          </div>
        </div>
        
        <div class="financial-card highlight">
          <svg class="card-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <div class="card-content">
            <p class="card-label">Profit Margin</p>
            <p class="card-value" :class="financialData.profitMargin >= 0 ? 'positive' : 'negative'">
              {{ (financialData?.profitMargin ?? 0).toFixed(1) }}%
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  financialData: Object
});

const emit = defineEmits(['period-change']);

const periods = ref([
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' }
]);

const activePeriod = ref('today');

const changePeriod = (period) => {
  activePeriod.value = period;
  emit('period-change', period);
};
</script>

<style scoped>
.financial-summary-widget {
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

.financial-content {
  padding: 1.5rem;
}

.period-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}

.financial-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.financial-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.625rem;
  transition: all 0.2s;
}

.financial-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

.financial-card.highlight {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
  border-color: rgba(59, 130, 246, 0.3);
}

.card-icon {
  width: 40px;
  height: 40px;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #9ca3af;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 0.8125rem;
  color: #9ca3af;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #e5e7eb;
}

.card-value.positive {
  color: #4ade80;
}

.card-value.negative {
  color: #f87171;
}
</style>
