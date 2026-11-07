<template>
  <div class="expenses-view">
    <Sidebar />
    <div class="main-content">
      <div class="header">
        <h1>Expense Tracking</h1>
        <div class="header-actions">
          <button @click="processRecurringExpenses" class="btn btn-secondary" title="Process due recurring expenses">
            Process Recurring
          </button>
          <button @click="showRecurringModal = true" class="btn btn-secondary">
            Recurring Expenses
          </button>
          <button @click="showExpenseModal = true" class="btn btn-primary">
            <span class="icon">+</span>
            Add Expense
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Total Expenses (This Month)</div>
          <div class="metric-value">${{ formatNumber(monthlyTotal) }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">This Week</div>
          <div class="metric-value">${{ formatNumber(weeklyTotal) }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Today</div>
          <div class="metric-value">${{ formatNumber(dailyTotal) }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Entries</div>
          <div class="metric-value">{{ expenses.length }}</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <label>Category</label>
          <select v-model="filters.category" @change="filterExpenses">
            <option value="all">All Categories</option>
            <option value="Food/Ingredients">Food/Ingredients</option>
            <option value="Labor">Labor</option>
            <option value="Rent">Rent</option>
            <option value="Utilities">Utilities</option>
            <option value="Supplies">Supplies</option>
            <option value="Marketing">Marketing</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Start Date</label>
          <input type="date" v-model="filters.startDate" @change="filterExpenses" />
        </div>
        <div class="filter-group">
          <label>End Date</label>
          <input type="date" v-model="filters.endDate" @change="filterExpenses" />
        </div>
        <div class="filter-group">
          <label>Search Vendor</label>
          <input type="text" v-model="filters.vendor" @input="filterExpenses" placeholder="Search vendor..." />
        </div>
      </div>

      <!-- Expenses Table -->
      <div class="card">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Vendor</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Added By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="expense in filteredExpenses" :key="expense.id">
                <td>{{ formatDate(expense.expense_date) }}</td>
                <td>
                  <span class="category-badge" :class="getCategoryClass(expense.category)">
                    {{ expense.category }}
                  </span>
                </td>
                <td>{{ expense.vendor || '-' }}</td>
                <td class="description-cell">{{ expense.description || '-' }}</td>
                <td class="amount-cell">${{ formatNumber(expense.amount) }}</td>
                <td>{{ expense.created_by_name || 'System' }}</td>
                <td class="actions-cell">
                  <button @click="editExpense(expense)" class="btn-icon" title="Edit" aria-label="Edit">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/></svg>
                  </button>
                  <button @click="deleteExpenseConfirm(expense)" class="btn-icon delete" title="Delete" aria-label="Delete">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredExpenses.length === 0">
                <td colspan="7" class="text-center text-gray-500">
                  No expenses found. Click "Add Expense" to get started.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Expense Modal -->
      <div v-if="showExpenseModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ editingExpense ? 'Edit Expense' : 'Add New Expense' }}</h2>
            <button @click="closeModal" class="btn-close">×</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveExpense">
              <div class="form-group">
                <label>Category *</label>
                <select v-model="expenseForm.category" required>
                  <option value="">Select category...</option>
                  <option value="Food/Ingredients">Food/Ingredients</option>
                  <option value="Labor">Labor</option>
                  <option value="Rent">Rent</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div class="form-group">
                <label>Vendor</label>
                <input type="text" v-model="expenseForm.vendor" placeholder="e.g., Sysco, US Foods, Amazon" />
              </div>

              <div class="form-group">
                <label>Amount *</label>
                <input type="number" v-model="expenseForm.amount" step="0.01" min="0" required placeholder="0.00" />
              </div>

              <div class="form-group">
                <label>Expense Date *</label>
                <input type="date" v-model="expenseForm.expense_date" required />
              </div>

              <div class="form-group">
                <label>Description</label>
                <textarea v-model="expenseForm.description" rows="3" placeholder="Additional details about this expense..."></textarea>
              </div>

              <div class="form-actions">
                <button type="button" @click="closeModal" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">
                  {{ editingExpense ? 'Update Expense' : 'Add Expense' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Recurring Expenses Modal -->
      <div v-if="showRecurringModal" class="modal-overlay" @click.self="closeRecurringModal">
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h2>Recurring Expenses</h2>
            <button @click="closeRecurringModal" class="btn-close">×</button>
          </div>
          <div class="modal-body">
            <!-- Add Recurring Expense Form -->
            <div class="card mb-4">
              <h3 class="mb-3">Add New Recurring Expense</h3>
              <form @submit.prevent="saveRecurringExpense">
                <div class="form-row">
                  <div class="form-group">
                    <label>Category *</label>
                    <select v-model="recurringForm.category" required>
                      <option value="">Select category...</option>
                      <option value="Rent">Rent</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Labor">Labor</option>
                      <option value="Supplies">Supplies</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label>Vendor</label>
                    <input type="text" v-model="recurringForm.vendor" placeholder="Vendor name" />
                  </div>

                  <div class="form-group">
                    <label>Amount *</label>
                    <input type="number" v-model="recurringForm.amount" step="0.01" min="0" required placeholder="0.00" />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Frequency *</label>
                    <select v-model="recurringForm.frequency" required>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div v-if="recurringForm.frequency === 'weekly'" class="form-group">
                    <label>Day of Week</label>
                    <select v-model="recurringForm.day_of_week">
                      <option :value="0">Sunday</option>
                      <option :value="1">Monday</option>
                      <option :value="2">Tuesday</option>
                      <option :value="3">Wednesday</option>
                      <option :value="4">Thursday</option>
                      <option :value="5">Friday</option>
                      <option :value="6">Saturday</option>
                    </select>
                  </div>

                  <div v-if="recurringForm.frequency === 'monthly'" class="form-group">
                    <label>Day of Month</label>
                    <input type="number" v-model="recurringForm.day_of_month" min="1" max="31" placeholder="1-31" />
                  </div>

                  <div class="form-group">
                    <label>Description</label>
                    <input type="text" v-model="recurringForm.description" placeholder="Description" />
                  </div>
                </div>

                <button type="submit" class="btn btn-primary">Add Recurring Expense</button>
              </form>
            </div>

            <!-- Recurring Expenses List -->
            <div class="card">
              <h3 class="mb-3">Active Recurring Expenses</h3>
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Vendor</th>
                      <th>Amount</th>
                      <th>Frequency</th>
                      <th>Next Due</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="recurring in recurringExpenses" :key="recurring.id">
                      <td>
                        <span class="category-badge" :class="getCategoryClass(recurring.category)">
                          {{ recurring.category }}
                        </span>
                      </td>
                      <td>{{ recurring.vendor || '-' }}</td>
                      <td class="amount-cell">${{ formatNumber(recurring.amount) }}</td>
                      <td>{{ recurring.frequency }}</td>
                      <td>{{ formatDate(recurring.next_due_date) }}</td>
                      <td class="actions-cell">
                        <button @click="deleteRecurringConfirm(recurring)" class="btn-icon delete" title="Delete" aria-label="Delete">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>
                        </button>
                      </td>
                    </tr>
                    <tr v-if="recurringExpenses.length === 0">
                      <td colspan="6" class="text-center text-gray-500">
                        No recurring expenses set up.
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import Sidebar from '../components/Sidebar.vue';
import { useAutoRefresh } from '../composables/useAutoRefresh';

const { ipcRenderer } = window.electron;

// State
const expenses = ref([]);
const filteredExpenses = ref([]);
const showExpenseModal = ref(false);
const editingExpense = ref(null);
const showRecurringModal = ref(false);
const recurringExpenses = ref([]);

// Form
const expenseForm = ref({
  category: '',
  vendor: '',
  amount: '',
  expense_date: new Date().toISOString().split('T')[0],
  description: ''
});

// Recurring Form
const recurringForm = ref({
  category: '',
  vendor: '',
  amount: '',
  frequency: 'monthly',
  day_of_month: 1,
  day_of_week: 1,
  description: ''
});

// Filters
const filters = ref({
  category: 'all',
  startDate: '',
  endDate: '',
  vendor: ''
});

// Computed totals
const monthlyTotal = computed(() => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  return expenses.value
    .filter(e => e.expense_date >= firstDay && e.expense_date <= lastDay)
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);
});

const weeklyTotal = computed(() => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const today = now.toISOString().split('T')[0];
  
  return expenses.value
    .filter(e => e.expense_date >= weekAgo && e.expense_date <= today)
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);
});

const dailyTotal = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  
  return expenses.value
    .filter(e => e.expense_date === today)
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);
});

