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
            
            <div class="export-dropdown">
              <button @click="showExportMenu = !showExportMenu" class="btn-export">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="export-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </button>
              <div v-if="showExportMenu" class="export-menu">
                <button @click="exportToPDF" class="export-option">
                  <span>📄 Export as PDF</span>
                </button>
                <button @click="exportToExcel" class="export-option">
                  <span>📊 Export as Excel</span>
                </button>
              </div>
            </div>
            <button @click="debugFetchRaw" class="btn-debug" title="Debug: print raw DB rows for current date range">Debug DB Rows</button>
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
              <p class="metric-value">{{ formatInteger(metrics.totalTransactions) }}</p>
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
              <p class="metric-value">{{ formatInteger(metrics.uniqueCustomers) }}</p>
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

          <!-- Peak Hours Chart removed per request -->

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
          <div class="table-container transactions-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Transaction ID</th>
                  <th>Employee</th>
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
                  <td>{{ transaction.cashier_name || 'Unknown' }}</td>
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
                  <td colspan="7" class="text-center text-gray-500">No transactions yet</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Peak Hours Heatmap (now part of Sales Analytics) -->
        <div class="card mb-6">
          <h2 class="card-title">Peak Hours Analysis</h2>
          <div class="heatmap-container">
            <table class="heatmap-table">
              <thead>
                <tr>
                  <th>Hour</th>
                  <th>Mon</th>
                  <th>Tue</th>
                  <th>Wed</th>
                  <th>Thu</th>
                  <th>Fri</th>
                  <th>Sat</th>
                  <th>Sun</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="hour in 24" :key="hour">
                  <td class="hour-label">{{ formatHour(hour - 1) }}</td>
                  <td v-for="day in 7" :key="day" 
                      :class="['heatmap-cell', getHeatmapClass(hour - 1, day - 1)]"
                      :title="`${formatHour(hour - 1)} on ${getDayName(day - 1)}: ${getHeatmapValue(hour - 1, day - 1)} transactions`">
                    {{ getHeatmapValue(hour - 1, day - 1) }}
                  </td>
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

        <!-- Top/Bottom Performers Report Tab -->
        <div v-if="selectedReportType === 'performers'" class="performers-report">
          <div class="card mb-6">
            <h2 class="card-title">Top Performing Items</h2>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Item Name</th>
                    <th>Qty Sold</th>
                    <th>Revenue</th>
                    <th>Est. Profit</th>
                    <th>Profit Margin</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in performersData.topPerformers" :key="index">
                    <td class="font-semibold">{{ index + 1 }}</td>
                    <td>{{ item.item_name }}</td>
                    <td>{{ item.quantity_sold }}</td>
                    <td class="text-success">${{ formatNumber(item.revenue) }}</td>
                    <td>${{ formatNumber(item.estimated_profit) }}</td>
                    <td>
                      <span class="profit-badge" :class="item.profit_margin >= 40 ? 'high' : item.profit_margin >= 25 ? 'medium' : 'low'">
                        {{ formatNumber(item.profit_margin) }}%
                      </span>
                    </td>
                  </tr>
                  <tr v-if="performersData.topPerformers.length === 0">
                    <td colspan="6" class="text-center text-gray-500">No data available for this period</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="card mb-6">
            <h2 class="card-title">Bottom Performing Items</h2>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Item Name</th>
                    <th>Qty Sold</th>
                    <th>Revenue</th>
                    <th>Est. Profit</th>
                    <th>Profit Margin</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in performersData.bottomPerformers" :key="index">
                    <td class="font-semibold">{{ performersData.bottomPerformers.length - index }}</td>
                    <td>{{ item.item_name }}</td>
                    <td>{{ item.quantity_sold }}</td>
                    <td class="text-warning">${{ formatNumber(item.revenue) }}</td>
                    <td>${{ formatNumber(item.estimated_profit) }}</td>
                    <td>
                      <span class="profit-badge" :class="item.profit_margin >= 40 ? 'high' : item.profit_margin >= 25 ? 'medium' : 'low'">
                        {{ formatNumber(item.profit_margin) }}%
                      </span>
                    </td>
                  </tr>
                  <tr v-if="performersData.bottomPerformers.length === 0">
                    <td colspan="6" class="text-center text-gray-500">No data available for this period</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Cost Analysis Report Tab -->
        <div v-if="selectedReportType === 'costs'" class="costs-report">
          <div class="metrics-grid mb-6">
            <div class="metric-card">
              <div class="metric-content">
                <p class="metric-label">Food Cost %</p>
                <p class="metric-value" :class="costsData.foodCostPercentage > 35 ? 'text-danger' : costsData.foodCostPercentage > 28 ? 'text-warning' : 'text-success'">
                  {{ formatNumber(costsData.foodCostPercentage) }}%
                </p>
                <p class="metric-subtext">Target: 28-35%</p>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-content">
                <p class="metric-label">Labor Cost %</p>
                <p class="metric-value" :class="costsData.laborCostPercentage > 35 ? 'text-danger' : costsData.laborCostPercentage > 25 ? 'text-warning' : 'text-success'">
                  {{ formatNumber(costsData.laborCostPercentage) }}%
                </p>
                <p class="metric-subtext">Target: 25-35%</p>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-content">
                <p class="metric-label">Prime Cost</p>
                <p class="metric-value" :class="costsData.primeCost > 65 ? 'text-danger' : costsData.primeCost > 60 ? 'text-warning' : 'text-success'">
                  {{ formatNumber(costsData.primeCost) }}%
                </p>
                <p class="metric-subtext">Target: &lt;65%</p>
              </div>
            </div>
          </div>

          <div v-if="costsData.primeCost > 65" class="alert alert-danger mb-6">
            <strong>Alert:</strong> Prime cost exceeds 65%. Consider reviewing menu prices, portion sizes, or labor scheduling.
          </div>
        </div>

        <!-- Employee Performance Report Tab -->
        <div v-if="selectedReportType === 'employees'" class="employees-report">
          <div class="card mb-6">
            <h2 class="card-title">Employee Performance Metrics</h2>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Total Hours</th>
                    <th>Overtime Hours</th>
                    <th>Labor Cost</th>
                    <th>Sales Per Hour</th>
                    <th>Efficiency</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="emp in employeePerformance.employees" :key="emp.employee_name">
                    <td class="font-semibold">{{ emp.employee_name }}</td>
                    <td>{{ formatNumber(emp.total_hours) }}</td>
                    <td>{{ formatNumber(emp.overtime_hours) }}</td>
                    <td>${{ formatNumber(emp.total_labor_cost) }}</td>
                    <td class="text-success">${{ formatNumber(emp.sales_per_labor_hour) }}</td>
                    <td>
                      <span class="efficiency-badge" :class="emp.sales_per_labor_hour >= 100 ? 'high' : emp.sales_per_labor_hour >= 50 ? 'medium' : 'low'">
                        {{ emp.sales_per_labor_hour >= 100 ? 'Excellent' : emp.sales_per_labor_hour >= 50 ? 'Good' : 'Needs Improvement' }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="employeePerformance.employees.length === 0">
                    <td colspan="6" class="text-center text-gray-500">No employee data available for this period</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Peak Hours Report Tab -->
        <!-- REMOVED - Now integrated into Sales Analytics tab -->

        <!-- Customer Insights Report Tab -->
        <div v-if="selectedReportType === 'customers'" class="customers-report">
          <div class="metrics-grid mb-6">
            <div class="metric-card">
              <div class="metric-content">
                <p class="metric-label">Average Transaction</p>
                <p class="metric-value">${{ formatNumber(customerInsights.avgTransaction) }}</p>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-content">
                <p class="metric-label">Minimum Transaction</p>
                <p class="metric-value">${{ formatNumber(customerInsights.minTransaction) }}</p>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-content">
                <p class="metric-label">Maximum Transaction</p>
                <p class="metric-value">${{ formatNumber(customerInsights.maxTransaction) }}</p>
              </div>
            </div>
          </div>

          <div class="card mb-6">
            <h2 class="card-title">Popular Item Combinations</h2>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Item Combination</th>
                    <th>Times Ordered Together</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="combo in customerInsights.popularCombos" :key="combo.item_combo">
                    <td class="font-semibold">{{ combo.item_combo }}</td>
                    <td>{{ combo.combo_count }}</td>
                  </tr>
                  <tr v-if="customerInsights.popularCombos.length === 0">
                    <td colspan="2" class="text-center text-gray-500">No combo data available for this period</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Financial Summary Report Tab -->
        <div v-if="selectedReportType === 'financial'" class="financial-report">
          <div class="card mb-6">
            <h2 class="card-title">Profit & Loss Summary</h2>
            <div class="financial-summary">
              <div class="financial-row">
                <span class="financial-label">Total Revenue</span>
                <span class="financial-value text-success">${{ formatNumber(financialSummary.revenue) }}</span>
              </div>
              <div class="financial-row">
                <span class="financial-label">Total Expenses</span>
                <span class="financial-value text-danger">${{ formatNumber(financialSummary.expenses) }}</span>
              </div>
              <div class="financial-row separator">
                <span class="financial-label font-bold">Net Profit</span>
                <span class="financial-value font-bold" :class="financialSummary.profit >= 0 ? 'text-success' : 'text-danger'">
                  ${{ formatNumber(financialSummary.profit) }}
                </span>
              </div>
              <div class="financial-row">
                <span class="financial-label">Profit Margin</span>
                <span class="financial-value">{{ formatNumber(financialSummary.profitMargin) }}%</span>
              </div>
            </div>
          </div>

          <!-- Cost Analysis (now part of Financial Summary) -->
          <div class="metrics-grid mb-6">
            <div class="metric-card">
              <div class="metric-content">
                <p class="metric-label">Food Cost %</p>
                <p class="metric-value" :class="costsData.foodCostPercentage > 35 ? 'text-danger' : costsData.foodCostPercentage > 28 ? 'text-warning' : 'text-success'">
                  {{ formatNumber(costsData.foodCostPercentage) }}%
                </p>
                <p class="metric-subtext">Target: 28-35%</p>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-content">
                <p class="metric-label">Labor Cost %</p>
                <p class="metric-value" :class="costsData.laborCostPercentage > 35 ? 'text-danger' : costsData.laborCostPercentage > 25 ? 'text-warning' : 'text-success'">
                  {{ formatNumber(costsData.laborCostPercentage) }}%
                </p>
                <p class="metric-subtext">Target: 25-35%</p>
              </div>
            </div>

            <div class="metric-card">
              <div class="metric-content">
                <p class="metric-label">Prime Cost %</p>
                <p class="metric-value" :class="costsData.primeCostPercentage > 65 ? 'text-danger' : costsData.primeCostPercentage > 60 ? 'text-warning' : 'text-success'">
                  {{ formatNumber(costsData.primeCostPercentage) }}%
                </p>
                <p class="metric-subtext">Target: &lt; 60%</p>
              </div>
            </div>
          </div>

          <div v-if="costsData.primeCostPercentage > 65" class="alert alert-danger mb-6">
            ⚠️ Warning: Prime Cost is above 65%. Consider reviewing menu pricing, portion sizes, or labor scheduling.
          </div>
          <div v-else-if="costsData.primeCostPercentage > 60" class="alert alert-warning mb-6">
            ⚠️ Caution: Prime Cost is approaching the upper threshold. Monitor costs closely.
          </div>
        </div>

        <!-- Payroll Report Tab (existing) -->

        <div v-if="selectedReportType === 'payroll'" class="payroll-report">
          <!-- Report Filters -->
          <div class="card mb-6">
            <h2 class="card-title">Report Filters</h2>
            <div class="filters-grid">
              <div class="filter-group">
                <label class="filter-label">Employee</label>
                <select v-model="payrollFilters.employeeId" class="filter-select">
                  <option value="all">All Employees</option>
                  <option v-for="emp in payrollEmployees" :key="emp.id" :value="emp.id">
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
                  <button @click="exportPayrollToExcel" class="btn-primary" style="display: flex; align-items: center; gap: 0.5rem;">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="btn-icon">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export to Excel
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
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import Sidebar from '../components/Sidebar.vue';
import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

Chart.register(...registerables);

const { ipcRenderer } = window.require('electron');

const selectedReportType = ref('sales');
const showExportMenu = ref(false);
const reportTabs = [
  { id: 'sales', label: 'Sales Analytics' },
  { id: 'financial', label: 'Financial Summary' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'payroll', label: 'Payroll' }
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

// List of employees to populate payroll employee filter
const payrollEmployees = ref([]);

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

// Analytics data refs
const performersData = ref({
  topPerformers: [],
  bottomPerformers: []
});

const inventoryAnalytics = ref({
  totalValue: 0,
  averageTurnover: 0,
  lowStockItems: [],
  wasteData: []
});

const costsData = ref({
  foodCostPercentage: 0,
  laborCostPercentage: 0,
  primeCost: 0,
  foodCostTrend: [],
  laborCostTrend: []
});

const employeePerformance = ref({
  employees: []
});

const peakHoursData = ref({
  heatmapData: [],
  hourLabels: [],
  dayLabels: []
});

const customerInsights = ref({
  avgTransaction: 0,
  minTransaction: 0,
  maxTransaction: 0,
  popularCombos: []
});

const financialSummary = ref({
  revenue: 0,
  expenses: 0,
  profit: 0,
  profitMargin: 0,
  revenueBreakdown: [],
  expenseBreakdown: []
});

const salesTrendChart = ref(null);
// peakHoursChart removed
const costBreakdownChart = ref(null);
const laborCostChart = ref(null);

let chartInstances = {
  salesTrend: null,
  costBreakdown: null,
  laborCost: null
};

const formatNumber = (num) => {
  return Number(num || 0).toFixed(2);
};

const formatInteger = (num) => {
  return Math.round(Number(num || 0));
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

// Heatmap helper functions
const getHeatmapValue = (hourIndex, dayIndex) => {
  const data = peakHoursData.value.heatmapData.find(
    item => item.day_of_week === dayIndex && item.hour_of_day === hourIndex
  );
  return data ? data.transaction_count : 0;
};

const getHeatmapClass = (hourIndex, dayIndex) => {
  const value = getHeatmapValue(hourIndex, dayIndex);
  if (value === 0) return 'empty';
  if (value >= 50) return 'very-busy';
  if (value >= 30) return 'busy';
  if (value >= 15) return 'moderate';
  return 'light';
};

const formatHour = (hour) => {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
};

const getDayName = (dayIndex) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days[dayIndex] || '';
};

const getHeatmapTooltip = (dayIndex, hourIndex) => {
  const data = peakHoursData.value.heatmapData.find(
    item => item.day_of_week === dayIndex && item.hour_of_day === hourIndex
  );
  if (!data || data.transaction_count === 0) return 'No transactions';
  
  const avgValue = data.avg_transaction_value ? `Avg: $${formatNumber(data.avg_transaction_value)}` : '';
  return `${data.transaction_count} transactions\nRevenue: $${formatNumber(data.total_revenue)}\n${avgValue}`;
};

// Parse SQLite-style timestamp (YYYY-MM-DD HH:MM:SS) as local Date by constructing components
const parseSQLiteLocalDate = (ts) => {
  if (!ts) return null;
  const s = String(ts).trim();
  // Match 'YYYY-MM-DD HH:MM:SS' or 'YYYY-MM-DDTHH:MM:SS'
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
  if (m) {
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    const day = parseInt(m[3], 10);
    const hour = parseInt(m[4], 10);
    const minute = parseInt(m[5], 10);
    const second = parseInt(m[6], 10);
    // Database CURRENT_TIMESTAMP is UTC; construct a UTC date then convert to local Date
    const utcMs = Date.UTC(year, month, day, hour, minute, second);
    return new Date(utcMs);
  }
  return null;
};

// Normalize various timestamp formats into an ISO date string 'YYYY-MM-DD'
const normalizeToISODate = (ts) => {
  if (!ts) return null;
  try {
    // Epoch
    if (/^\d+$/.test(String(ts))) {
      const d = new Date(parseInt(ts, 10));
      return d.toISOString().split('T')[0];
    }

    // Try SQLite local parse first
    const localD = parseSQLiteLocalDate(ts);
    if (localD) return localD.toISOString().split('T')[0];

    // Try direct parse
    let d = new Date(ts);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];

    // As a last resort, try appending Z (UTC)
    const s = String(ts);
    const dUTC = new Date(s.includes('Z') ? s : (s + 'Z'));
    if (!isNaN(dUTC.getTime())) return dUTC.toISOString().split('T')[0];

    return null;
  } catch (e) {
    return null;
  }
};

// Normalize timestamp and return a Date object (tries several formats): prefer local SQLite parsing
const normalizeToDate = (ts) => {
  if (!ts) return null;
  try {
    // Epoch
    if (/^\d+$/.test(String(ts))) return new Date(parseInt(ts, 10));

    // Prefer SQLite local parse
    const local = parseSQLiteLocalDate(ts);
    if (local) return local;

    // Direct parse
    let d = new Date(ts);
    if (!isNaN(d.getTime())) return d;

    // Try replacing space with T
    const s = String(ts);
    if (s.includes(' ') && !s.includes('T')) {
      const sLocal = s.replace(' ', 'T');
      d = new Date(sLocal);
      if (!isNaN(d.getTime())) return d;
    }

    // Fallback UTC
    const dUTC = new Date(s.includes('Z') ? s : (s + 'Z'));
    if (!isNaN(dUTC.getTime())) return dUTC;

    return null;
  } catch (e) {
    return null;
  }
};

const getDateRange = () => {
  let startDate, endDate;
  const currentDate = new Date();

  switch (selectedPeriod.value) {
    case 'today':
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0, 0);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59, 999);
      break;
    case 'week':
      startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - currentDate.getDay());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      break;
    case 'month':
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = new Date();
      break;
    case 'year':
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      endDate = new Date();
      break;
    case 'custom':
      startDate = new Date(customStartDate.value);
      endDate = new Date(customEndDate.value);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  return {
    start: getLocalDateString(startDate),
    end: getLocalDateString(endDate),
    startDate: getLocalDateString(startDate),
    endDate: getLocalDateString(endDate)
  };
};

