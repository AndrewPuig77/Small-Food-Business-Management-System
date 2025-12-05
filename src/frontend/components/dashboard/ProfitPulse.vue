<template>
  <div class="profit-pulse" :class="`status-${status}`">
    <div class="pulse-indicator">
      <div class="pulse-circle">
        <svg v-if="status === 'positive'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else-if="status === 'neutral'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="pulse-rings"></div>
    </div>
    <div class="pulse-content">
      <h3 class="pulse-title">Business Health</h3>
      <p class="pulse-message">{{ message }}</p>
      <div class="pulse-stats">
        <div class="stat-item">
          <span class="stat-label">Profit</span>
          <span class="stat-value" :class="profit >= 0 ? 'positive' : 'negative'">
            ${{ Math.abs(profit ?? 0).toFixed(2) }}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Margin</span>
          <span class="stat-value">{{ (profitMargin ?? 0).toFixed(1) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  status: {
    type: String,
    default: 'neutral',
    validator: (value) => ['positive', 'neutral', 'negative'].includes(value)
  },
  message: String,
  profit: Number,
  profitMargin: Number
});
</script>

<style scoped>
.profit-pulse {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%);
  border: 2px solid;
  border-radius: 1rem;
  position: relative;
  overflow: hidden;
}

.status-positive {
  border-color: rgba(34, 197, 94, 0.3);
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%);
}

.status-neutral {
  border-color: rgba(234, 179, 8, 0.3);
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(234, 179, 8, 0.05) 100%);
}

.status-negative {
  border-color: rgba(239, 68, 68, 0.3);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
}

.pulse-indicator {
  position: relative;
  flex-shrink: 0;
}

.pulse-circle {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  z-index: 2;
}

.status-positive .pulse-circle {
  background: rgba(34, 197, 94, 0.2);
  border: 3px solid #22c55e;
}

.status-neutral .pulse-circle {
  background: rgba(234, 179, 8, 0.2);
  border: 3px solid #eab308;
}

.status-negative .pulse-circle {
  background: rgba(239, 68, 68, 0.2);
  border: 3px solid #ef4444;
}

.pulse-circle svg {
  width: 40px;
  height: 40px;
}

.status-positive .pulse-circle svg {
  color: #22c55e;
}

.status-neutral .pulse-circle svg {
  color: #eab308;
}

.status-negative .pulse-circle svg {
  color: #ef4444;
}

.pulse-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  z-index: 1;
}

.pulse-rings::before,
.pulse-rings::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  animation: pulse 2s ease-out infinite;
}

.pulse-rings::before {
  width: 100%;
  height: 100%;
  animation-delay: 0s;
}

.pulse-rings::after {
  width: 100%;
  height: 100%;
  animation-delay: 1s;
}

.status-positive .pulse-rings::before,
.status-positive .pulse-rings::after {
  border: 2px solid rgba(34, 197, 94, 0.6);
}

.status-neutral .pulse-rings::before,
.status-neutral .pulse-rings::after {
  border: 2px solid rgba(234, 179, 8, 0.6);
}

.status-negative .pulse-rings::before,
.status-negative .pulse-rings::after {
  border: 2px solid rgba(239, 68, 68, 0.6);
}

@keyframes pulse {
  0% {
    width: 80px;
    height: 80px;
    opacity: 1;
  }
  100% {
    width: 140px;
    height: 140px;
    opacity: 0;
  }
}

.pulse-content {
  flex: 1;
}

.pulse-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f9fafb;
  margin-bottom: 0.5rem;
}

.pulse-message {
  font-size: 1rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.pulse-stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f9fafb;
}

.stat-value.positive {
  color: #4ade80;
}

.stat-value.negative {
  color: #f87171;
}
</style>