// Methods
const loadExpenses = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    expenses.value = await ipcRenderer.invoke('expense:get-all', currentUser.businessId);
    filterExpenses();
  } catch (error) {
    console.error('Error loading expenses:', error);
    alert('Failed to load expenses');
  }
};

const filterExpenses = () => {
  let filtered = [...expenses.value];

  // Category filter
  if (filters.value.category !== 'all') {
    filtered = filtered.filter(e => e.category === filters.value.category);
  }

  // Date range filter
  if (filters.value.startDate) {
    filtered = filtered.filter(e => e.expense_date >= filters.value.startDate);
  }
  if (filters.value.endDate) {
    filtered = filtered.filter(e => e.expense_date <= filters.value.endDate);
  }

  // Vendor search
  if (filters.value.vendor) {
    const search = filters.value.vendor.toLowerCase();
    filtered = filtered.filter(e => 
      e.vendor && e.vendor.toLowerCase().includes(search)
    );
  }

  filteredExpenses.value = filtered;
};

const saveExpense = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    const expenseData = {
      category: expenseForm.value.category,
      vendor: expenseForm.value.vendor,
      amount: parseFloat(expenseForm.value.amount),
      expense_date: expenseForm.value.expense_date,
      description: expenseForm.value.description,
      created_by: currentUser.id
    };

    if (editingExpense.value) {
      await ipcRenderer.invoke('expense:update', {
        expenseId: editingExpense.value.id,
        expenseData
      });
    } else {
      await ipcRenderer.invoke('expense:create', {
        businessId: currentUser.businessId,
        expenseData
      });
    }

    await loadExpenses();
    closeModal();
  } catch (error) {
    console.error('Error saving expense:', error);
    alert('Failed to save expense');
  }
};

