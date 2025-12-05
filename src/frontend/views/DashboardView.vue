<template>
  <div class="dashboard">
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="business-info">
        <h1 class="business-title">{{ businessName }}</h1>
        <span class="text-sm text-gray-300">Food Business Management</span>
      </div>
      <div class="user-menu">
        <div class="user-info">
          <span class="text-white font-medium">{{ currentUser?.fullName }}</span>
          <span class="text-xs text-gray-300">{{ currentUser?.role }}</span>
        </div>
        <button @click="handleLogout" class="btn-logout">
          Logout
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Sidebar Navigation -->
      <Sidebar />

      <!-- Content Area -->
      <main class="content">
        <div class="content-header">
          <div>
            <h2 class="text-3xl font-bold text-white mb-2">Welcome back, {{ currentUser?.fullName }}!</h2>
            <p class="text-gray-300">{{ getCurrentGreeting() }}</p>
          </div>
          <div class="header-actions">
            <button class="refresh-btn" @click="refreshDashboard">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        <!-- Enhanced Metrics Section -->
        <div class="dashboard-grid">
          <!-- Key Metrics Row -->
          <div class="metrics-row">
            <SalesMetricCard
              v-if="dashboardData.overview"
              label="Today's Sales"
              :value="dashboardData.overview.todaySales || 0"
              format="currency"
              :trend="dashboardData.overview.vsYesterday || 0"
              subtitle="vs yesterday"
              color="blue"
            />
            <SalesMetricCard
              v-if="dashboardData.overview"
              label="Orders"
              :value="dashboardData.overview.ordersCompleted || 0"
              format="number"
              :trend="dashboardData.overview.vsLastWeek || 0"
              subtitle="vs last week"
              color="green"
            />
            <SalesMetricCard
              v-if="dashboardData.overview"
              label="Avg Order"
              :value="(dashboardData.overview.todaySales / dashboardData.overview.ordersCompleted) || 0"
              format="currency"
              :trend="0"
              subtitle="per order"
              color="purple"
            />
            <SalesMetricCard
              v-if="dashboardData.overview"
              label="Labor Cost"
              :value="dashboardData.overview.laborCost?.total || 0"
              format="currency"
              :trend="dashboardData.overview.laborCost?.percentage || 0"
              subtitle="of sales"
              color="orange"
            />
          </div>

          <!-- Main Content Grid -->
          <div class="content-grid">
            <!-- Left Column -->
            <div class="left-column">
              <LiveOrderFeed
                v-if="dashboardData.liveOrders && dashboardData.liveOrders.length > 0"
                :orders="dashboardData.liveOrders"
                @viewOrder="handleViewOrder"
              />
              
              <SalesChart
                v-if="dashboardData.salesTrend"
                :data="dashboardData.salesTrend"
                :timeRange="'7days'"
              />
              
              <TopPerformers
                v-if="dashboardData.topPerformers"
                :performers="dashboardData.topPerformers"
                @viewDetails="handleViewPerformer"
              />
            </div>

            <!-- Middle Column -->
            <div class="middle-column">
              <ProfitPulse
                v-if="dashboardData.profitPulse"
                :status="dashboardData.profitPulse.status"
                :message="dashboardData.profitPulse.message"
                :profit="dashboardData.profitPulse.profit"
                :profitMargin="dashboardData.profitPulse.profitMargin"
              />
              
              <GoalTracker
                v-if="dashboardData.goals"
                :dailyGoal="dashboardData.goals.daily"
                :monthlyGoal="dashboardData.goals.monthly"
              />
              
              <FinancialSummaryWidget
                v-if="dashboardData.financial"
                :data="dashboardData.financial"
              />
              
              <ActivityFeed
                v-if="dashboardData.recentActivity && dashboardData.recentActivity.length > 0"
                :activities="dashboardData.recentActivity"
                :maxItems="10"
              />
            </div>

            <!-- Right Column -->
            <div class="right-column">
              <AlertsPanel
                v-if="dashboardData.alerts && dashboardData.alerts.length > 0"
                :alerts="dashboardData.alerts"
                @alert-action="handleAlertAction"
                @dismiss-all="dismissAlerts"
              />
              
              <!-- Quick Actions -->
              <div class="quick-actions-widget">
                <h3 class="widget-title">Quick Actions</h3>
                <div class="actions-grid">
                  <button class="action-btn" @click="handleQuickAction('new-order')">
                    <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>New Order</span>
                  </button>
                  <button class="action-btn" @click="handleQuickAction('add-employee')">
                    <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span>Add Employee</span>
                  </button>
                  <button class="action-btn" @click="handleQuickAction('add-menu-item')">
                    <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add Menu Item</span>
                  </button>
                  <button class="action-btn" @click="handleQuickAction('manage-schedule')">
                    <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Manage Schedules</span>
                  </button>
                  <button class="action-btn" @click="showClockInModal = true">
                    <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Clock In/Out</span>
                  </button>
                  <button class="action-btn" @click="showInventoryModal = true">
                    <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span>Quick Inventory</span>
                  </button>
                </div>
              </div>
              
              <UpcomingItemsWidget
                v-if="dashboardData.upcoming && dashboardData.upcoming.length > 0"
                :items="dashboardData.upcoming"
                @viewAll="handleViewUpcoming"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import Sidebar from '../components/Sidebar.vue';