const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const loadReports = async () => {
  try {
    // Destroy all chart instances before loading new data
    Object.keys(chartInstances).forEach(key => {
      if (chartInstances[key]) {
        try {
          chartInstances[key].destroy();
        } catch (e) {
          console.warn(`Failed to destroy chart ${key}:`, e);
        }
        chartInstances[key] = null;
      }
    });
    
    // Wait for charts to fully destroy and DOM to update
    await new Promise(resolve => setTimeout(resolve, 250));
    await nextTick();
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const dateRange = getDateRange();

    if (selectedReportType.value === 'sales') {
      await loadSalesReport(currentUser, dateRange);
      await loadPerformersReport(currentUser.businessId, dateRange);
      await loadPeakHoursReport(currentUser.businessId, dateRange);
    } else if (selectedReportType.value === 'financial') {
      await loadFinancialSummaryReport(currentUser.businessId, dateRange);
      await loadCostsReport(currentUser.businessId, dateRange);
    } else if (selectedReportType.value === 'inventory') {
      await loadInventoryReport(currentUser.businessId);
    } else if (selectedReportType.value === 'payroll') {
      await loadPayrollReport(currentUser.businessId, dateRange);
    }
  } catch (error) {
    console.error('Error loading reports:', error);
  }
};

// Debug helper: fetch raw DB rows for current UI date range and log them
const debugFetchRaw = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.businessId) {
      console.warn('Debug fetch: currentUser not found in localStorage');
      return;
    }
    const dateRange = getDateRange();
    const rows = await ipcRenderer.invoke('debug:get-raw-transactions', {
      businessId: currentUser.businessId,
      startDate: dateRange.start,
      endDate: dateRange.end
    });
    console.log('DEBUG raw transactions rows:', rows);
    if (Array.isArray(rows)) {
      rows.slice(0, 50).forEach(r => {
        console.log(`DEBUG ROW id=${r.id} created_at=${r.created_at} total=${r.total} cashier=${r.cashier_name}`);
      });
    } else {
      console.log('DEBUG result:', rows);
    }
  } catch (e) {
    console.error('debugFetchRaw failed', e);
  }
};

