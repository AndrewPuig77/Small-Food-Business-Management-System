<template>
  <div class="live-orders-widget">
    <div class="widget-header">
      <h3 class="widget-title">Live Orders</h3>
      <span class="order-count">{{ orders.length }} Active</span>
    </div>
    <div class="orders-list">
      <div 
        v-if="orders.length === 0"
        class="empty-state"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="empty-icon">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>No active orders</p>
      </div>
      <div 
        v-else
        v-for="order in orders" 
        :key="order.id"
        @click="$emit('order-click', order)"
        class="order-card"
        :class="`status-${order.status}`"
      >
        <div class="order-header">
          <div class="order-info">
            <span class="order-number">#{{ order.id }}</span>
            <span class="order-time">{{ formatTime(order.created_at) }}</span>
          </div>
          <span class="order-status-badge">{{ order.status }}</span>
        </div>
        <div class="order-items">
          <p v-for="item in order.items" :key="item.id" class="order-item">
            {{ item.quantity }}x {{ item.name }}
          </p>
        </div>
        <div class="order-footer">
          <span class="order-total">${{ (order.total ?? 0).toFixed(2) }}</span>
          <span class="order-timer" :class="getTimerClass(order.created_at)">
            {{ getElapsedTime(order.created_at) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  orders: {
    type: Array,
    default: () => []
  }
});

defineEmits(['order-click']);

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const getElapsedTime = (timestamp) => {
  const now = new Date();
  const orderTime = new Date(timestamp);
  const diffMinutes = Math.floor((now - orderTime) / 60000);
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours}h ${minutes}m ago`;
};

const getTimerClass = (timestamp) => {
  const now = new Date();
  const orderTime = new Date(timestamp);
  const diffMinutes = Math.floor((now - orderTime) / 60000);
  
  if (diffMinutes > 30) return 'timer-critical';
  if (diffMinutes > 15) return 'timer-warning';
  return 'timer-normal';
};
</script>

<style scoped>
.live-orders-widget {
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

.order-count {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: 1rem;
}

.orders-list {
  max-height: 500px;
  overflow-y: auto;
  padding: 1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.order-card {
  padding: 1rem;
  margin-bottom: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 4px solid;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.order-card:hover {
  transform: translateX(4px);
  background: rgba(255, 255, 255, 0.08);
}

.order-card.status-pending {
  border-left-color: #eab308;
}

.order-card.status-processing {
  border-left-color: #3b82f6;
}

.order-card.status-ready {
  border-left-color: #22c55e;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.order-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.order-number {
  font-size: 1rem;
  font-weight: 700;
  color: #f9fafb;
}

.order-time {
  font-size: 0.8125rem;
  color: #9ca3af;
}

.order-status-badge {
  padding: 0.25rem 0.625rem;
  background: rgba(255, 255, 255, 0.1);
  color: #e5e7eb;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  border-radius: 0.25rem;
  letter-spacing: 0.05em;
}

.order-items {
  margin-bottom: 0.75rem;
}

.order-item {
  font-size: 0.875rem;
  color: #d1d5db;
  margin-bottom: 0.25rem;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-total {
  font-size: 1.125rem;
  font-weight: 700;
  color: #4ade80;
}

.order-timer {
  font-size: 0.8125rem;
  font-weight: 600;
}

.timer-normal {
  color: #4ade80;
}

.timer-warning {
  color: #fbbf24;
}

.timer-critical {
  color: #f87171;
}
</style>