import SalesMetricCard from '../components/dashboard/SalesMetricCard.vue';
import LiveOrderFeed from '../components/dashboard/LiveOrderFeed.vue';
import SalesChart from '../components/dashboard/SalesChart.vue';
import TopPerformers from '../components/dashboard/TopPerformers.vue';
import ActivityFeed from '../components/dashboard/ActivityFeed.vue';
import AlertsPanel from '../components/dashboard/AlertsPanel.vue';
import QuickActions from '../components/dashboard/QuickActions.vue';
import ProfitPulse from '../components/dashboard/ProfitPulse.vue';
import GoalTracker from '../components/dashboard/GoalTracker.vue';
import UpcomingItemsWidget from '../components/dashboard/UpcomingItemsWidget.vue';
import FinancialSummaryWidget from '../components/dashboard/FinancialSummaryWidget.vue';
import ClockInOutModal from '../components/dashboard/ClockInOutModal.vue';
import QuickInventoryModal from '../components/dashboard/QuickInventoryModal.vue';
import OutOfStockModal from '../components/dashboard/OutOfStockModal.vue';

const router = useRouter();
const { ipcRenderer } = window.require('electron');

const businessName = ref('');
const currentUser = ref(null);
const dashboardData = ref({
  overview: null,
  salesTrend: [],
  topPerformers: null,
  inventoryStatus: null,
  financialSummary: null,
  upcomingItems: null,
  activityFeed: [],
  alerts: [],
  liveOrders: [],
  goalTracking: null,
  profitPulse: null
});

const chartPeriod = ref('week');
const showClockInModal = ref(false);
const showInventoryModal = ref(false);
const showOutOfStockModal = ref(false);
let refreshInterval = null;

// Quick Actions Configuration
const quickActionsConfig = ref([
  { id: 'new-order', label: 'New Order', icon: 'plus', color: 'blue' },
  { id: 'add-employee', label: 'Add Employee', icon: 'users', color: 'green' },
  { id: 'add-menu-item', label: 'Add Menu Item', icon: 'utensils', color: 'purple' },
  { id: 'manage-schedule', label: 'Manage Schedules', icon: 'calendar', color: 'orange' },
  { id: 'clock-in-out', label: 'Clock In/Out', icon: 'clock', color: 'indigo' },
  { id: 'quick-inventory', label: 'Quick Inventory', icon: 'box', color: 'teal' }
]);

// Keep old refs for backward compatibility
const employeeCount = ref(0);
const todaysSales = ref(0);
const ordersToday = ref(0);
const lowStockCount = ref(0);