const loadSalesReport = async (currentUser, dateRange) => {
  // Load transactions for the period
  const transactions = await ipcRenderer.invoke('pos:get-transactions-by-date', {
    businessId: currentUser.businessId,
    startDate: dateRange.start,
    endDate: dateRange.end
  });

  console.log('[Reports] Transactions returned:', transactions?.length, transactions?.slice?.(0, 3));

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
  console.log('[Reports] Completed transactions count:', completedTransactions.length, completedTransactions.slice(0, 3));
  metrics.value.totalRevenue = completedTransactions.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);
  metrics.value.totalTransactions = completedTransactions.length;
  metrics.value.averageOrderValue = completedTransactions.length > 0 
    ? metrics.value.totalRevenue / completedTransactions.length 
    : 0;
  
  // Count all transactions as unique customers (each transaction = 1 customer)
  metrics.value.uniqueCustomers = completedTransactions.length;

  // Calculate changes vs previous period
  const previousPeriodData = await getPreviousPeriodData(currentUser.businessId, dateRange);
  metrics.value.revenueChange = calculatePercentageChange(metrics.value.totalRevenue, previousPeriodData.revenue);
  metrics.value.transactionChange = calculatePercentageChange(metrics.value.totalTransactions, previousPeriodData.transactions);
  metrics.value.aovChange = calculatePercentageChange(metrics.value.averageOrderValue, previousPeriodData.avgOrderValue);
  metrics.value.customerChange = calculatePercentageChange(metrics.value.uniqueCustomers, previousPeriodData.customers);

  await loadTopSellingItems(currentUser.businessId);

  // Get payment methods breakdown from payment_methods table
  await loadPaymentMethods(currentUser.businessId, dateRange);

  // Set recent transactions with real item counts by fetching full transaction details
  try {
    const recent = filteredTransactions.slice(0, 10);
    const detailPromises = recent.map(tx => ipcRenderer.invoke('pos:get-transaction', { businessId: currentUser.businessId, transactionId: tx.id }).catch(err => null));
    const detailed = await Promise.all(detailPromises);
    recentTransactions.value = recent.map((t, i) => {
      const full = detailed[i];
      let itemCount = 0;
      if (full && Array.isArray(full.items)) {
        itemCount = full.items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0), 0);
      }
      return {
        ...t,
        itemCount
      };
    });
  } catch (err) {
    console.error('Failed to load detailed transactions for recent list:', err);
    recentTransactions.value = filteredTransactions.slice(0, 10).map(t => ({ ...t, itemCount: 0 }));
  }

  // Render charts after data is loaded
  await nextTick();
  // If backend returned no completed transactions for the selected period,
  // try the debug IPC to fetch raw DB rows (expanded UTC window) and use those for charting.
  let transactionsForCharts = completedTransactions;
  try {
    if ((!transactionsForCharts || transactionsForCharts.length === 0) && window && window.ipcRenderer) {
      console.warn('[Reports] No completed transactions returned — attempting debug:get-raw-transactions fallback');
      const raw = await ipcRenderer.invoke('debug:get-raw-transactions', {
        businessId: currentUser.businessId,
        startDate: dateRange.start,
        endDate: dateRange.end
      });
      if (Array.isArray(raw) && raw.length > 0) {
        // Map raw rows to the transaction shape expected by renderCharts
        transactionsForCharts = raw.map(r => ({
          id: r.id,
          created_at: r.created_at,
          total: r.total,
          status: r.status || 'completed',
          cashier_id: r.cashier_id || r.cashierId || null
        }));
        console.log('[Reports] Using debug fallback rows for charts, count=', transactionsForCharts.length);
      }
    }
  } catch (e) {
    console.error('[Reports] debug fallback failed', e);
  }

  await renderCharts(transactionsForCharts, currentUser.businessId, { startDate: dateRange.start, endDate: dateRange.end });
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