const editExpense = (expense) => {
  editingExpense.value = expense;
  expenseForm.value = {
    category: expense.category,
    vendor: expense.vendor || '',
    amount: expense.amount,
    expense_date: expense.expense_date,
    description: expense.description || ''
  };
  showExpenseModal.value = true;
};

const deleteExpenseConfirm = async (expense) => {
  if (!confirm(`Delete expense: ${expense.category} - $${expense.amount}?`)) {
    return;
  }

  try {
    await ipcRenderer.invoke('expense:delete', expense.id);
    await loadExpenses();
  } catch (error) {
    console.error('Error deleting expense:', error);
    alert('Failed to delete expense');
  }
};

const closeModal = () => {
  showExpenseModal.value = false;
  editingExpense.value = null;
  expenseForm.value = {
    category: '',
    vendor: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: ''
  };
};

const formatNumber = (num) => {
  return parseFloat(num || 0).toFixed(2);
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getCategoryClass = (category) => {
  const classes = {
    'Food/Ingredients': 'category-food',
    'Labor': 'category-labor',
    'Rent': 'category-rent',
    'Utilities': 'category-utilities',
    'Supplies': 'category-supplies',
    'Marketing': 'category-marketing',
    'Maintenance': 'category-maintenance',
    'Other': 'category-other'
  };
  return classes[category] || 'category-other';
};

// ==================== RECURRING EXPENSES ====================

const loadRecurringExpenses = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    recurringExpenses.value = await ipcRenderer.invoke('expense:get-recurring', currentUser.businessId);
  } catch (error) {
    console.error('Error loading recurring expenses:', error);
  }
};

const saveRecurringExpense = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    await ipcRenderer.invoke('expense:create-recurring', {
      businessId: currentUser.businessId,
      recurringData: {
        category: recurringForm.value.category,
        vendor: recurringForm.value.vendor,
        amount: parseFloat(recurringForm.value.amount),
        description: recurringForm.value.description,
        frequency: recurringForm.value.frequency,
        day_of_month: recurringForm.value.frequency === 'monthly' ? parseInt(recurringForm.value.day_of_month) : null,
        day_of_week: recurringForm.value.frequency === 'weekly' ? parseInt(recurringForm.value.day_of_week) : null
      }
    });

    await loadRecurringExpenses();
    
    // Reset form
    recurringForm.value = {
      category: '',
      vendor: '',
      amount: '',
      frequency: 'monthly',
      day_of_month: 1,
      day_of_week: 1,
      description: ''
    };
  } catch (error) {
    console.error('Error saving recurring expense:', error);
    alert('Failed to save recurring expense');
  }
};

const deleteRecurringConfirm = async (recurring) => {
  if (!confirm(`Delete recurring expense: ${recurring.category} - $${recurring.amount}?`)) {
    return;
  }

  try {
    await ipcRenderer.invoke('expense:delete-recurring', recurring.id);
    await loadRecurringExpenses();
  } catch (error) {
    console.error('Error deleting recurring expense:', error);
    alert('Failed to delete recurring expense');
  }
};

