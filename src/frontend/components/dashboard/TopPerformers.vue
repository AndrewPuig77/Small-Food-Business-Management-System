<template>
  <div class="top-performers-widget">
    <div class="widget-header">
      <h3 class="widget-title">Top Selling Items</h3>
    </div>
    <div class="performers-content">
      <div v-if="!performers || !performers.topItems || performers.topItems.length === 0" class="empty-message">
        No sales data yet
      </div>
      <div v-else class="items-list">
        <div 
          v-for="(item, index) in (performers.topItems || [])" 
          :key="index"
          class="item-card"
        >
            <div class="item-rank">{{ index + 1 }}</div>
            <div class="item-info">
              <p class="item-name">{{ item.name }}</p>
              <p class="item-category">{{ item.category }}</p>
            </div>
            <div class="item-stats">
              <div class="stat">
                <span class="stat-value">{{ item.quantity }}</span>
                <span class="stat-label">sold</span>
              </div>
              <div class="stat">
                <span class="stat-value">${{ (item.revenue ?? 0).toFixed(2) }}</span>
                <span class="stat-label">revenue</span>
              </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  performers: {
    type: Object,
    default: () => ({ topItems: [], topEmployees: [] })
  }
});
</script>

<style scoped>
.top-performers-widget {
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

.performers-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #d1d5db;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.empty-message {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.item-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.item-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateX(4px);
}

.item-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: 50%;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #f9fafb;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-category {
  font-size: 0.8125rem;
  color: #9ca3af;
}

.item-stats {
  display: flex;
  gap: 1.5rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: #4ade80;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
}
</style>