// Load Top/Bottom Performers Report
const loadPerformersReport = async (businessId, dateRange) => {
  try {
    const result = await ipcRenderer.invoke('analytics:top-bottom-performers', {
      businessId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      limit: 10
    });
    
    if (result && result.values) {
      const performers = result.values.map(row => ({
        item_name: row[0],
        quantity_sold: row[1],
        revenue: row[2],
        estimated_cost: row[3],
        estimated_profit: row[4],
        profit_margin: row[5]
      }));
      
      performersData.value.topPerformers = performers.slice(0, 10);
      performersData.value.bottomPerformers = performers.slice(-10).reverse();
    } else {
      performersData.value = { topPerformers: [], bottomPerformers: [] };
    }
  } catch (error) {
    console.error('Error loading performers report:', error);
    performersData.value = { topPerformers: [], bottomPerformers: [] };
  }
};

// Load Inventory Analytics Report
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
      filteredItems = filteredItems.filter(item => {
        const minQty = item.minimum_quantity || item.min_quantity || 0;
        return item.quantity <= minQty;
      });
    } else if (inventoryFilters.value.stockStatus === 'in-stock') {
      filteredItems = filteredItems.filter(item => {
        const minQty = item.minimum_quantity || item.min_quantity || 0;
        return item.quantity > minQty;
      });
    }
    
    inventoryData.value.items = filteredItems;
    inventoryData.value.totalItems = filteredItems.length;
    inventoryData.value.lowStockCount = filteredItems.filter(item => item.quantity <= (item.minimum_quantity || item.min_quantity || 0)).length;
    inventoryData.value.totalValue = filteredItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity || 0);
      const cost = parseFloat(item.unit_cost || 0);
      return sum + (qty * cost);
    }, 0);
    
    // Load analytics data
    const analyticsResult = await ipcRenderer.invoke('analytics:inventory', businessId);
    if (analyticsResult && analyticsResult.values) {
      const analytics = analyticsResult.values.map(row => ({
        item_name: row[0],
        quantity: row[1],
        unit_cost: row[2],
        total_value: row[3],
        turnover_rate: row[4],
        sold_last_30_days: row[5],
        stock_status: row[6]
      }));
      
      inventoryAnalytics.value.totalValue = analytics.reduce((sum, item) => sum + (parseFloat(item.total_value) || 0), 0);
      inventoryAnalytics.value.averageTurnover = analytics.length > 0
        ? analytics.reduce((sum, item) => sum + (parseFloat(item.turnover_rate) || 0), 0) / analytics.length
        : 0;
      inventoryAnalytics.value.lowStockItems = analytics.filter(item => item.stock_status === 'low');
    }
    
    // Load waste data
    const dateRange = getDateRange();
    const wasteResult = await ipcRenderer.invoke('analytics:waste', {
      businessId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
    
    if (wasteResult && wasteResult.values) {
      inventoryAnalytics.value.wasteData = wasteResult.values.map(row => ({
        item_name: row[0],
        total_quantity: row[1],
        total_cost: row[2],
        reason: row[3]
      }));
    }
  } catch (error) {
    console.error('Error loading inventory report:', error);
    inventoryData.value = { totalItems: 0, lowStockCount: 0, totalValue: 0, items: [] };
    inventoryAnalytics.value = { totalValue: 0, averageTurnover: 0, lowStockItems: [], wasteData: [] };
  }
};

