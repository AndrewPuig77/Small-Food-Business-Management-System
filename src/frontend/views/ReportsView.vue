<template>
  <div class="app-container">
    <Sidebar />
    
    <div class="main-content">
      <div class="content-header">
        <h1 class="page-title">Reports & Analytics</h1>
        <div class="header-controls">
          <div class="report-tabs">
            <button 
              v-for="tab in reportTabs" 
              :key="tab.id"
              @click="selectedReportType = tab.id"
              class="tab-btn"
              :class="{ active: selectedReportType === tab.id }"
            >
              {{ tab.label }}
            </button>
          </div>
          <div class="date-range-selector">
            <select v-model="selectedPeriod" @change="loadReports" class="period-select">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
            
            <div v-if="selectedPeriod === 'custom'" class="custom-range">
              <input v-model="customStartDate" type="date" class="date-input" />
              <span class="text-gray-400">to</span>
              <input v-model="customEndDate" type="date" class="date-input" />
              <button @click="loadReports" class="btn-primary-sm">Apply</button>
            </div>
            
            <button @click="exportReport" class="btn-export">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="export-icon">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
          </div>
        </div>
      </div>

      <div class="content-body">
        <!-- Sales Report Tab -->
        <div v-if="selectedReportType === 'sales'">
          <!-- Report Filters -->
          <div class="card mb-6">
            <h2 class="card-title">Report Filters</h2>
            <div class="filters-grid">
              <div class="filter-group">
                <label class="filter-label">Transaction Type</label>
                <select v-model="salesFilters.transactionType" class="filter-select">
                  <option value="all">All Transactions</option>
                  <option value="completed">Completed</option>
                  <option value="voided">Voided</option>
                </select>
              </div>
              <div class="filter-group">
                <label class="filter-label">Employee ID</label>
                <input v-model="salesFilters.employeeId" type="text" placeholder="Filter by cashier ID" class="filter-input" />
              </div>
              <div class="filter-group">
                <label class="filter-label">Payment Type</label>
                <select v-model="salesFilters.paymentType" class="filter-select">
                  <option value="all">All Payment Types</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Mobile">Mobile Payment</option>
                </select>
              </div>
              <div class="filter-actions">
                <button @click="loadReports" class="btn-generate">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="btn-icon">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Generate Report
                </button>
                <button @click="printReport" class="btn-print">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="btn-icon">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
              </div>
            </div>
          </div>

        <!-- Key Metrics -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon revenue">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="metric-content">
              <p class="metric-label">Total Revenue</p>
              <p class="metric-value">${{ formatNumber(metrics.totalRevenue) }}</p>
              <p class="metric-change" :class="{ positive: metrics.revenueChange >= 0, negative: metrics.revenueChange < 0 }">
                {{ metrics.revenueChange >= 0 ? '+' : '' }}{{ metrics.revenueChange }}% vs previous period
              </p>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon transactions">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div class="metric-content">
              <p class="metric-label">Transactions</p>
              <p class="metric-value">{{ formatNumber(metrics.totalTransactions) }}</p>
              <p class="metric-change" :class="{ positive: metrics.transactionChange >= 0, negative: metrics.transactionChange < 0 }">
                {{ metrics.transactionChange >= 0 ? '+' : '' }}{{ metrics.transactionChange }}% vs previous period
              </p>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon average">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="metric-content">
              <p class="metric-label">Average Order Value</p>
              <p class="metric-value">${{ formatNumber(metrics.averageOrderValue) }}</p>
              <p class="metric-change" :class="{ positive: metrics.aovChange >= 0, negative: metrics.aovChange < 0 }">
                {{ metrics.aovChange >= 0 ? '+' : '' }}{{ metrics.aovChange }}% vs previous period
              </p>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon customers">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div class="metric-content">
              <p class="metric-label">Unique Customers</p>
              <p class="metric-value">{{ formatNumber(metrics.uniqueCustomers) }}</p>
              <p class="metric-change" :class="{ positive: metrics.customerChange >= 0, negative: metrics.customerChange < 0 }">
                {{ metrics.customerChange >= 0 ? '+' : '' }}{{ metrics.customerChange }}% vs previous period
              </p>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="charts-grid">
          <!-- Sales Trend Chart -->
          <div class="card chart-card">
            <h3 class="chart-title">Daily Sales Trend (Last 7 Days)</h3>
            <div class="chart-container">
              <canvas ref="salesTrendChart"></canvas>
            </div>
          </div>

          <!-- Peak Hours Chart -->
          <div class="card chart-card">
            <h3 class="chart-title">Peak Sales Hours</h3>
            <div class="chart-container">
              <canvas ref="peakHoursChart"></canvas>
            </div>
          </div>

          <!-- Food Cost Percentage -->
          <div class="card chart-card">
            <h3 class="chart-title">Cost Breakdown</h3>
            <div class="chart-container">
              <canvas ref="costBreakdownChart"></canvas>
            </div>
          </div>

          <!-- Labor Cost Percentage -->
          <div class="card chart-card">
            <h3 class="chart-title">Labor vs Revenue</h3>
            <div class="chart-container">
              <canvas ref="laborCostChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Top Selling Items -->
        <div class="card mb-6">
          <h2 class="card-title">Top Selling Items</h2>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity Sold</th>
                  <th>Revenue</th>
                  <th>Avg Price</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in topItems" :key="item.id">
                  <td class="font-semibold">{{ item.name }}</td>
                  <td>{{ item.quantitySold }}</td>
                  <td>${{ formatNumber(item.revenue) }}</td>
                  <td>${{ formatNumber(item.avgPrice) }}</td>
                </tr>
                <tr v-if="topItems.length === 0">
                  <td colspan="4" class="text-center text-gray-500">No sales data available</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sales by Payment Method -->
        <div class="card mb-6">
          <h2 class="card-title">Payment Methods</h2>
          <div class="payment-methods-grid">
            <div v-for="method in paymentMethods" :key="method.type" class="payment-method-card">
              <div class="payment-method-header">
                <span class="payment-method-name">{{ method.type }}</span>
                <span class="payment-method-amount">${{ formatNumber(method.amount) }}</span>
              </div>
              <div class="payment-method-bar">
                <div class="payment-method-fill" :style="{ width: method.percentage + '%' }"></div>
              </div>
              <div class="payment-method-footer">
                <span class="text-gray-500">{{ method.count }} transactions</span>
                <span class="text-gray-400">{{ method.percentage }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Transactions -->
        <div class="card">
          <h2 class="card-title">Recent Transactions</h2>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Transaction ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="transaction in recentTransactions" :key="transaction.id">
                  <td>{{ formatDateTime(transaction.created_at) }}</td>
                  <td class="font-mono text-sm">#{{ transaction.id }}</td>
                  <td>{{ transaction.customer_name || 'Guest' }}</td>
                  <td>{{ transaction.itemCount }} items</td>
                  <td class="font-semibold">${{ formatNumber(transaction.total) }}</td>
                  <td>
                    <span class="status-badge" :class="transaction.status">
                      {{ transaction.status }}
                    </span>
                  </td>
                </tr>
                <tr v-if="recentTransactions.length === 0">
                  <td colspan="6" class="text-center text-gray-500">No transactions yet</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        </div>

        <!-- Inventory Report Tab -->
        <div v-if="selectedReportType === 'inventory'" class="inventory-report">
          <!-- Report Filters -->
          <div class="card mb-6">
            <h2 class="card-title">Report Filters</h2>
            <div class="filters-grid">
              <div class="filter-group">
                <label class="filter-label">Category</label>
                <select v-model="inventoryFilters.category" class="filter-select">
                  <option value="all">All Categories</option>
                  <option value="Food">Food</option>
                  <option value="Beverage">Beverage</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Ingredients">Ingredients</option>
                </select>
              </div>
              <div class="filter-group">
                <label class="filter-label">Supplier</label>
                <input v-model="inventoryFilters.supplier" type="text" placeholder="Filter by supplier" class="filter-input" />
              </div>
              <div class="filter-group">
                <label class="filter-label">Stock Status</label>
                <select v-model="inventoryFilters.stockStatus" class="filter-select">
                  <option value="all">All Items</option>
                  <option value="low">Low Stock Only</option>
                  <option value="in-stock">In Stock Only</option>
                </select>
              </div>
              <div class="filter-actions">
                <button @click="loadReports" class="btn-generate">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="btn-icon">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Generate Report
                </button>
                <button @click="printReport" class="btn-print">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="btn-icon">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
              </div>
            </div>
          </div>

          <div class="card mb-6">
            <div class="card-header">
              <h2 class="card-title">Inventory Status</h2>
              <div class="summary-stats">
                <div class="stat-item">
                  <span class="stat-label">Total Items:</span>
                  <span class="stat-value">{{ inventoryData.totalItems }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Low Stock Items:</span>
                  <span class="stat-value text-warning">{{ inventoryData.lowStockCount }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Total Value:</span>
                  <span class="stat-value">${{ formatNumber(inventoryData.totalValue) }}</span>
                </div>
              </div>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Reorder Level</th>
                    <th>Unit Cost</th>
                    <th>Total Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in inventoryData.items" :key="item.id">
                    <td class="font-semibold">{{ item.name }}</td>
                    <td>{{ item.category }}</td>
                    <td>{{ item.quantity }} {{ item.unit }}</td>
                    <td>{{ item.minimum_quantity }} {{ item.unit }}</td>
                    <td>${{ formatNumber(item.unit_cost) }}</td>
                    <td>${{ formatNumber(item.quantity * item.unit_cost) }}</td>
                    <td>
                      <span class="status-badge" :class="item.quantity <= item.minimum_quantity ? 'low-stock' : 'in-stock'">
                        {{ item.quantity <= item.minimum_quantity ? 'Low Stock' : 'In Stock' }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="inventoryData.items.length === 0">
                    <td colspan="7" class="text-center text-gray-500">No inventory items found</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Payroll Report Tab -->
        <div v-if="selectedReportType === 'payroll'" class="payroll-report">
          <!-- Report Filters -->
          <div class="card mb-6">
            <h2 class="card-title">Report Filters</h2>
            <div class="filters-grid">
              <div class="filter-group">
                <label class="filter-label">Employee</label>
                <select v-model="payrollFilters.employeeId" class="filter-select">
                  <option value="all">All Employees</option>
                  <option v-for="emp in payrollData.employees" :key="emp.id" :value="emp.id">
                    {{ emp.name }}
                  </option>
                </select>
              </div>
              <div class="filter-group">
                <label class="filter-label">Department</label>
                <select v-model="payrollFilters.department" class="filter-select">
                  <option value="all">All Departments</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="front">Front of House</option>
                  <option value="management">Management</option>
                </select>
              </div>
              <div class="filter-group">
                <label class="filter-label">&nbsp;</label>
                <div class="filter-actions">
                  <button @click="loadReports" class="btn-generate">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="btn-icon">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Generate Report
                  </button>
                  <button @click="printReport" class="btn-print">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="btn-icon">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                  </button>
                  <button @click="debugTimeLogs" class="btn-secondary" style="background: rgba(245, 158, 11, 0.2); border-color: rgba(245, 158, 11, 0.3);">
                    Debug Time Logs
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="card mb-6">
            <div class="card-header">
              <h2 class="card-title">Employee Payroll Summary</h2>
              <div class="summary-stats">
                <div class="stat-item">
                  <span class="stat-label">Total Hours:</span>
                  <span class="stat-value">{{ payrollData.totalHours.toFixed(2) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Total Payroll:</span>
                  <span class="stat-value">${{ formatNumber(payrollData.totalPayroll) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Employees:</span>
                  <span class="stat-value">{{ payrollData.employees.length }}</span>
                </div>
              </div>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Regular Hours</th>
                    <th>Overtime Hours</th>
                    <th>Pay Rate</th>
                    <th>Regular Pay</th>
                    <th>Overtime Pay</th>
                    <th>Total Pay</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="employee in payrollData.employees" :key="employee.id">
                    <td class="font-semibold">{{ employee.name }}</td>
                    <td>{{ employee.regularHours.toFixed(2) }}</td>
                    <td>{{ employee.overtimeHours.toFixed(2) }}</td>
                    <td>${{ formatNumber(employee.payRate) }}/hr</td>
                    <td>${{ formatNumber(employee.regularPay) }}</td>
                    <td>${{ formatNumber(employee.overtimePay) }}</td>
                    <td class="font-semibold">${{ formatNumber(employee.totalPay) }}</td>
                  </tr>
                  <tr v-if="payrollData.employees.length === 0">
                    <td colspan="7" class="text-center text-gray-500">
                      <div style="padding: 2rem;">
                        <p style="margin-bottom: 0.5rem;">No completed shifts found for this date range.</p>
                        <p style="font-size: 0.875rem; color: #6b7280;">Employees must clock in and clock out to appear in payroll reports.</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import Sidebar from '../components/Sidebar.vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const { ipcRenderer } = window.require('electron');

const selectedReportType = ref('sales');
const reportTabs = [
  { id: 'sales', label: 'Sales Report' },
  { id: 'inventory', label: 'Inventory Report' },
  { id: 'payroll', label: 'Payroll Report' }
];

const selectedPeriod = ref('today');
const customStartDate = ref('');
const customEndDate = ref('');

const salesFilters = ref({
  transactionType: 'all',
  employeeId: '',
  paymentType: 'all'
});

const inventoryFilters = ref({
  category: 'all',
  supplier: '',
  stockStatus: 'all'
});

const payrollFilters = ref({
  employeeId: 'all',
  department: 'all'
});

const metrics = ref({
  totalRevenue: 0,
  totalTransactions: 0,
  averageOrderValue: 0,
  uniqueCustomers: 0,
  revenueChange: 0,
  transactionChange: 0,
  aovChange: 0,
  customerChange: 0
});

const topItems = ref([]);
const paymentMethods = ref([]);
const recentTransactions = ref([]);

const inventoryData = ref({
  totalItems: 0,
  lowStockCount: 0,
  totalValue: 0,
  items: []
});

const payrollData = ref({
  totalHours: 0,
  totalPayroll: 0,
  employees: []
});

const salesTrendChart = ref(null);
const peakHoursChart = ref(null);
const costBreakdownChart = ref(null);
const laborCostChart = ref(null);

let chartInstances = {
  salesTrend: null,
  peakHours: null,
  costBreakdown: null,
  laborCost: null
};

const formatNumber = (num) => {
  return Number(num || 0).toFixed(2);
};

const formatDateTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const getDateRange = () => {
  const today = new Date();
  let startDate, endDate;

  switch (selectedPeriod.value) {
    case 'today':
      startDate = new Date(today.setHours(0, 0, 0, 0));
      endDate = new Date(today.setHours(23, 59, 59, 999));
      break;
    case 'week':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - today.getDay());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      break;
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date();
      break;
    case 'year':
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date();
      break;
    case 'custom':
      startDate = new Date(customStartDate.value);
      endDate = new Date(customEndDate.value);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
};

const loadReports = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const dateRange = getDateRange();

    if (selectedReportType.value === 'sales') {
      await loadSalesReport(currentUser, dateRange);
    } else if (selectedReportType.value === 'inventory') {
      await loadInventoryReport(currentUser.businessId);
    } else if (selectedReportType.value === 'payroll') {
      await loadPayrollReport(currentUser.businessId, dateRange);
    }
  } catch (error) {
    console.error('Error loading reports:', error);
  }
};

const loadSalesReport = async (currentUser, dateRange) => {
  // Load transactions for the period
  const transactions = await ipcRenderer.invoke('pos:get-transactions-by-date', {
    businessId: currentUser.businessId,
    startDate: dateRange.start,
    endDate: dateRange.end
  });

  // Apply filters
  let filteredTransactions = transactions;
  
  if (salesFilters.value.transactionType !== 'all') {
    filteredTransactions = filteredTransactions.filter(t => t.status === salesFilters.value.transactionType);
  }
  
  if (salesFilters.value.employeeId) {
    filteredTransactions = filteredTransactions.filter(t => 
      t.cashier_id && t.cashier_id.toString() === salesFilters.value.employeeId
    );
  }
  
  // Note: Payment type filter would require querying payment_methods table
  // For now, we'll skip complex filtering

  // Calculate metrics
  const completedTransactions = filteredTransactions.filter(t => t.status === 'completed');
  metrics.value.totalRevenue = completedTransactions.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
  metrics.value.totalTransactions = completedTransactions.length;
  metrics.value.averageOrderValue = completedTransactions.length > 0 
    ? metrics.value.totalRevenue / completedTransactions.length 
    : 0;
  
  // Count unique customers
  const uniqueCustomerIds = new Set(completedTransactions.filter(t => t.customer_id).map(t => t.customer_id));
  metrics.value.uniqueCustomers = uniqueCustomerIds.size;

  // Calculate changes vs previous period
  const previousPeriodData = await getPreviousPeriodData(currentUser.businessId, dateRange);
  metrics.value.revenueChange = calculatePercentageChange(metrics.value.totalRevenue, previousPeriodData.revenue);
  metrics.value.transactionChange = calculatePercentageChange(metrics.value.totalTransactions, previousPeriodData.transactions);
  metrics.value.aovChange = calculatePercentageChange(metrics.value.averageOrderValue, previousPeriodData.avgOrderValue);
  metrics.value.customerChange = calculatePercentageChange(metrics.value.uniqueCustomers, previousPeriodData.customers);

  // Get top selling items
  await loadTopItems(currentUser.businessId, dateRange, completedTransactions);

  // Get payment methods breakdown from payment_methods table
  await loadPaymentMethods(currentUser.businessId, dateRange);

  // Set recent transactions with real item counts
  recentTransactions.value = filteredTransactions.slice(0, 10).map(t => {
    let itemCount = 0;
    try {
      if (t.transaction_items) {
        const items = JSON.parse(t.transaction_items);
        itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
      }
    } catch (e) {
      itemCount = 0;
    }
    return {
      ...t,
      itemCount
    };
  });

  // Render charts after data is loaded
  await nextTick();
  await renderCharts(completedTransactions, currentUser.businessId, { startDate: dateRange.start, endDate: dateRange.end });
};

const loadInventoryReport = async (businessId) => {
  try {
    const items = await ipcRenderer.invoke('inventory:get-all-items', businessId);
    
    // Apply filters
    let filteredItems = items;
    
    if (inventoryFilters.value.category !== 'all') {
      filteredItems = filteredItems.filter(item => item.category === inventoryFilters.value.category);
    }
    
    if (inventoryFilters.value.supplier) {
      filteredItems = filteredItems.filter(item => 
        item.supplier && item.supplier.toLowerCase().includes(inventoryFilters.value.supplier.toLowerCase())
      );
    }
    
    if (inventoryFilters.value.stockStatus === 'low') {
      filteredItems = filteredItems.filter(item => item.quantity <= item.minimum_quantity);
    } else if (inventoryFilters.value.stockStatus === 'in-stock') {
      filteredItems = filteredItems.filter(item => item.quantity > item.minimum_quantity);
    }
    
    inventoryData.value.items = filteredItems;
    inventoryData.value.totalItems = filteredItems.length;
    inventoryData.value.lowStockCount = filteredItems.filter(item => item.quantity <= (item.minimum_quantity || item.min_quantity || 0)).length;
    inventoryData.value.totalValue = filteredItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity || 0);
      const cost = parseFloat(item.unit_cost || 0);
      return sum + (qty * cost);
    }, 0);
  } catch (error) {
    console.error('Error loading inventory report:', error);
    inventoryData.value = { totalItems: 0, lowStockCount: 0, totalValue: 0, items: [] };
  }
};

const loadPayrollReport = async (businessId, dateRange) => {
  try {
    console.log('Loading payroll with params:', { businessId, startDate: dateRange.startDate, endDate: dateRange.endDate });
    
    // Get actual payroll data from time logs
    const payrollRecords = await ipcRenderer.invoke('timelog:get-payroll', {
      businessId: businessId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
    
    console.log('Payroll records:', payrollRecords);
    
    // Apply filters
    let filteredRecords = payrollRecords;
    
    if (payrollFilters.value.employeeId !== 'all') {
      filteredRecords = filteredRecords.filter(emp => emp.employee_id.toString() === payrollFilters.value.employeeId);
    }
    
    if (payrollFilters.value.department !== 'all') {
      filteredRecords = filteredRecords.filter(emp => 
        emp.position && emp.position.toLowerCase().includes(payrollFilters.value.department.toLowerCase())
      );
    }
    
    // Map to display format
    payrollData.value.employees = filteredRecords.map(emp => ({
      id: emp.employee_id,
      name: emp.full_name,
      regularHours: emp.regular_hours || 0,
      overtimeHours: emp.overtime_hours || 0,
      payRate: emp.hourly_rate || 0,
      regularPay: emp.regular_pay || 0,
      overtimePay: emp.overtime_pay || 0,
      totalPay: emp.gross_pay || 0
    }));
    
    payrollData.value.totalHours = payrollData.value.employees.reduce((sum, e) => sum + e.regularHours + e.overtimeHours, 0);
    payrollData.value.totalPayroll = payrollData.value.employees.reduce((sum, e) => sum + e.totalPay, 0);
    
    console.log('Payroll data loaded:', payrollData.value);
  } catch (error) {
    console.error('Error loading payroll report:', error);
    payrollData.value = { totalHours: 0, totalPayroll: 0, employees: [] };
  }
};

const debugTimeLogs = async () => {
  try {
    console.log('=== DEBUG TIME LOGS ===');
    const result = await ipcRenderer.invoke('timelog:debug-all');
    console.log('Raw database result:', result);
    if (result && result.length > 0) {
      console.log('Columns:', result[0].columns);
      console.log('Values:', result[0].values);
      console.log('Total time logs:', result[0].values.length);
    } else {
      console.log('No time logs found in database');
    }
  } catch (error) {
    console.error('Debug error:', error);
  }
};

const exportReport = () => {
  // Export functionality - would generate PDF/Excel
  alert(`Export ${selectedReportType.value} report (PDF/Excel export to be implemented)`);
};

const printReport = () => {
  window.print();
};

const renderCharts = async (transactions, businessId, dateRange) => {
  // Destroy existing charts
  Object.values(chartInstances).forEach(chart => {
    if (chart) chart.destroy();
  });

  if (!salesTrendChart.value || transactions.length === 0) return;

  const totalRevenue = metrics.value.totalRevenue;

  // 1. Sales Trend Chart (Last 7 Days)
  const last7Days = [];
  const salesByDay = {};
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    last7Days.push(dateStr);
    salesByDay[dateStr] = 0;
  }

  transactions.forEach(t => {
    const dateStr = t.created_at.split('T')[0];
    if (salesByDay.hasOwnProperty(dateStr)) {
      salesByDay[dateStr] += parseFloat(t.total || 0);
    }
  });

  chartInstances.salesTrend = new Chart(salesTrendChart.value, {
    type: 'line',
    data: {
      labels: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [{
        label: 'Daily Sales ($)',
        data: last7Days.map(d => salesByDay[d]),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `$${context.parsed.y.toFixed(2)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `$${value}`,
            color: '#9ca3af'
          },
          grid: { color: 'rgba(75, 85, 99, 0.2)' }
        },
        x: {
          ticks: { color: '#9ca3af' },
          grid: { color: 'rgba(75, 85, 99, 0.2)' }
        }
      }
    }
  });

  // 2. Peak Hours Chart
  const hourCounts = Array(24).fill(0);
  
  // Debug: Log first transaction to check timezone
  if (transactions.length > 0) {
    const firstTx = transactions[0];
    console.log('Sample transaction timestamp:', firstTx.created_at);
    console.log('Parsed as Date:', new Date(firstTx.created_at));
    console.log('Local hour:', new Date(firstTx.created_at).getHours());
    console.log('Current local time:', new Date());
    console.log('Current local hour:', new Date().getHours());
  }
  
  transactions.forEach(t => {
    // SQLite stores CURRENT_TIMESTAMP as UTC but without timezone indicator
    // JavaScript parses it as local time, so we need to adjust
    // Parse timestamp and add 'Z' to force UTC interpretation, then convert to local
    let timestamp = t.created_at;
    if (!timestamp.includes('Z') && !timestamp.includes('+') && !timestamp.includes('-', 10)) {
      // If no timezone info, treat as UTC and convert to local
      timestamp = timestamp.replace(' ', 'T') + 'Z';
    }
    const transactionDate = new Date(timestamp);
    const hour = transactionDate.getHours(); // This now gets correct local hour
    hourCounts[hour] += parseFloat(t.total || 0);
  });

  const operatingHours = hourCounts.slice(6, 23); // 6 AM to 10 PM
  const hourLabels = [];
  for (let i = 6; i < 23; i++) {
    const period = i < 12 ? 'AM' : 'PM';
    const displayHour = i % 12 || 12;
    hourLabels.push(`${displayHour}${period}`);
  }

  // Get current hour for display (optional: highlight current hour)
  const currentHour = new Date().getHours();
  const currentHourIndex = currentHour - 6; // Adjust for 6 AM start

  chartInstances.peakHours = new Chart(peakHoursChart.value, {
    type: 'bar',
    data: {
      labels: hourLabels,
      datasets: [{
        label: 'Sales by Hour',
        data: operatingHours,
        backgroundColor: operatingHours.map((_, index) => 
          index === currentHourIndex ? 'rgba(16, 185, 129, 0.6)' : 'rgba(139, 92, 246, 0.6)'
        ),
        borderColor: operatingHours.map((_, index) => 
          index === currentHourIndex ? '#10b981' : '#8b5cf6'
        ),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `$${context.parsed.y.toFixed(2)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `$${value}`,
            color: '#9ca3af'
          },
          grid: { color: 'rgba(75, 85, 99, 0.2)' }
        },
        x: {
          ticks: { color: '#9ca3af' },
          grid: { display: false }
        }
      }
    }
  });

  // 3. Cost Breakdown Chart (Real expense data)
  let foodCost = 0;
  let overheadCost = 0;
  try {
    // Get expenses by category to separate food costs from overhead
    console.log('Fetching expenses by category with params:', { businessId, startDate: dateRange.startDate, endDate: dateRange.endDate });
    const expensesByCategory = await ipcRenderer.invoke('expense:get-by-category', {
      businessId: businessId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
    console.log('Expenses by category:', expensesByCategory);
    
    // Separate food costs from other overhead
    expensesByCategory.forEach(cat => {
      if (cat.category === 'Food/Ingredients') {
        foodCost += cat.total_amount || 0;
      } else {
        overheadCost += cat.total_amount || 0;
      }
    });
    
    console.log('Food cost:', foodCost, 'Overhead cost:', overheadCost);
  } catch (error) {
    console.error('Error loading expenses:', error);
  }

  // Calculate cost breakdown percentages
  const laborCost = payrollData.value.totalPayroll;
  const totalCosts = foodCost + laborCost + overheadCost;
  const profit = Math.max(0, totalRevenue - totalCosts);

  // Calculate percentages
  const foodPercent = totalRevenue > 0 ? (foodCost / totalRevenue * 100) : 0;
  const laborPercent = totalRevenue > 0 ? (laborCost / totalRevenue * 100) : 0;
  const overheadPercent = totalRevenue > 0 ? (overheadCost / totalRevenue * 100) : 0;
  const profitPercent = totalRevenue > 0 ? (profit / totalRevenue * 100) : 0;

  chartInstances.costBreakdown = new Chart(costBreakdownChart.value, {
    type: 'doughnut',
    data: {
      labels: ['Food Cost', 'Labor', 'Overhead', 'Profit'],
      datasets: [{
        data: [
          parseFloat(foodPercent.toFixed(1)),
          parseFloat(laborPercent.toFixed(1)),
          parseFloat(overheadPercent.toFixed(1)),
          parseFloat(profitPercent.toFixed(1))
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(107, 114, 128, 0.8)',
          'rgba(16, 185, 129, 0.8)'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#9ca3af', padding: 15 }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label;
              const percent = context.parsed;
              let dollarAmount = 0;
              if (label === 'Food Cost') dollarAmount = foodCost;
              else if (label === 'Labor') dollarAmount = laborCost;
              else if (label === 'Overhead') dollarAmount = overheadCost;
              else if (label === 'Profit') dollarAmount = profit;
              return `${label}: ${percent}% ($${dollarAmount.toFixed(2)})`;
            }
          }
        }
      }
    }
  });

  // 4. Labor Cost Chart
  const laborPercentage = totalRevenue > 0 ? (laborCost / totalRevenue * 100) : 0;
  
  chartInstances.laborCost = new Chart(laborCostChart.value, {
    type: 'bar',
    data: {
      labels: ['Labor Cost %', 'Target (30%)'],
      datasets: [{
        label: 'Percentage',
        data: [laborPercentage, 30],
        backgroundColor: [
          laborPercentage > 35 ? 'rgba(239, 68, 68, 0.8)' : 
          laborPercentage > 30 ? 'rgba(245, 158, 11, 0.8)' : 
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.4)'
        ],
        borderColor: [
          laborPercentage > 35 ? '#ef4444' : 
          laborPercentage > 30 ? '#f59e0b' : 
          '#10b981',
          '#3b82f6'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.parsed.y.toFixed(1)}%`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 50,
          ticks: {
            callback: (value) => `${value}%`,
            color: '#9ca3af'
          },
          grid: { color: 'rgba(75, 85, 99, 0.2)' }
        },
        x: {
          ticks: { color: '#9ca3af' },
          grid: { display: false }
        }
      }
    }
  });
};

const loadTopItems = async (businessId, dateRange, transactions) => {
  try {
    const itemSales = {};
    
    for (const transaction of transactions) {
      if (transaction.transaction_items) {
        const items = JSON.parse(transaction.transaction_items);
        items.forEach(item => {
          if (!itemSales[item.id]) {
            itemSales[item.id] = {
              id: item.id,
              name: item.name,
              quantitySold: 0,
              revenue: 0
            };
          }
          itemSales[item.id].quantitySold += item.quantity;
          itemSales[item.id].revenue += item.price * item.quantity;
        });
      }
    }
    
    const itemsArray = Object.values(itemSales).map(item => ({
      ...item,
      avgPrice: item.quantitySold > 0 ? item.revenue / item.quantitySold : 0
    }));
    
    topItems.value = itemsArray
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
      
  } catch (error) {
    console.error('Error loading top items:', error);
    topItems.value = [];
  }
};

const loadPaymentMethods = async (businessId, dateRange) => {
  try {
    const paymentData = await ipcRenderer.invoke('pos:get-payment-methods', {
      businessId,
      startDate: dateRange.start,
      endDate: dateRange.end
    });
    
    const total = paymentData.reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);
    
    paymentMethods.value = paymentData.map(p => ({
      type: p.method_type,
      amount: parseFloat(p.total_amount || 0),
      count: p.transaction_count,
      percentage: total > 0 ? ((parseFloat(p.total_amount || 0) / total) * 100).toFixed(1) : 0
    }));
  } catch (error) {
    console.error('Error loading payment methods:', error);
    paymentMethods.value = [];
  }
};

const getPreviousPeriodData = async (businessId, currentRange) => {
  try {
    const currentStart = new Date(currentRange.start);
    const currentEnd = new Date(currentRange.end);
    const periodLength = currentEnd - currentStart;
    
    const previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    const previousStart = new Date(previousEnd.getTime() - periodLength);
    
    const previousTransactions = await ipcRenderer.invoke('pos:get-transactions-by-date', {
      businessId,
      startDate: previousStart.toISOString().split('T')[0],
      endDate: previousEnd.toISOString().split('T')[0]
    });
    
    const completedPrevious = previousTransactions.filter(t => t.status === 'completed');
    const revenue = completedPrevious.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
    const transactions = completedPrevious.length;
    const avgOrderValue = transactions > 0 ? revenue / transactions : 0;
    const customers = new Set(completedPrevious.filter(t => t.customer_id).map(t => t.customer_id)).size;
    
    return { revenue, transactions, avgOrderValue, customers };
  } catch (error) {
    console.error('Error getting previous period data:', error);
    return { revenue: 0, transactions: 0, avgOrderValue: 0, customers: 0 };
  }
};

const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number(((current - previous) / previous * 100).toFixed(1));
};

onMounted(() => {
  loadReports();
});

</script>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(to bottom right, #111827, #1f2937, #000000);
}

.main-content {
  flex: 1;
  margin-left: 250px;
  padding: 2rem;
  overflow-y: auto;
  max-height: 100vh;
}

.content-header {
  margin-bottom: 2rem;
}

.header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  width: 100%;
  margin-top: 1rem;
}

.report-tabs {
  display: flex;
  gap: 0.5rem;
  background: rgba(17, 24, 39, 0.5);
  padding: 0.25rem;
  border-radius: 0.75rem;
}

.tab-btn {
  padding: 0.5rem 1.5rem;
  background: transparent;
  color: #9ca3af;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: linear-gradient(to right, #3b82f6, #8b5cf6);
  color: white;
  font-weight: 600;
}

.tab-btn:hover:not(.active) {
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
}

.page-title {
  font-size: 2rem;
  font-weight: bold;
  background: linear-gradient(to right, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.btn-export {
  padding: 0.5rem 1rem;
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border: 1px solid #10b981;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-export:hover {
  background: rgba(16, 185, 129, 0.3);
  transform: translateY(-1px);
}

.export-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.date-range-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.period-select {
  padding: 0.5rem 1rem;
  background: rgba(31, 41, 55, 0.8);
  border: 1px solid rgba(75, 85, 99, 0.5);
  border-radius: 0.5rem;
  color: #f3f4f6;
  font-size: 0.875rem;
}

.custom-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-input {
  padding: 0.5rem;
  background: rgba(31, 41, 55, 0.8);
  border: 1px solid rgba(75, 85, 99, 0.5);
  border-radius: 0.5rem;
  color: #f3f4f6;
  font-size: 0.875rem;
}

.btn-primary-sm {
  padding: 0.5rem 1rem;
  background: linear-gradient(to right, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.content-body {
  padding-bottom: 2rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: rgba(31, 41, 55, 0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(75, 85, 99, 0.3);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
}

.metric-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.metric-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}

.metric-icon.revenue {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.metric-icon.transactions {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.metric-icon.average {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
}

.metric-icon.customers {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.metric-content {
  flex: 1;
}

.metric-label {
  color: #9ca3af;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.metric-value {
  color: #f3f4f6;
  font-size: 1.875rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.metric-change {
  font-size: 0.75rem;
}

.metric-change.positive {
  color: #10b981;
}

.metric-change.negative {
  color: #ef4444;
}

.card {
  background: rgba(31, 41, 55, 0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(75, 85, 99, 0.3);
  border-radius: 1rem;
  padding: 1.5rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #f3f4f6;
  margin-bottom: 1.5rem;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: 0.75rem;
  color: #9ca3af;
  font-size: 0.875rem;
  font-weight: 600;
  border-bottom: 1px solid rgba(75, 85, 99, 0.3);
}

.data-table td {
  padding: 0.75rem;
  color: #e5e7eb;
  font-size: 0.875rem;
  border-bottom: 1px solid rgba(75, 85, 99, 0.2);
}

.data-table tbody tr:hover {
  background: rgba(75, 85, 99, 0.1);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-badge.completed {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.status-badge.voided {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.status-badge.low-stock {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.status-badge.in-stock {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.summary-stats {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  color: #9ca3af;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  color: #f3f4f6;
  font-size: 1.25rem;
  font-weight: bold;
}

.text-warning {
  color: #f59e0b;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  color: #9ca3af;
  font-size: 0.875rem;
  font-weight: 500;
}

.filter-select,
.filter-input {
  padding: 0.5rem;
  background: rgba(17, 24, 39, 0.5);
  border: 1px solid rgba(75, 85, 99, 0.5);
  border-radius: 0.5rem;
  color: #f3f4f6;
  font-size: 0.875rem;
}

.filter-input::placeholder {
  color: #6b7280;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-generate {
  padding: 0.5rem 1rem;
  background: linear-gradient(to right, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-generate:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-print {
  padding: 0.5rem 1rem;
  background: rgba(107, 114, 128, 0.2);
  color: #9ca3af;
  border: 1px solid rgba(107, 114, 128, 0.5);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-print:hover {
  background: rgba(107, 114, 128, 0.3);
  color: #d1d5db;
  transform: translateY(-1px);
}

.btn-icon {
  width: 1.125rem;
  height: 1.125rem;
}

.payment-methods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.payment-method-card {
  padding: 1rem;
  background: rgba(17, 24, 39, 0.5);
  border-radius: 0.75rem;
  border: 1px solid rgba(75, 85, 99, 0.2);
}

.payment-method-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.payment-method-name {
  color: #f3f4f6;
  font-weight: 600;
}

.payment-method-amount {
  color: #3b82f6;
  font-weight: bold;
  font-size: 1.125rem;
}

.payment-method-bar {
  height: 0.5rem;
  background: rgba(75, 85, 99, 0.3);
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.payment-method-fill {
  height: 100%;
  background: linear-gradient(to right, #3b82f6, #8b5cf6);
  transition: width 0.3s;
}

.payment-method-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
}

.chart-title {
  font-size: 1rem;
  font-weight: 600;
  color: #f3f4f6;
  margin-bottom: 1rem;
}

.chart-container {
  position: relative;
  width: 100%;
  height: 300px;
}

.chart-container canvas {
  max-width: 100%;
  max-height: 100%;
}

.mb-6 { margin-bottom: 1.5rem; }
</style>
