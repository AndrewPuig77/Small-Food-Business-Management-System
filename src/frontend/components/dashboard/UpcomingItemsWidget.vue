<template>
  <div class="upcoming-items-widget">
    <div class="widget-header">
      <h3 class="widget-title">Upcoming Items</h3>
    </div>
    <div class="upcoming-content">
      <!-- Upcoming Shifts -->
      <div class="section" v-if="upcomingShifts.length > 0">
        <h4 class="section-title">Next Shift (Within 2 Hours)</h4>
        <div class="items-list">
          <div v-for="shift in upcomingShifts" :key="shift.id" class="item">
            <svg class="item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div class="item-info">
              <p class="item-main">{{ shift.employee_name }}</p>
              <p class="item-sub">{{ formatShiftTime(shift.shift_date, shift.start_time) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pending Time-Off Requests -->
      <div class="section" v-if="timeOffRequests.length > 0">
        <h4 class="section-title">Pending Time-Off Requests</h4>
        <div class="items-list">
          <div v-for="request in timeOffRequests" :key="request.id" class="item">
            <svg class="item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="item-info">
              <p class="item-main">{{ request.employee_name }}</p>
              <p class="item-sub">{{ formatDateRange(request.start_date, request.end_date) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Items Needing Reorder -->
      <div class="section" v-if="reorderItems.length > 0">
        <h4 class="section-title">Items Needing Reorder</h4>
        <div class="items-list">
          <div v-for="item in reorderItems" :key="item.name" class="item">
            <svg class="item-icon alert" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div class="item-info">
              <p class="item-main">{{ item.name }}</p>
              <p class="item-sub">Current: {{ item.quantity }} / Min: {{ item.min_quantity }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="upcomingShifts.length === 0 && timeOffRequests.length === 0 && reorderItems.length === 0" class="empty-state">
        <p>No upcoming items to display</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  upcomingShifts: {
    type: Array,
    default: () => []
  },
  timeOffRequests: {
    type: Array,
    default: () => []
  },
  reorderItems: {
    type: Array,
    default: () => []
  }
});

const formatShiftTime = (date, time) => {
  const shiftDate = new Date(date + 'T' + time);
  return shiftDate.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit' 
  });
};

const formatDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
};
</script>

<style scoped>
.upcoming-items-widget {
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

.upcoming-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.item-icon {
  width: 20px;
  height: 20px;
  color: #9ca3af;
  flex-shrink: 0;
}

.item-icon.alert {
  color: #fbbf24;
}

.item-info {
  flex: 1;
}

.item-main {
  font-size: 0.875rem;
  font-weight: 600;
  color: #e5e7eb;
  margin-bottom: 0.125rem;
}

.item-sub {
  font-size: 0.75rem;
  color: #9ca3af;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
}
</style>
