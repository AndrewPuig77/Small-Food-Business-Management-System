<template>
  <div class="alerts-panel">
    <div class="alerts-header">
      <div class="header-left">
        <svg class="alert-bell" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <h3>System Alerts</h3>
        <span class="alert-count">{{ alerts.length }}</span>
      </div>
      <button @click="dismissAll" class="btn-dismiss-all">Dismiss All</button>
    </div>
    <div class="alerts-list">
      <div 
        v-for="alert in alerts" 
        :key="alert.id || alert.message"
        class="alert-item"
        :class="`alert-${alert.type}`"
      >
        <div class="alert-icon">
          <svg v-if="alert.type === 'critical'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <svg v-else-if="alert.type === 'warning'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="alert-content">
          <p class="alert-category">{{ alert.category }}</p>
          <p class="alert-message">{{ alert.message }}</p>
        </div>
        <button 
          v-if="alert.action"
          @click="handleAction(alert)" 
          class="btn-action"
        >
          {{ alert.action }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  alerts: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['alert-action', 'dismiss-all']);

const handleAction = (alert) => {
  emit('alert-action', alert);
};

const dismissAll = () => {
  emit('dismiss-all');
};
</script>

<style scoped>
.alerts-panel {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.75rem;
  overflow: hidden;
}

.alerts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(239, 68, 68, 0.2);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.alert-bell {
  width: 20px;
  height: 20px;
  color: #fca5a5;
}

.alerts-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #fef2f2;
  margin: 0;
}

.alert-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 0.5rem;
  background: rgba(239, 68, 68, 0.3);
  color: #fef2f2;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 12px;
}

.btn-dismiss-all {
  padding: 0.375rem 0.875rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fef2f2;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-dismiss-all:hover {
  background: rgba(255, 255, 255, 0.15);
}

.alerts-list {
  max-height: 300px;
  overflow-y: auto;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.2s;
}

.alert-item:last-child {
  border-bottom: none;
}

.alert-item:hover {
  background: rgba(255, 255, 255, 0.03);
}

.alert-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  flex-shrink: 0;
}

.alert-icon svg {
  width: 24px;
  height: 24px;
}

.alert-critical .alert-icon {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.alert-warning .alert-icon {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
}

.alert-info .alert-icon {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

.alert-content {
  flex: 1;
}

.alert-category {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}

.alert-message {
  font-size: 0.9375rem;
  color: #e5e7eb;
  font-weight: 500;
}

.btn-action {
  padding: 0.5rem 1rem;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #93c5fd;
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-action:hover {
  background: rgba(59, 130, 246, 0.25);
  border-color: rgba(59, 130, 246, 0.5);
}
</style>