// Load Cost Analysis Report
const loadCostsReport = async (businessId, dateRange) => {
  try {
    const result = await ipcRenderer.invoke('analytics:cost-analysis', {
      businessId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
    
    if (result && result.foodCost && result.foodCost.values && result.laborCost && result.laborCost.values) {
      // Calculate average percentages
      const foodCostData = result.foodCost.values.map(row => ({
        date: row[0],
        revenue: row[1],
        food_cost: row[2],
        food_cost_percentage: row[3]
      }));
      
      const laborCostData = result.laborCost.values.map(row => ({
        date: row[0],
        revenue: row[1],
        labor_cost: row[2],
        labor_cost_percentage: row[3]
      }));
      
      costsData.value.foodCostTrend = foodCostData;
      costsData.value.laborCostTrend = laborCostData;
      
      // Calculate averages
      costsData.value.foodCostPercentage = foodCostData.length > 0
        ? foodCostData.reduce((sum, d) => sum + (parseFloat(d.food_cost_percentage) || 0), 0) / foodCostData.length
        : 0;
      
      costsData.value.laborCostPercentage = laborCostData.length > 0
        ? laborCostData.reduce((sum, d) => sum + (parseFloat(d.labor_cost_percentage) || 0), 0) / laborCostData.length
        : 0;
      
      costsData.value.primeCost = costsData.value.foodCostPercentage + costsData.value.laborCostPercentage;
    }
  } catch (error) {
    console.error('Error loading costs report:', error);
    costsData.value = { foodCostPercentage: 0, laborCostPercentage: 0, primeCost: 0, foodCostTrend: [], laborCostTrend: [] };
  }
};

// Load Employee Performance Report
const loadEmployeePerformanceReport = async (businessId, dateRange) => {
  try {
    const result = await ipcRenderer.invoke('analytics:employee-performance', {
      businessId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
    
    if (result && result.values) {
      employeePerformance.value.employees = result.values.map(row => ({
        employee_name: row[0],
        total_hours: row[1],
        overtime_hours: row[2],
        total_labor_cost: row[3],
        sales_per_labor_hour: row[4]
      }));
    }
  } catch (error) {
    console.error('Error loading employee performance report:', error);
    employeePerformance.value = { employees: [] };
  }
};

// Load Peak Hours Report
const loadPeakHoursReport = async (businessId, dateRange) => {
  try {
    const result = await ipcRenderer.invoke('analytics:peak-hours', {
      businessId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
    
    console.log('Peak hours raw result:', result);
    
    if (result && result.values) {
      // SQLite strftime('%w') returns: 0=Sunday, 1=Monday, ..., 6=Saturday
      // UI table expects: 0=Monday, 1=Tuesday, ..., 6=Sunday
      // So we need to convert: (day_of_week + 6) % 7
      const heatmap = result.values.map(row => ({
        day_of_week: (parseInt(row[0]) + 6) % 7, // Convert Sunday=0 to Sunday=6
        hour_of_day: parseInt(row[1]),
        transaction_count: row[2],
        total_revenue: row[3],
        avg_transaction_value: row[4]
      }));
      
      console.log('Processed heatmap data:', heatmap);
      
      peakHoursData.value.heatmapData = heatmap;
      peakHoursData.value.dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      peakHoursData.value.hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    }
  } catch (error) {
    console.error('Error loading peak hours report:', error);
    peakHoursData.value = { heatmapData: [], hourLabels: [], dayLabels: [] };
  }
};

// Load Customer Insights Report
const loadCustomerInsightsReport = async (businessId, dateRange) => {
  try {
    const result = await ipcRenderer.invoke('analytics:customer-insights', {
      businessId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
    
    if (result && result.avgTransaction && result.avgTransaction.values && result.avgTransaction.values.length > 0) {
      const avg = result.avgTransaction.values[0];
      customerInsights.value.avgTransaction = avg[0] || 0;
      customerInsights.value.minTransaction = avg[1] || 0;
      customerInsights.value.maxTransaction = avg[2] || 0;
    }
    
    if (result && result.popularCombos && result.popularCombos.values) {
      customerInsights.value.popularCombos = result.popularCombos.values.map(row => ({
        item_combo: row[0],
        combo_count: row[1]
      }));
    }
  } catch (error) {
    console.error('Error loading customer insights report:', error);
    customerInsights.value = { avgTransaction: 0, minTransaction: 0, maxTransaction: 0, popularCombos: [] };
  }
};

// Load Financial Summary Report
const loadFinancialSummaryReport = async (businessId, dateRange) => {
  try {
    const result = await ipcRenderer.invoke('analytics:financial-summary', {
      businessId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
    
    if (result && result.revenue && result.expenses) {
      // Parse revenue data
      const revenueData = result.revenue.values && result.revenue.values.length > 0 
        ? result.revenue.values[0] 
        : [0, 0, 0, 0];
      
      const totalRevenue = parseFloat(revenueData[0]) || 0;
      const totalTax = parseFloat(revenueData[1]) || 0;
      
      // Parse expense data
      const expenseData = result.expenses.values && result.expenses.values.length > 0 
        ? result.expenses.values[0] 
        : [0, 0];
      
      const laborCost = parseFloat(expenseData[0]) || 0;
      const inventoryPurchases = parseFloat(expenseData[1]) || 0;
      const totalExpenses = laborCost + inventoryPurchases;
      
      // Calculate profit and margin
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      
      financialSummary.value.revenue = totalRevenue;
      financialSummary.value.expenses = totalExpenses;
      financialSummary.value.profit = netProfit;
      financialSummary.value.profitMargin = profitMargin;
    }
  } catch (error) {
    console.error('Error loading financial summary report:', error);
    financialSummary.value = { revenue: 0, expenses: 0, profit: 0, profitMargin: 0, revenueBreakdown: [], expenseBreakdown: [] };
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

const exportToPDF = () => {
  showExportMenu.value = false;
  
  const doc = new jsPDF();
  const dateRange = getDateRange();
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  
  // Add header
  doc.setFontSize(18);
  doc.text('FoodBiz Management System', 14, 22);
  doc.setFontSize(14);
  doc.text(`${reportTabs.find(t => t.id === selectedReportType.value).label}`, 14, 32);
  doc.setFontSize(10);
  doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 40);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 46);
  
  let yPosition = 55;

  if (selectedReportType.value === 'sales') {
    // Sales metrics
    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value', 'Change']],
      body: [
        ['Total Revenue', `$${formatNumber(metrics.value.totalRevenue)}`, `${metrics.value.revenueChange > 0 ? '+' : ''}${formatNumber(metrics.value.revenueChange)}%`],
        ['Total Transactions', metrics.value.totalTransactions, `${metrics.value.transactionChange > 0 ? '+' : ''}${formatNumber(metrics.value.transactionChange)}%`],
        ['Average Order Value', `$${formatNumber(metrics.value.averageOrderValue)}`, `${metrics.value.aovChange > 0 ? '+' : ''}${formatNumber(metrics.value.aovChange)}%`],
        ['Unique Customers', metrics.value.uniqueCustomers, `${metrics.value.customerChange > 0 ? '+' : ''}${formatNumber(metrics.value.customerChange)}%`]
      ]
    });

    // Top items
    if (topItems.value.length > 0) {
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Item Name', 'Quantity Sold', 'Revenue']],
        body: topItems.value.map(item => [
          item.item_name,
          item.quantity_sold,
          `$${formatNumber(item.revenue)}`
        ])
      });
    }

    // Recent transactions
    if (recentTransactions.value.length > 0) {
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Date/Time', 'Transaction ID', 'Items', 'Total', 'Status']],
        body: recentTransactions.value.map(t => [
          formatDateTime(t.created_at),
          `#${t.id}`,
          t.itemCount,
          `$${formatNumber(t.total)}`,
          t.status
        ])
      });
    }
  } else if (selectedReportType.value === 'inventory') {
    // Inventory summary
    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Total Items', inventoryData.value.totalItems],
        ['Low Stock Items', inventoryData.value.lowStockCount],
        ['Total Inventory Value', `$${formatNumber(inventoryData.value.totalValue)}`]
      ]
    });

    // Inventory items
    if (inventoryData.value.items.length > 0) {
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Item Name', 'Category', 'Quantity', 'Unit Cost', 'Total Value']],
        body: inventoryData.value.items.map(item => [
          item.name,
          item.category,
          item.quantity,
          `$${formatNumber(item.unit_cost)}`,
          `$${formatNumber(item.quantity * item.unit_cost)}`
        ])
      });
    }
  } else if (selectedReportType.value === 'payroll') {
    // Payroll summary
    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Total Hours', formatNumber(payrollData.value.totalHours)],
        ['Total Payroll', `$${formatNumber(payrollData.value.totalPayroll)}`]
      ]
    });

    // Employee payroll (detailed)
    if (payrollData.value.employees.length > 0) {
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Employee', 'Regular Hours', 'Overtime Hours', 'Pay Rate', 'Regular Pay', 'Overtime Pay', 'Total Pay']],
        body: payrollData.value.employees.map(emp => [
          emp.name,
          emp.regularHours !== undefined ? emp.regularHours.toFixed(2) : formatNumber(emp.regularHours || 0),
          emp.overtimeHours !== undefined ? emp.overtimeHours.toFixed(2) : formatNumber(emp.overtimeHours || 0),
          `$${formatNumber(emp.payRate || emp.hourly_rate || 0)}`,
          `$${formatNumber(emp.regularPay || emp.regular_pay || 0)}`,
          `$${formatNumber(emp.overtimePay || emp.overtime_pay || 0)}`,
          `$${formatNumber(emp.totalPay || emp.gross_pay || 0)}`
        ])
      });
    }
  }

  // Save the PDF
  const fileName = `${selectedReportType.value}-report-${dateRange.start}-to-${dateRange.end}.pdf`;
  doc.save(fileName);
};