const processRecurringExpenses = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const created = await ipcRenderer.invoke('expense:process-recurring', currentUser.businessId);
    
    if (created.length > 0) {
      alert(`Created ${created.length} expense(s) from recurring templates`);
      await loadExpenses();
      await loadRecurringExpenses();
    } else {
      alert('No recurring expenses are due at this time');
    }
  } catch (error) {
    console.error('Error processing recurring expenses:', error);
    alert('Failed to process recurring expenses');
  }
};

const closeRecurringModal = () => {
  showRecurringModal.value = false;
  recurringForm.value = {
    category: '',
    vendor: '',
    amount: '',
    frequency: 'monthly',
    day_of_month: 1,
    day_of_week: 1,
    description: ''
  };
};

// Auto-refresh expenses every 20 seconds
const refreshExpenses = async () => {
  await Promise.all([
    loadExpenses(),
    loadRecurringExpenses()
  ]);
};

const { isRefreshing, manualRefresh } = useAutoRefresh(refreshExpenses, 20000);

onMounted(() => {
  // Initial load handled by useAutoRefresh
});
</script>

<style scoped>
.expenses-view {
  display: flex;
  min-height: 100vh;
  background: #0a0a0a;
}

.main-content {
  flex: 1;
  min-width: 0;
  padding: 2rem;
  height: 100vh;
  overflow-y: auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  color: #f5f5f5;
  font-size: 2rem;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: #171717;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #262626;
}

.metric-label {
  color: #a3a3a3;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.metric-value {
  color: #f5f5f5;
  font-size: 1.75rem;
  font-weight: 700;
}

/* Filters */
.filters-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  background: #171717;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #262626;
}

.filter-group label {
  display: block;
  color: #a3a3a3;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.filter-group select,
.filter-group input {
  width: 100%;
  background: #0a0a0a;
  border: 1px solid #262626;
  border-radius: 8px;
  padding: 0.5rem;
  color: #f5f5f5;
  font-size: 0.875rem;
}

/* Card & Table */
.card {
  background: #171717;
  border-radius: 12px;
  border: 1px solid #262626;
  overflow: hidden;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #0a0a0a;
}

th {
  padding: 1rem;
  text-align: left;
  color: #a3a3a3;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  border-bottom: 1px solid #262626;
}

td {
  padding: 1rem;
  color: #e5e5e5;
  border-bottom: 1px solid #262626;
}

tbody tr:hover {
  background: rgba(56, 189, 248, 0.05);
}

.description-cell {
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.amount-cell {
  font-weight: 600;
  color: #fbbf24;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

/* Category Badges */
.category-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.category-food { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
.category-labor { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
.category-rent { background: rgba(139, 92, 246, 0.2); color: #c4b5fd; }
.category-utilities { background: rgba(249, 115, 22, 0.2); color: #fdba74; }
.category-supplies { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; }
.category-marketing { background: rgba(236, 72, 153, 0.2); color: #f9a8d4; }
.category-maintenance { background: rgba(251, 191, 36, 0.2); color: #fde68a; }
.category-other { background: rgba(115, 115, 115, 0.2); color: #d4d4d4; }

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #171717;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  border: 1px solid #262626;
}

.modal-large {
  max-width: 900px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #262626;
}

.modal-header h2 {
  color: #f5f5f5;
  font-size: 1.25rem;
  font-weight: 700;
}

.btn-close {
  background: none;
  border: none;
  color: #a3a3a3;
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
}

.btn-close:hover {
  color: #f5f5f5;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  color: #a3a3a3;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  background: #0a0a0a;
  border: 1px solid #262626;
  border-radius: 8px;
  padding: 0.75rem;
  color: #f5f5f5;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.mb-3 {
  margin-bottom: 1rem;
}

.mb-4 {
  margin-bottom: 1.5rem;
}

/* Buttons */
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #f97316;
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
}

.btn-secondary {
  background: #262626;
  color: #f5f5f5;
}

.btn-secondary:hover {
  background: #475569;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.25rem;
}

.btn-icon:hover {
  opacity: 0.7;
}

.btn-icon.delete:hover {
  filter: brightness(1.2);
}

.icon {
  font-size: 1.25rem;
}

.text-center {
  text-align: center;
}

.text-gray-500 {
  color: #64748b;
}
</style>
