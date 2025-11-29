<template>
  <div class="app-container">
    <Sidebar />
    
    <div class="kitchen-view">
      <div class="kitchen-header">
        <h1>Kitchen Display</h1>
        <div class="header-actions">
          <div class="filter-tabs">
            <button 
              @click="activeFilter = 'all'" 
              :class="['tab-btn', { active: activeFilter === 'all' }]"
            >
              All Orders ({{ orders.length }})
            </button>
            <button 
              @click="activeFilter = 'pending'" 
              :class="['tab-btn', { active: activeFilter === 'pending' }]"
            >
              Pending ({{ pendingCount }})
            </button>
            <button 
              @click="activeFilter = 'preparing'" 
              :class="['tab-btn', { active: activeFilter === 'preparing' }]"
            >
              Preparing ({{ preparingCount }})
            </button>
            <button 
              @click="activeFilter = 'ready'" 
              :class="['tab-btn', { active: activeFilter === 'ready' }]"
            >
              Ready ({{ readyCount }})
            </button>
          </div>
            <div class="header-right-actions">
            <button @click="loadOrders" class="btn-refresh">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          
            </div>
        </div>
      </div>

      <div v-if="filteredOrders.length === 0" class="empty-state">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>No {{ activeFilter === 'all' ? '' : activeFilter }} orders</p>
      </div>

      <div v-else class="orders-grid">
        <div 
          v-for="(order, index) in filteredOrders" 
          :key="order.id" 
          :class="['order-card', `status-${order.kitchen_status}`]"
        >
          <div class="order-header">
            <div class="order-number">
              <span class="label">Order</span>
              <span class="number">#{{ order.daily_order_number || (index + 1) }}</span>
            </div>
            <div class="order-time">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="clock-icon">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="time-block">
                <div class="placed">Placed: {{ formatTimeOnly(order.created_at) }}</div>
                <div v-if="order.kitchen_status === 'pending'" class="elapsed">
                  Elapsed: {{ formatElapsed(order.created_at) }}
                </div>
                <div v-else-if="order.kitchen_status === 'preparing'" class="cooking">
                  Cooking: {{ formatElapsed(order.kitchen_started_at || order.created_at) }}
                </div>
                <div v-else-if="order.kitchen_status === 'ready' || order.kitchen_status === 'completed'" class="finished">
                  Finished: {{ formatTimeOnly(order.kitchen_completed_at || order.updated_at) }} — Took: {{ formatElapsed(order.created_at, order.kitchen_completed_at || order.updated_at) }}
                </div>
                <div v-else class="age">{{ getOrderAge(order.created_at) }}</div>
              </div>
            </div>
          </div>

          <div class="order-details">
            <div class="order-type">
              <svg v-if="order.order_type === 'dine-in'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <svg v-else-if="order.order_type === 'takeout'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
              <span>{{ formatOrderType(order.order_type) }}</span>
            </div>
            <div v-if="order.table_number" class="table-number">
              Table {{ order.table_number }}
            </div>
          </div>

          <div class="order-items">
            <div 
              v-for="(item, index) in parseOrderItems(order.items)" 
              :key="index" 
              class="order-item"
            >
              <div class="item-quantity">{{ item.quantity }}x</div>
              <div class="item-details">
                <div class="item-name">{{ item.name }}</div>
                <div v-if="item.modifiers && item.modifiers.length > 0" class="item-modifiers">
                  <span v-for="(mod, i) in item.modifiers" :key="i" class="modifier">
                    {{ mod }}
                  </span>
                </div>
                <div v-if="item.notes" class="item-notes">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {{ item.notes }}
                </div>
              </div>
            </div>
          </div>

          <div class="order-actions">
            <button 
              v-if="order.kitchen_status === 'pending'" 
              @click="updateOrderStatus(order.id, 'preparing')"
              class="btn-action btn-start"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Cooking
            </button>
            <button 
              v-else-if="order.kitchen_status === 'preparing'" 
              @click="updateOrderStatus(order.id, 'ready')"
              class="btn-action btn-ready"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mark Ready
            </button>
            <button 
              v-else-if="order.kitchen_status === 'ready'" 
              @click="updateOrderStatus(order.id, 'completed')"
              class="btn-action btn-complete"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Complete
            </button>
            <button
              @click="deleteOrder(order.id)"
              class="btn-action btn-delete"
              title="Delete Order"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Sidebar from '../components/Sidebar.vue';