const exportToExcel = () => {
  showExportMenu.value = false;
  
  const dateRange = getDateRange();
  const workbook = XLSX.utils.book_new();

  if (selectedReportType.value === 'sales') {
    // Metrics sheet
    const metricsData = [
      ['FoodBiz Sales Report'],
      [`Period: ${dateRange.start} to ${dateRange.end}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ['Metric', 'Value', 'Change'],
      ['Total Revenue', `$${formatNumber(metrics.value.totalRevenue)}`, `${metrics.value.revenueChange > 0 ? '+' : ''}${formatNumber(metrics.value.revenueChange)}%`],
      ['Total Transactions', metrics.value.totalTransactions, `${metrics.value.transactionChange > 0 ? '+' : ''}${formatNumber(metrics.value.transactionChange)}%`],
      ['Average Order Value', `$${formatNumber(metrics.value.averageOrderValue)}`, `${metrics.value.aovChange > 0 ? '+' : ''}${formatNumber(metrics.value.aovChange)}%`],
      ['Unique Customers', metrics.value.uniqueCustomers, `${metrics.value.customerChange > 0 ? '+' : ''}${formatNumber(metrics.value.customerChange)}%`]
    ];
    const metricsSheet = XLSX.utils.aoa_to_sheet(metricsData);
    XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Metrics');

    // Top items sheet
    if (topItems.value.length > 0) {
      const topItemsData = [
        ['Item Name', 'Quantity Sold', 'Revenue'],
        ...topItems.value.map(item => [item.item_name, item.quantity_sold, parseFloat(item.revenue)])
      ];
      const topItemsSheet = XLSX.utils.aoa_to_sheet(topItemsData);
      XLSX.utils.book_append_sheet(workbook, topItemsSheet, 'Top Items');
    }

    // Transactions sheet
    if (recentTransactions.value.length > 0) {
      const transactionsData = [
        ['Date/Time', 'Transaction ID', 'Items', 'Total', 'Status'],
        ...recentTransactions.value.map(t => [
          formatDateTime(t.created_at),
          `#${t.id}`,
          t.itemCount,
          parseFloat(t.total),
          t.status
        ])
      ];
      const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);
      XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');
    }
  } else if (selectedReportType.value === 'inventory') {
    // Summary sheet
    const summaryData = [
      ['FoodBiz Inventory Report'],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ['Metric', 'Value'],
      ['Total Items', inventoryData.value.totalItems],
      ['Low Stock Items', inventoryData.value.lowStockCount],
      ['Total Inventory Value', `$${formatNumber(inventoryData.value.totalValue)}`]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Items sheet
    if (inventoryData.value.items.length > 0) {
      const itemsData = [
        ['Item Name', 'Category', 'Quantity', 'Unit Cost', 'Total Value', 'Min Quantity', 'Supplier'],
        ...inventoryData.value.items.map(item => [
          item.name,
          item.category,
          item.quantity,
          parseFloat(item.unit_cost),
          item.quantity * parseFloat(item.unit_cost),
          item.minimum_quantity || item.min_quantity || 0,
          item.supplier || ''
        ])
      ];
      const itemsSheet = XLSX.utils.aoa_to_sheet(itemsData);
      XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Items');
    }
  } else if (selectedReportType.value === 'payroll') {
    // Summary sheet
    const summaryData = [
      ['FoodBiz Payroll Report'],
      [`Period: ${dateRange.start} to ${dateRange.end}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ['Metric', 'Value'],
      ['Total Hours', formatNumber(payrollData.value.totalHours)],
      ['Total Payroll', `$${formatNumber(payrollData.value.totalPayroll)}`]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Employees sheet (detailed payroll)
    if (payrollData.value.employees.length > 0) {
      const employeesData = [
        ['Employee ID', 'Employee Name', 'Regular Hours', 'Overtime Hours', 'Hourly Rate', 'Regular Pay', 'Overtime Pay', 'Total Pay'],
        ...payrollData.value.employees.map(emp => [
          emp.id,
          emp.name,
          parseFloat(emp.regularHours || emp.regular_hours || 0),
          parseFloat(emp.overtimeHours || emp.overtime_hours || 0),
          parseFloat(emp.payRate || emp.hourly_rate || 0),
          parseFloat(emp.regularPay || emp.regular_pay || 0),
          parseFloat(emp.overtimePay || emp.overtime_pay || 0),
          parseFloat(emp.totalPay || emp.gross_pay || 0)
        ])
      ];
      const employeesSheet = XLSX.utils.aoa_to_sheet(employeesData);
      XLSX.utils.book_append_sheet(workbook, employeesSheet, 'Employees');
    }
  }

  // Save the Excel file
  const fileName = `${selectedReportType.value}-report-${dateRange.start}-to-${dateRange.end}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

const printReport = () => {
  window.print();
};

const exportPayrollToExcel = () => {
  if (!payrollData.value || payrollData.value.employees.length === 0) {
    alert('No payroll data to export. Please generate a report first.');
    return;
  }

  // Prepare data for Excel
  const excelData = payrollData.value.employees.map(emp => ({
    'Employee Name': emp.name,
    'Regular Hours': emp.regularHours.toFixed(2),
    'Overtime Hours': emp.overtimeHours.toFixed(2),
    'Pay Rate': `$${emp.payRate.toFixed(2)}`,
    'Regular Pay': `$${emp.regularPay.toFixed(2)}`,
    'Overtime Pay': `$${emp.overtimePay.toFixed(2)}`,
    'Total Pay': `$${emp.totalPay.toFixed(2)}`
  }));

  // Add summary row
  excelData.push({
    'Employee Name': 'TOTAL',
    'Regular Hours': payrollData.value.employees.reduce((sum, e) => sum + e.regularHours, 0).toFixed(2),
    'Overtime Hours': payrollData.value.employees.reduce((sum, e) => sum + e.overtimeHours, 0).toFixed(2),
    'Pay Rate': '',
    'Regular Pay': `$${payrollData.value.employees.reduce((sum, e) => sum + e.regularPay, 0).toFixed(2)}`,
    'Overtime Pay': `$${payrollData.value.employees.reduce((sum, e) => sum + e.overtimePay, 0).toFixed(2)}`,
    'Total Pay': `$${payrollData.value.totalPayroll.toFixed(2)}`
  });

  // Create worksheet and workbook
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll Report');

  // Set column widths
  const maxWidth = 20;
  worksheet['!cols'] = [
    { wch: 25 }, // Employee Name
    { wch: 15 }, // Regular Hours
    { wch: 15 }, // Overtime Hours
    { wch: 12 }, // Pay Rate
    { wch: 15 }, // Regular Pay
    { wch: 15 }, // Overtime Pay
    { wch: 15 }  // Total Pay
  ];

  // Generate filename with date range
  const startDate = filters.value.startDate || 'all';
  const endDate = filters.value.endDate || 'all';
  const filename = `Payroll_Report_${startDate}_to_${endDate}.xlsx`;

  // Download file
  XLSX.writeFile(workbook, filename);
};

const renderCharts = async (transactions, businessId, dateRange) => {
  // Destroy all existing chart instances
  Object.keys(chartInstances).forEach(key => {
    if (chartInstances[key]) {
      try {
        chartInstances[key].destroy();
      } catch (e) {
        console.warn(`Chart ${key} already destroyed:`, e);
      }
      chartInstances[key] = null;
    }
  });

  // Wait for DOM to update
  await nextTick();

  // Check if canvas elements exist
  if (!salesTrendChart.value || !costBreakdownChart.value || !laborCostChart.value) {
    console.error('Chart canvas elements not found');
    return;
  }

  // Clear canvas contexts to ensure clean slate
  [salesTrendChart.value, costBreakdownChart.value, laborCostChart.value].forEach(canvas => {
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  });

  const totalRevenue = metrics.value.totalRevenue;
  
  console.log('Rendering charts with dateRange:', dateRange);
  console.log('Total revenue:', totalRevenue);
  console.log('Selected period:', selectedPeriod.value);

  // 1. Sales Trend Chart - Dynamic based on period
  let chartLabels = [];
  let chartData = [];
  let chartLabel = 'Sales ($)';
  
  if (selectedPeriod.value === 'today') {
    // For "today", show hourly breakdown
    const salesByHour = {};
    for (let h = 0; h < 24; h++) {
      salesByHour[h] = 0;
    }
    
    transactions.forEach(t => {
      try {
        const timestamp = t.created_at;
        let hour = null;
        
        // Try to extract hour from timestamp
        if (timestamp) {
          const dateObj = new Date(timestamp);
          if (!isNaN(dateObj.getTime())) {
            hour = dateObj.getHours();
          } else if (typeof timestamp === 'string' && timestamp.includes(' ')) {
            // Try parsing "YYYY-MM-DD HH:MM:SS" format
            const timePart = timestamp.split(' ')[1];
            if (timePart) {
              hour = parseInt(timePart.split(':')[0], 10);
            }
          }
        }
        
        if (hour !== null && hour >= 0 && hour < 24) {
          salesByHour[hour] += parseFloat(t.total || 0) || 0;
        }
      } catch (e) {
        console.warn('Error parsing transaction time:', e);
      }
    });
    
    chartLabels = Array.from({ length: 24 }, (_, h) => {
      const period = h < 12 ? 'AM' : 'PM';
      const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${displayHour}${period}`;
    });
    chartData = Array.from({ length: 24 }, (_, h) => salesByHour[h]);
    chartLabel = 'Hourly Sales ($)';
    
  } else {
    // For week, month, year, custom - show daily breakdown
    const last7Days = [];
    const salesByDay = {};
    
    // Determine how many days to show
    let daysToShow = 7;
    if (selectedPeriod.value === 'month') {
      daysToShow = 30;
    } else if (selectedPeriod.value === 'year') {
      daysToShow = 365;
    } else if (selectedPeriod.value === 'custom' && dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      daysToShow = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days.push(dateStr);
      salesByDay[dateStr] = 0;
    }

    transactions.forEach(t => {
      const dateKey = normalizeToISODate(t.created_at) || normalizeToISODate(t.created_at?.created_at) || null;
      if (dateKey && salesByDay.hasOwnProperty(dateKey)) {
        salesByDay[dateKey] += parseFloat(t.total || 0) || 0;
      }
    });
    
    chartLabels = last7Days.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    chartData = last7Days.map(d => salesByDay[d]);
    chartLabel = 'Daily Sales ($)';
  }

  chartInstances.salesTrend = new Chart(salesTrendChart.value, {
    type: 'line',
    data: {
      labels: chartLabels,
      datasets: [{
        label: chartLabel,
        data: chartData,
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

  // Peak Hours chart removed

  // 3. Cost Breakdown Chart (Real expense data)
  let otherExpenses = 0;
  try {
    // Get total expenses (excluding labor which comes from payroll)
    console.log('Fetching expenses with params:', {
      businessId,
      startDate: dateRange.startDate || dateRange.start,
      endDate: dateRange.endDate || dateRange.end
    });
    const rawExpenses = await ipcRenderer.invoke('expense:get-by-date', {
      businessId,
      startDate: dateRange.startDate || dateRange.start,
      endDate: dateRange.endDate || dateRange.end
    });
    console.log('Raw expenses response:', rawExpenses);
    if (Array.isArray(rawExpenses) && rawExpenses.length > 0) {
      otherExpenses = rawExpenses.reduce((sum, expense) => {
        const amt = parseFloat(expense.amount || expense.total_amount || 0) || 0;
        console.log(`Expense: ${expense.description} - $${amt} on ${expense.expense_date}`);
        return sum + amt;
      }, 0);
    }
    console.log('Other expenses total:', otherExpenses);
  } catch (error) {
    console.error('Error loading expenses:', error);
  }

  // Calculate labor cost directly from time logs (don't rely on payroll report being loaded)
  let laborCost = 0;
  try {
    console.log('Fetching labor cost from time logs for date range:', {
      businessId,
      startDate: dateRange.startDate || dateRange.start,
      endDate: dateRange.endDate || dateRange.end
    });
    
    const laborResult = await ipcRenderer.invoke('analytics:cost-analysis', {
      businessId,
      startDate: dateRange.startDate || dateRange.start,
      endDate: dateRange.endDate || dateRange.end
    });
    
    console.log('Labor cost analysis result:', laborResult);
    
    // Extract labor cost from the result
    if (laborResult && laborResult.laborCost && laborResult.laborCost.values && laborResult.laborCost.values.length > 0) {
      // Sum up labor costs from all days in the period
      laborCost = laborResult.laborCost.values.reduce((sum, row) => {
        const dailyLaborCost = parseFloat(row[1]) || 0; // labor_cost is second column
        return sum + dailyLaborCost;
      }, 0);
      console.log('Calculated labor cost from time logs:', laborCost);
    }
  } catch (error) {
    console.error('Error calculating labor cost:', error);
  }
  
  const totalExpenses = otherExpenses + laborCost;
  const profit = Math.max(0, totalRevenue - totalExpenses);
  
  console.log('Cost breakdown:', { otherExpenses, laborCost, totalExpenses, profit, totalRevenue });

  // Calculate percentages of total revenue
  const otherExpensesPercent = totalRevenue > 0 ? (otherExpenses / totalRevenue * 100) : 0;
  const laborPercent = totalRevenue > 0 ? (laborCost / totalRevenue * 100) : 0;
  const profitPercent = totalRevenue > 0 ? (profit / totalRevenue * 100) : 0;

  chartInstances.costBreakdown = new Chart(costBreakdownChart.value, {
    type: 'doughnut',
    data: {
      labels: ['Other Expenses', 'Labor Cost', 'Profit'],
      datasets: [{
        data: [
          parseFloat(otherExpensesPercent.toFixed(1)),
          parseFloat(laborPercent.toFixed(1)),
          parseFloat(profitPercent.toFixed(1))
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
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
              if (label === 'Other Expenses') dollarAmount = otherExpenses;
              else if (label === 'Labor Cost') dollarAmount = laborCost;
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
          'rgba(245, 158, 11, 0.8)', // Always use amber/yellow color to match cost breakdown
          'rgba(59, 130, 246, 0.4)'
        ],
        borderColor: [
          '#f59e0b', // Amber border
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

const loadTopSellingItems = async (businessId) => {
  try {
    let period = 'week';
    if (selectedPeriod.value === 'today') period = 'today';
    else if (selectedPeriod.value === 'month') period = 'month';
    else if (selectedPeriod.value === 'year') period = 'month';
    else if (selectedPeriod.value === 'custom') period = 'week';

    const result = await ipcRenderer.invoke('dashboard:get-top-performers', {
      businessId,
      period
    });

    if (result && Array.isArray(result.topItems)) {
      topItems.value = result.topItems.map(item => ({
        name: item.name,
        quantitySold: item.quantity,
        revenue: item.revenue,
        avgPrice: item.quantity ? item.revenue / item.quantity : 0
      }));
    } else {
      topItems.value = [];
    }
  } catch (error) {
    console.error('Error loading top selling items:', error);
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
      startDate: getLocalDateString(previousStart),
      endDate: getLocalDateString(previousEnd)
    });
    
    console.log('Previous period data:', {
      range: `${getLocalDateString(previousStart)} to ${getLocalDateString(previousEnd)}`,
      transactions: previousTransactions.length,
      revenue: previousTransactions.reduce((sum, t) => sum + parseFloat(t.total || 0), 0)
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
  // Automatically load today's analytics on page load
  loadReports();
  // preload employee list for payroll filters
  loadPayrollEmployees().catch(err => console.warn('Failed to preload payroll employees', err));
});

// Automatically reload when switching tabs
watch(() => selectedReportType.value, () => {
  loadReports();
});

// Automatically reload when date range changes
watch(() => selectedPeriod.value, () => {
  loadReports();
});

// Load employee list when switching to payroll tab
watch(() => selectedReportType.value, (val) => {
  if (val === 'payroll') {
    loadPayrollEmployees().catch(err => console.warn('Failed to load payroll employees on tab switch', err));
  }
});

// Load employees for payroll filter
const loadPayrollEmployees = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser || !currentUser.businessId) return;
    const emps = await ipcRenderer.invoke('employee:get-all', currentUser.businessId);
    if (Array.isArray(emps)) {
      payrollEmployees.value = emps.map(e => ({
        id: e.id,
        name: e.first_name || e.full_name || `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.name || `Employee ${e.id}`
      }));
    } else {
      payrollEmployees.value = [];
    }
  } catch (e) {
    console.error('loadPayrollEmployees failed', e);
    payrollEmployees.value = [];
  }
};

// Watch inventory filters and auto-reload when changed
watch(() => inventoryFilters.value.category, () => {
  if (selectedReportType.value === 'inventory') {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser && currentUser.businessId) {
      loadInventoryReport(currentUser.businessId);
    }
  }
});

watch(() => inventoryFilters.value.supplier, () => {
  if (selectedReportType.value === 'inventory') {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser && currentUser.businessId) {
      loadInventoryReport(currentUser.businessId);
    }
  }
});

