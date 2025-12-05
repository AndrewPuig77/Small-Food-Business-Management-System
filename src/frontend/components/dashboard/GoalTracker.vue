<template>
  <div class="goal-tracker-widget">
    <div class="widget-header">
      <h3 class="widget-title">Goal Tracking</h3>
    </div>
    <div class="goals-content">
      <!-- Daily Goal -->
      <div class="goal-section">
        <div class="goal-header">
          <h4 class="goal-title">Today's Goal</h4>
          <span class="goal-status" :class="`status-${dailyGoal.status}`">
            {{ dailyGoal.status }}
          </span>
        </div>
        <div class="goal-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${dailyGoal.progress}%` }"
              :class="`status-${dailyGoal.status}`"
            ></div>
          </div>
          <p class="progress-text">
            <span class="current">${{ (dailyGoal?.current ?? 0).toFixed(2) }}</span>
            <span class="separator">/</span>
            <span class="target">${{ (dailyGoal?.goal ?? 0).toFixed(2) }}</span>
          </p>
          <p class="progress-percent">{{ (dailyGoal?.progress ?? 0).toFixed(1) }}%</p>
        </div>
      </div>

      <!-- Monthly Goal -->
      <div class="goal-section">
        <div class="goal-header">
          <h4 class="goal-title">Monthly Goal</h4>
          <span class="goal-status" :class="`status-${monthlyGoal.status}`">
            {{ monthlyGoal.status }}
          </span>
        </div>
        <div class="goal-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${monthlyGoal.progress}%` }"
              :class="`status-${monthlyGoal.status}`"
            ></div>
          </div>
          <p class="progress-text">
            <span class="current">${{ (monthlyGoal?.current ?? 0).toFixed(2) }}</span>
            <span class="separator">/</span>
            <span class="target">${{ (monthlyGoal?.goal ?? 0).toFixed(2) }}</span>
          </p>
          <p class="progress-percent">{{ (monthlyGoal?.progress ?? 0).toFixed(1) }}%</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  dailyGoal: Object,
  monthlyGoal: Object
});
</script>

<style scoped>
.goal-tracker-widget {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  overflow: hidden;
}

.widget-header {
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

.goals-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.goal-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goal-title {
  font-size: 1rem;
  font-weight: 600;
  color: #e5e7eb;
  margin: 0;
}

.goal-status {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  border-radius: 1rem;
  letter-spacing: 0.05em;
}

.goal-status.status-achieved {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.goal-status.status-on-track {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

.goal-status.status-behind {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.goal-progress {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-bar {
  height: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.5s ease;
  border-radius: 6px;
}

.progress-fill.status-achieved {
  background: linear-gradient(90deg, #22c55e 0%, #4ade80 100%);
}

.progress-fill.status-on-track {
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
}

.progress-fill.status-behind {
  background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
}

.progress-text {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.current {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f9fafb;
}

.separator {
  color: #6b7280;
}

.target {
  color: #9ca3af;
}

.progress-percent {
  font-size: 1.5rem;
  font-weight: 700;
  color: #4ade80;
  text-align: right;
}
</style>