import { useModals } from '../composables/useModals.js';

const { ipcRenderer } = window.require('electron');

// Modal utilities
const { showConfirm, showError, showSuccess } = useModals();

const orders = ref([]);
const activeFilter = ref('all');
let refreshInterval = null;
const now = ref(new Date());
let clockInterval = null;

const businessId = ref(null);

const pendingCount = computed(() => orders.value.filter(o => o.kitchen_status === 'pending').length);
const preparingCount = computed(() => orders.value.filter(o => o.kitchen_status === 'preparing').length);
const readyCount = computed(() => orders.value.filter(o => o.kitchen_status === 'ready').length);

const filteredOrders = computed(() => {
  if (activeFilter.value === 'all') {
    return orders.value;
  }
  return orders.value.filter(o => o.kitchen_status === activeFilter.value);
});

const loadOrders = async () => {
  if (!businessId.value) return;
  
  try {
    const allOrders = await ipcRenderer.invoke('pos:get-orders', { businessId: businessId.value });
    console.log('Kitchen Display - All orders received:', allOrders);
    
    // Filter orders that are not completed or cancelled
    orders.value = allOrders
      .filter(order => order.kitchen_status !== 'completed' && order.status !== 'cancelled')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    // Fallback: for any order with empty items, fetch full transaction
    await Promise.all(
      orders.value.map(async (order) => {
        try {
          const parsed = parseOrderItems(order.items);
          if (!parsed || parsed.length === 0) {
            const tx = await ipcRenderer.invoke('pos:get-transaction', { businessId: businessId.value, transactionId: order.id });
            if (tx && Array.isArray(tx.items)) {
              const normalized = tx.items.map(it => ({
                name: it.item_name || it.name || 'Item',
                quantity: it.quantity || 1,
                notes: it.notes || '',
                modifiers: (() => {
                  if (!it.modifiers) return [];
                  try {
                    const m = typeof it.modifiers === 'string' ? JSON.parse(it.modifiers) : it.modifiers;
                    return Array.isArray(m) ? m.map(mm => (typeof mm === 'string' ? mm : (mm?.name || JSON.stringify(mm)))) : [];
                  } catch {
                    return [];
                  }
                })()
              }));
              order.items = JSON.stringify(normalized);
            }
          }
        } catch (e) {
          console.warn('Fallback item load failed for order', order.id, e);
        }
      })
    );

    console.log('Kitchen Display - Filtered orders:', orders.value);
  } catch (error) {
    console.error('Error loading kitchen orders:', error);
    showError(error.message || 'Failed to load kitchen orders');
  }
};