watch(() => inventoryFilters.value.stockStatus, () => {
  if (selectedReportType.value === 'inventory') {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser && currentUser.businessId) {
      loadInventoryReport(currentUser.businessId);
    }
  }
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

.export-dropdown {
  position: relative;
}

.export-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: rgba(31, 41, 55, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(75, 85, 99, 0.5);
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  z-index: 100;
  min-width: 200px;
}

.export-option {
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  color: #f3f4f6;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.export-option:hover {
  background: rgba(59, 130, 246, 0.2);
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

.transactions-scroll {
  max-height: 22rem;
  overflow-y: auto;
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

/* Analytics Report Styles */
.profit-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-weight: 600;
  font-size: 0.875rem;
}

.profit-badge.high {
  background-color: #10b981;
  color: white;
}

.profit-badge.medium {
  background-color: #f59e0b;
  color: white;
}

.profit-badge.low {
  background-color: #ef4444;
  color: white;
}

.text-success {
  color: #10b981;
}

.text-warning {
  color: #f59e0b;
}

.text-danger {
  color: #ef4444;
}

.metric-subtext {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.alert {
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}

.alert-danger {
  background-color: rgba(239, 68, 68, 0.1);
  border-left: 4px solid #ef4444;
  color: #ef4444;
}

.efficiency-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-weight: 600;
  font-size: 0.875rem;
}

.efficiency-badge.high {
  background-color: #10b981;
  color: white;
}

.efficiency-badge.medium {
  background-color: #3b82f6;
  color: white;
}

.efficiency-badge.low {
  background-color: #6b7280;
  color: white;
}

/* Heatmap Styles */
.heatmap-container {
  padding: 1rem;
}

.heatmap-info {
  margin-bottom: 1rem;
  color: #9ca3af;
  font-size: 0.875rem;
}

.heatmap-grid {
  overflow-x: auto;
}

.heatmap-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.heatmap-table th {
  background-color: #1f2937;
  color: #f3f4f6;
  padding: 0.5rem;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid #374151;
}

.heatmap-table td {
  text-align: center;
  padding: 0.5rem;
  font-size: 0.75rem;
  border: 1px solid #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.heatmap-cell {
  background-color: #1f2937;
  color: #9ca3af;
}

.heatmap-cell.empty {
  background-color: #111827;
  color: #4b5563;
}

.heatmap-cell.light {
  background-color: #3b82f6;
  color: white;
}

.heatmap-cell.moderate {
  background-color: #2563eb;
  color: white;
}

.heatmap-cell.busy {
  background-color: #1d4ed8;
  color: white;
}

.heatmap-cell.very-busy {
  background-color: #1e40af;
  color: white;
}

.heatmap-table td:hover {
  transform: scale(1.1);
  z-index: 10;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

/* Financial Summary Styles */
.financial-summary {
  padding: 1rem;
}

.financial-row {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #374151;
}

.financial-row.separator {
  border-top: 2px solid #374151;
  border-bottom: 2px solid #374151;
  margin-top: 0.5rem;
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
}

.financial-label {
  font-size: 1rem;
  color: #d1d5db;
}

.financial-value {
  font-size: 1.25rem;
  font-weight: 600;
}

.font-bold {
  font-weight: 700;
}
</style>