onMounted(async () => {
  const userDataStr = localStorage.getItem('currentUser');
  if (userDataStr) {
    currentUser.value = JSON.parse(userDataStr);
    businessName.value = currentUser.value.businessName || 'My Business';
    
    await loadDashboardData();
    
    // Auto-refresh every 30 seconds
    refreshInterval = setInterval(() => {
      loadDashboardData();
    }, 30000);
  }
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

const loadDashboardData = async () => {
  try {
    console.log('🔄 Loading dashboard data...');
    const businessId = currentUser.value.businessId;
    const userRole = currentUser.value.role;
    
    // Load comprehensive dashboard data
    const data = await ipcRenderer.invoke('dashboard:get-complete', {
      businessId,
      userRole
    });
    
    console.log('📊 Dashboard data received:', {
      todaySales: data.overview?.todaySales,
      ordersCompleted: data.overview?.ordersCompleted,
      rawData: data
    });
    
    dashboardData.value = data;
    
    // Update old refs for backward compatibility with existing template
    if (data.overview) {
      todaysSales.value = data.overview.todaySales || 0;
      ordersToday.value = data.overview.ordersCompleted || 0;
      employeeCount.value = data.overview.clockedInStaff?.length || 0;
      
      const alerts = data.overview.inventoryAlerts;
      if (alerts) {
        lowStockCount.value = (alerts.lowStock || 0) + (alerts.expiring || 0) + (alerts.expired || 0);
      }
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    // Fallback to old method if new endpoint doesn't exist yet
    await loadDashboardStats();
  }
};

const loadDashboardStats = async () => {
  try {
    const businessId = currentUser.value.businessId;
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    const startDate = today.toISOString().split('T')[0];
    const endDate = endOfDay.toISOString().split('T')[0];
    
    // Load today's sales
    const transactions = await ipcRenderer.invoke('pos:get-transactions-by-date', {
      businessId,
      startDate,
      endDate
    });
    
    const completedTransactions = transactions.filter(t => t.status === 'completed');
    todaysSales.value = completedTransactions.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
    ordersToday.value = completedTransactions.length;
    
    // Load employee count
    const employees = await ipcRenderer.invoke('employee:get-all', businessId);
    const activeEmployees = employees.filter(e => e.status === 'active');
    employeeCount.value = activeEmployees.length;
    
    // Load low stock count
    const inventory = await ipcRenderer.invoke('inventory:get-all-items', businessId);
    lowStockCount.value = inventory.filter(item => {
      const minQty = item.minimum_quantity || item.min_quantity || 0;
      return item.quantity <= minQty;
    }).length;
    
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
};

const refreshDashboard = async () => {
  console.log('🔄 Refresh button clicked');
  await loadDashboardData();
  console.log('✅ Dashboard refresh complete');
};

const getCurrentGreeting = () => {
  const hour = new Date().getHours();
  const date = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 18) greeting = 'Good afternoon';
  
  return `${greeting}! Here's your business overview for ${date}`;
};

const getTotalInventoryAlerts = () => {
  const alerts = dashboardData.value.overview?.inventoryAlerts;
  if (!alerts) return lowStockCount.value;
  return (alerts.lowStock || 0) + (alerts.expiring || 0) + (alerts.expired || 0);
};

const getInventoryAlertSubtitle = () => {
  const alerts = dashboardData.value.overview?.inventoryAlerts;
  if (!alerts) return `${lowStockCount.value} items need attention`;
  
  const parts = [];
  if (alerts.lowStock) parts.push(`${alerts.lowStock} low`);
  if (alerts.expiring) parts.push(`${alerts.expiring} expiring`);
  if (alerts.expired) parts.push(`${alerts.expired} expired`);
  
  return parts.join(' • ') || 'All items stocked';
};

const dismissAlerts = () => {
  dashboardData.value.alerts = [];
};

const handleOrderClick = (order) => {
  router.push('/pos');
};

const refreshActivityFeed = async () => {
  try {
    const businessId = currentUser.value.businessId;
    const feed = await ipcRenderer.invoke('dashboard:get-activity-feed', {
      businessId,
      limit: 15
    });
    dashboardData.value.activityFeed = feed;
  } catch (error) {
    console.error('Error refreshing activity feed:', error);
  }
};

const handlePeriodChange = async (period) => {
  chartPeriod.value = period;
  try {
    const businessId = currentUser.value.businessId;
    const trend = await ipcRenderer.invoke('dashboard:get-sales-trend', {
      businessId,
      period
    });
    dashboardData.value.salesTrend = trend;
  } catch (error) {
    console.error('Error changing period:', error);
  }
};

const handleFinancialPeriodChange = async (period) => {
  try {
    const businessId = currentUser.value.businessId;
    const summary = await ipcRenderer.invoke('dashboard:get-financial-summary', {
      businessId,
      period
    });
    dashboardData.value.financialSummary = summary;
  } catch (error) {
    console.error('Error changing financial period:', error);
  }
};

const handleClockInSuccess = () => {
  showClockInModal.value = false;
  loadDashboardData();
};

const handleInventorySuccess = () => {
  showInventoryModal.value = false;
  loadDashboardData();
};

const handleOutOfStockSuccess = () => {
  showOutOfStockModal.value = false;
  loadDashboardData();
};

const goToReports = () => {
  router.push('/reports');
};

const goToInventory = () => {
  router.push('/inventory');
};

const goToSchedule = () => {
  router.push('/schedule');
};

const showComingSoon = (feature) => {
  alert(`${feature} feature coming soon!`);
};

const goToEmployees = () => {
  router.push('/employees');
};

const goToMenu = () => {
  router.push('/menu');
};

const showScheduleManager = () => {
  router.push('/schedule');
};

const handleLogout = async () => {
  try {
    const { ipcRenderer } = window.require('electron');
    const token = localStorage.getItem('authToken');
    
    await ipcRenderer.invoke('logout', token);
    
    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    // Redirect to login
    router.push('/');
  } catch (error) {
    console.error('Logout error:', error);
    alert('Logout failed. Please try again.');
  }
};

// New component handlers
const handleViewOrder = (orderId) => {
  router.push(`/pos?order=${orderId}`);
};

const handleViewPerformer = (performer) => {
  if (performer.type === 'employee') {
    router.push(`/employees/${performer.id}`);
  } else if (performer.type === 'item') {
    router.push(`/menu?item=${performer.id}`);
  }
};

const handleDismissAlert = (alertId) => {
  if (dashboardData.value.alerts) {
    dashboardData.value.alerts = dashboardData.value.alerts.filter(a => a.id !== alertId);
  }
};

const handleAlertAction = (alert) => {
  switch (alert.category) {
    case 'inventory':
      router.push('/inventory');
      break;
    case 'schedule':
      router.push('/schedule');
      break;
    case 'financial':
      router.push('/reports');
      break;
    case 'hr':
      router.push('/employees');
      break;
    default:
      console.log('Alert action:', alert);
  }
};

const handleQuickAction = (actionId) => {
  switch (actionId) {
    case 'new-order':
      router.push('/pos');
      break;
    case 'add-employee':
      router.push('/employees');
      break;
    case 'add-menu-item':
      router.push('/menu');
      break;
    case 'manage-schedule':
      router.push('/schedule');
      break;
    case 'clock-in-out':
      showClockInModal.value = true;
      break;
    case 'quick-inventory':
      showInventoryModal.value = true;
      break;
    default:
      console.log('Quick action:', actionId);
  }
};

const handleViewUpcoming = (type) => {
  if (type === 'reservations') {
    router.push('/reservations');
  } else if (type === 'shifts') {
    router.push('/schedule');
  }
};
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background-color: #0f1419;
  color: #f3f4f6;
}

.dashboard * {
  color: inherit;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.business-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.business-title {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.btn-logout {
  padding: 0.5rem 1.5rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
}

.main-content {
  display: flex;
  min-height: calc(100vh - 88px);
}

.content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  height: 100vh;
}

.content-header {
  margin-bottom: 2rem;
}

.content-header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.refresh-btn {
  padding: 0.5rem 1rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #60a5fa;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.refresh-btn:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
}

.refresh-btn svg {
  width: 16px;
  height: 16px;
}

/* Enhanced Dashboard Grid Layout */
.dashboard-grid {
  width: 100%;
  margin-bottom: 2rem;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 1536px) {
  .content-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .right-column {
    grid-column: 1 / -1;
  }
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .left-column,
  .middle-column,
  .right-column {
    grid-column: 1;
  }
}

.left-column,
.middle-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Quick Actions Widget */
.quick-actions-widget {
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.widget-title {
  color: #f9fafb;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.action-btn {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #f3f4f6;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: linear-gradient(135deg, #2a3548 0%, #1f2937 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
  border-color: rgba(59, 130, 246, 0.5);
}

.action-btn span {
  color: #f3f4f6;
  font-size: 0.875rem;
}

.action-icon {
  width: 24px;
  height: 24px;
  color: #60a5fa;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  color: #d1d5db;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.stat-value {
  color: #f9fafb;
  font-size: 1.875rem;
  font-weight: 700;
}

.quick-actions {
  margin-bottom: 2rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-btn {
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: #f3f4f6 !important;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn span {
  color: #f3f4f6;
}

.action-btn:hover {
  background: linear-gradient(135deg, #2a2f3e 0%, #1f2429 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
}

.action-icon {
  width: 32px;
  height: 32px;
  color: #60a5fa;
}

.recent-activity {
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.activity-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: #9ca3af;
}
</style>