const updateOrderStatus = async (orderId, newStatus) => {
  try {
    await ipcRenderer.invoke('pos:update-order-kitchen-status', {
      businessId: businessId.value,
      orderId,
      kitchenStatus: newStatus
    });
    // Optimistically update the UI so timers stop immediately even if backend
    // hasn't yet written the completion timestamp. This provides instant feedback.
    try {
      const idx = orders.value.findIndex(o => o.id === orderId);
      if (idx > -1) {
        orders.value[idx].kitchen_status = newStatus;
        const nowIso = new Date().toISOString();
        if (newStatus === 'preparing') {
          // set kitchen_started_at if not already present
          if (!orders.value[idx].kitchen_started_at) orders.value[idx].kitchen_started_at = nowIso;
        }
        if (newStatus === 'ready' || newStatus === 'completed') {
          // set completed timestamp for immediate UI stop
          orders.value[idx].kitchen_completed_at = nowIso;
        }
      }
    } catch (e) {
      console.warn('Optimistic UI update failed for order', orderId, e);
    }

    // Refresh from backend to get authoritative timestamps
    await loadOrders();

    // If backend did not provide a completion timestamp, ensure the UI shows a finished time
    try {
      const idx2 = orders.value.findIndex(o => o.id === orderId);
      if (idx2 > -1) {
        const o = orders.value[idx2];
        if ((newStatus === 'ready' || newStatus === 'completed') && !o.kitchen_completed_at) {
          // set local completion time so the timer stops and finished time is visible
          o.kitchen_completed_at = new Date().toISOString();
          // also update updated_at for display fallback
          o.updated_at = o.updated_at || new Date().toISOString();
          // write back to reactive array
          orders.value.splice(idx2, 1, Object.assign({}, o));
          try { console.log('[Kitchen] applied local completion time for order', orderId); } catch(e) {}
        }
      }
    } catch (e) {
      console.warn('Post-loadOrders completion fallback failed for', orderId, e);
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    showError(error.message || 'Failed to update order status');
  }
};

const deleteOrder = async (orderId) => {
  const confirmed = await showConfirm('Delete this order? This cannot be undone.', null, {
    title: 'Delete Order',
    type: 'danger',
    confirmText: 'Delete',
    cancelText: 'Cancel'
  });
  if (!confirmed) return;
  try {
    const result = await ipcRenderer.invoke('pos:delete-transaction', { businessId: businessId.value, orderId });
    if (result?.success) {
      showSuccess('Order deleted successfully');
    } else {
      showError(result?.error || 'Failed to delete order');
    }
    await loadOrders();
  } catch (error) {
    console.error('Error deleting order:', error);
    showError(error.message || 'Error deleting order');
  }
};

// Daily order numbering handled on backend via `daily_order_number` per transaction

const parseOrderItems = (itemsJson) => {
  try {
    const raw = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : (itemsJson || []);
    return (raw || []).map(it => {
      const modifiers = Array.isArray(it.modifiers)
        ? it.modifiers.map(m => (typeof m === 'string' ? m : (m?.name || JSON.stringify(m))))
        : [];
      return {
        name: it.name || it.item_name || 'Item',
        quantity: it.quantity || 1,
        notes: it.notes || '',
        modifiers
      };
    });
  } catch (error) {
    console.error('Error parsing order items:', error);
    return [];
  }
};

const formatOrderType = (type) => {
  const types = {
    'dine-in': 'Dine In',
    'takeout': 'Takeout',
    'delivery': 'Delivery'
  };
  return types[type] || type;
};

const getOrderAge = (createdAt) => {
  try {
    if (!createdAt) return 'Time unknown';

    let created = new Date(createdAt);
    if (isNaN(created.getTime())) {
      // Try parsing numeric timestamps; handle seconds vs milliseconds
      const num = Number(createdAt);
      if (!Number.isNaN(num)) {
        created = new Date(num < 10_000_000_000 ? num * 1000 : num);
      }
    }

    const now = new Date();
    let diffMs = now - created;
    if (diffMs < 0) diffMs = 0; // Guard future timestamps

    const totalMinutes = Math.floor(diffMs / 1000 / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0 && minutes === 0) return 'Just now';
    if (hours === 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    if (minutes === 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    return `${hours} hour${hours === 1 ? '' : 's'} ${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  } catch {
    return 'Time unknown';
  }
};

const parseTimestamp = (ts) => {
  if (!ts) return null;
  // If it's already a Date
  if (ts instanceof Date) return ts;

  // Handle numeric timestamps (seconds or milliseconds)
  const num = Number(ts);
  if (!Number.isNaN(num)) {
    return new Date(num < 10000000000 ? num * 1000 : num);
  }

  // Handle common SQLite datetime format 'YYYY-MM-DD HH:MM:SS' by parsing components as local time
  try {
    const m = ts.match(/^\s*(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})\s*$/);
    if (m) {
      const y = parseInt(m[1], 10);
      const mo = parseInt(m[2], 10) - 1;
      const d = parseInt(m[3], 10);
      const hh = parseInt(m[4], 10);
      const mm = parseInt(m[5], 10);
      const ss = parseInt(m[6], 10);
      // Construct as local time first
      const localDate = new Date(y, mo, d, hh, mm, ss);
      const nowCheck = new Date();
      // If the parsed local time is in the future (more than 60s),
      // try interpreting the timestamp as UTC (some DBs store UTC)
      if (localDate - nowCheck > 60 * 1000) {
        const utcDate = new Date(Date.UTC(y, mo, d, hh, mm, ss));
        if (utcDate <= nowCheck) return utcDate;
      }
      return localDate;
    }
  } catch (e) {
    // fall through to generic parse
  }

  // Fallback: try Date constructor (may parse ISO correctly)
  const parsed = new Date(ts);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const formatTimestamp = (ts) => {
  const d = parseTimestamp(ts);
  if (!d) return 'Time unknown';
  return d.toLocaleString();
};

const formatTimeOnly = (ts) => {
  const d = parseTimestamp(ts);
  if (!d) return '--:--:--';
  return d.toLocaleTimeString();
};

const formatElapsed = (startTs, endTs) => {
  const start = parseTimestamp(startTs);
  if (!start) return '--';
  const end = endTs ? parseTimestamp(endTs) : now.value;
  if (!end) return '--';
  let diff = Math.max(0, end - start);
  const hours = Math.floor(diff / 3600000);
  diff -= hours * 3600000;
  const minutes = Math.floor(diff / 60000);
  diff -= minutes * 60000;
  const seconds = Math.floor(diff / 1000);
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

onMounted(async () => {
  // Start live clock for timers (updates every second)
  now.value = new Date();
  clockInterval = setInterval(() => {
    now.value = new Date();
  }, 1000);

  const user = JSON.parse(localStorage.getItem('currentUser'));
  // AuthService returns `businessId` (camelCase), not `business_id`
  if (user && (user.businessId || user.business_id)) {
    // Support both just in case of older stored objects
    businessId.value = user.businessId || user.business_id;
    await loadOrders();
    
    // Auto-refresh every 30 seconds
    refreshInterval = setInterval(loadOrders, 30000);
  }
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  if (clockInterval) {
    clearInterval(clockInterval);
  }
});
</script>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(to bottom right, #111827, #1f2937, #000000);
}

.kitchen-view {
  flex: 1;
  margin-left: 250px;
  padding: 2rem;
  height: 100vh;
  overflow-y: auto;
}

.kitchen-header {
  margin-bottom: 2rem;
}

.kitchen-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #f3f4f6;
  margin-bottom: 1.5rem;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.375rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.tab-btn {
  padding: 0.625rem 1.25rem;
  background: transparent;
  border: none;
  color: #9ca3af;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #d1d5db;
}

.tab-btn.active {
  background: #3b82f6;
  color: white;
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 0.5rem;
  color: #60a5fa;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

/* Reset button removed — daily numbering used instead */

.btn-refresh:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
}

.btn-refresh svg {
  width: 18px;
  height: 18px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #6b7280;
}

.empty-state svg {
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
}

.empty-state p {
  font-size: 1.125rem;
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.order-card {
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.2s;
}

.order-card.status-pending {
  border-color: rgba(251, 191, 36, 0.3);
}

.order-card.status-preparing {
  border-color: rgba(59, 130, 246, 0.3);
  background: rgba(59, 130, 246, 0.05);
}

.order-card.status-ready {
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.order-number {
  display: flex;
  flex-direction: column;
}

.order-number .label {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.order-number .number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
}

.order-time {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.5rem;
  color: #fca5a5;
  font-weight: 600;
}

.order-time .time-block {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.order-time .placed {
  font-size: 0.85rem;
  color: #f3f4f6;
  font-weight: 600;
}
.order-time .cooking {
  font-size: 0.85rem;
  color: #60a5fa;
  font-weight: 700;
}
.order-time .elapsed {
  font-size: 0.95rem;
  color: #f59e0b;
  font-weight: 700;
}
.order-time .finished {
  font-size: 0.85rem;
  color: #bbf7d0;
  font-weight: 700;
}
.order-time .age {
  font-size: 0.85rem;
  color: #fca5a5;
}

.clock-icon {
  width: 16px;
  height: 16px;
}

.order-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-type {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #d1d5db;
  font-weight: 500;
}

.order-type svg {
  width: 20px;
  height: 20px;
}

.table-number {
  padding: 0.375rem 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 0.375rem;
  color: #93c5fd;
  font-weight: 600;
  font-size: 0.875rem;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
}

.item-quantity {
  font-size: 1.25rem;
  font-weight: 700;
  color: #60a5fa;
  min-width: 40px;
}

.item-details {
  flex: 1;
}

.item-name {
  font-weight: 600;
  color: #f3f4f6;
  font-size: 1.0rem;
  margin-bottom: 0.25rem;
}

.item-modifiers {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 0.25rem;
}

.modifier {
  padding: 0.125rem 0.5rem;
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.2);
  border-radius: 0.25rem;
  color: #c084fc;
  font-size: 0.75rem;
}

.item-notes {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 0.375rem;
  color: #fbbf24;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.item-notes svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.order-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn-action {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action svg {
  width: 20px;
  height: 20px;
}

.btn-start {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #60a5fa;
}

.btn-start:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
}

.btn-ready {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #4ade80;
}

.btn-ready:hover {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.5);
}

.btn-complete {
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.3);
  color: #c084fc;
}

.btn-complete:hover {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.5);
}

.btn-delete {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.22);
  border-color: rgba(239, 68, 68, 0.5);
}
</style>
