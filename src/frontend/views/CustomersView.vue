<template>
  <div class="customers-page">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content -->
    <div class="main-content">
      <div class="content-header">
        <h1>Customer Management</h1>
        <button @click="showAddModal = true" class="btn-primary">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Customer
        </button>
      </div>

      <!-- Search and Stats -->
      <div class="customers-toolbar">
        <div class="search-box">
          <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input v-model="searchQuery" type="text" placeholder="Search customers..." class="search-input" />
        </div>

        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-value">{{ customers.length }}</div>
            <div class="stat-label">Total Customers</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ activeCustomers }}</div>
            <div class="stat-label">Active (30 days)</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${{ totalLoyaltyValue.toFixed(2) }}</div>
            <div class="stat-label">Loyalty Points Value</div>
          </div>
        </div>
      </div>

      <!-- Customers Table -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Loyalty Points</th>
              <th>Total Spent</th>
              <th>Visits</th>
              <th>Member Since</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredCustomers.length === 0">
              <td colspan="7" class="no-data">No customers found</td>
            </tr>
            <tr v-for="customer in filteredCustomers" :key="customer.id">
              <td>
                <div class="customer-name">{{ customer.name }}</div>
              </td>
              <td>
                <div class="customer-contact">
                  <div v-if="customer.phone">📞 {{ customer.phone }}</div>
                  <div v-if="customer.email">✉️ {{ customer.email }}</div>
                </div>
              </td>
              <td>
                <div class="loyalty-points">
                  <span class="points-badge">{{ customer.loyalty_points }} pts</span>
                  <span class="points-value">${{ (customer.loyalty_points / 100).toFixed(2) }}</span>
                </div>
              </td>
              <td class="amount">${{ parseFloat(customer.total_spent || 0).toFixed(2) }}</td>
              <td class="visits">{{ customer.visit_count || 0 }}</td>
              <td class="date">{{ formatDate(customer.created_at) }}</td>
              <td>
                <div class="action-buttons">
                  <button @click="editCustomer(customer)" class="btn-icon" title="Edit">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button @click="adjustPoints(customer)" class="btn-icon" title="Adjust Points">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button @click="deleteCustomer(customer)" class="btn-icon btn-danger" title="Delete">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Customer Modal -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ showEditModal ? 'Edit Customer' : 'Add New Customer' }}</h2>
          <button @click="closeModal" class="modal-close">×</button>
        </div>
        <div class="modal-content">
          <div class="form-group">
            <label>Name *</label>
            <input v-model="formData.name" type="text" class="form-input" placeholder="Customer name" />
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input v-model="formData.phone" type="tel" class="form-input" placeholder="(555) 123-4567" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="formData.email" type="email" class="form-input" placeholder="customer@example.com" />
          </div>
          <div v-if="showEditModal" class="form-group">
            <label>Loyalty Points</label>
            <input v-model.number="formData.loyalty_points" type="number" class="form-input" readonly />
            <small>Use "Adjust Points" button to modify points</small>
          </div>
          <div class="modal-actions">
            <button @click="closeModal" class="btn-secondary">Cancel</button>
            <button @click="saveCustomer" class="btn-primary" :disabled="!formData.name">
              {{ showEditModal ? 'Update' : 'Add' }} Customer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Adjust Points Modal -->
    <div v-if="showPointsModal" class="modal-overlay" @click.self="showPointsModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Adjust Loyalty Points</h2>
          <button @click="showPointsModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-content">
          <div class="customer-info">
            <h3>{{ selectedCustomer?.name }}</h3>
            <p>Current Points: <strong>{{ selectedCustomer?.loyalty_points }} pts</strong> (${{ (selectedCustomer?.loyalty_points / 100).toFixed(2) }})</p>
          </div>
          <div class="form-group">
            <label>Adjustment Type</label>
            <div class="radio-group">
              <label>
                <input v-model="pointsAdjustment.type" type="radio" value="add" />
                Add Points
              </label>
              <label>
                <input v-model="pointsAdjustment.type" type="radio" value="subtract" />
                Subtract Points
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>Points Amount</label>
            <input v-model.number="pointsAdjustment.amount" type="number" class="form-input" placeholder="100" />
          </div>
          <div class="form-group">
            <label>Reason</label>
            <textarea v-model="pointsAdjustment.reason" class="form-textarea" rows="3" placeholder="e.g., Promotion bonus, Correction, etc."></textarea>
          </div>
          <div class="points-preview">
            New Balance: {{ calculateNewPoints() }} pts (${{ (calculateNewPoints() / 100).toFixed(2) }})
          </div>
          <div class="modal-actions">
            <button @click="showPointsModal = false" class="btn-secondary">Cancel</button>
            <button @click="savePointsAdjustment" class="btn-primary" :disabled="!pointsAdjustment.amount">
              Apply Adjustment
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Sidebar from '../components/Sidebar.vue';

const { ipcRenderer } = window.require('electron');

// State
const customers = ref([]);
const searchQuery = ref('');
const showAddModal = ref(false);
const showEditModal = ref(false);
const showPointsModal = ref(false);
const selectedCustomer = ref(null);

const formData = ref({
  name: '',
  phone: '',
  email: '',
  loyalty_points: 0
});

const pointsAdjustment = ref({
  type: 'add',
  amount: 0,
  reason: ''
});

// Computed
const filteredCustomers = computed(() => {
  if (!searchQuery.value) return customers.value;
  const query = searchQuery.value.toLowerCase();
  return customers.value.filter(c => 
    c.name.toLowerCase().includes(query) ||
    c.phone?.toLowerCase().includes(query) ||
    c.email?.toLowerCase().includes(query)
  );
});

const activeCustomers = computed(() => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return customers.value.filter(c => new Date(c.updated_at) > thirtyDaysAgo).length;
});

const totalLoyaltyValue = computed(() => {
  return customers.value.reduce((sum, c) => sum + (c.loyalty_points / 100), 0);
});

// Methods
const loadCustomers = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const result = await ipcRenderer.invoke('pos:search-customers', {
      businessId: currentUser.businessId,
      searchTerm: ''
    });
    customers.value = result || [];
  } catch (error) {
    console.error('Error loading customers:', error);
  }
};

const editCustomer = (customer) => {
  selectedCustomer.value = customer;
  formData.value = { ...customer };
  showEditModal.value = true;
};

const adjustPoints = (customer) => {
  selectedCustomer.value = customer;
  pointsAdjustment.value = {
    type: 'add',
    amount: 0,
    reason: ''
  };
  showPointsModal.value = true;
};

const calculateNewPoints = () => {
  if (!selectedCustomer.value) return 0;
  const current = selectedCustomer.value.loyalty_points;
  const amount = pointsAdjustment.value.amount || 0;
  if (pointsAdjustment.value.type === 'add') {
    return current + amount;
  } else {
    return Math.max(0, current - amount);
  }
};

const saveCustomer = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (showEditModal.value) {
      // Update customer (we'll need to add this IPC handler)
      await ipcRenderer.invoke('pos:update-customer', {
        businessId: currentUser.businessId,
        customerId: selectedCustomer.value.id,
        customerData: {
          name: formData.value.name,
          phone: formData.value.phone,
          email: formData.value.email
        }
      });
    } else {
      // Create customer
      await ipcRenderer.invoke('pos:create-customer', {
        businessId: currentUser.businessId,
        customerData: {
          name: formData.value.name,
          phone: formData.value.phone,
          email: formData.value.email
        }
      });
    }
    
    await loadCustomers();
    closeModal();
  } catch (error) {
    console.error('Error saving customer:', error);
    alert('Error saving customer');
  }
};

const savePointsAdjustment = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const pointsChange = pointsAdjustment.value.type === 'add' 
      ? pointsAdjustment.value.amount 
      : -pointsAdjustment.value.amount;
    
    await ipcRenderer.invoke('pos:update-customer-points', {
      businessId: currentUser.businessId,
      customerId: selectedCustomer.value.id,
      pointsChange,
      totalSpent: 0 // No sale, just adjustment
    });
    
    await loadCustomers();
    showPointsModal.value = false;
  } catch (error) {
    console.error('Error adjusting points:', error);
    alert('Error adjusting points');
  }
};

const deleteCustomer = async (customer) => {
  if (!confirm(`Delete customer "${customer.name}"? This cannot be undone.`)) return;
  
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    await ipcRenderer.invoke('pos:delete-customer', {
      businessId: currentUser.businessId,
      customerId: customer.id
    });
    
    await loadCustomers();
  } catch (error) {
    console.error('Error deleting customer:', error);
    alert('Error deleting customer');
  }
};

const closeModal = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  selectedCustomer.value = null;
  formData.value = {
    name: '',
    phone: '',
    email: '',
    loyalty_points: 0
  };
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

onMounted(() => {
  loadCustomers();
});
</script>

<style scoped>
.customers-page {
  display: flex;
  height: 100vh;
  background: #0f1419;
  color: #d1d5db;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.content-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border: none;
  color: white;
  font-weight: 600;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
}

.btn-primary svg {
  width: 1.25rem;
  height: 1.25rem;
}

.customers-toolbar {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 300px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: #6b7280;
}

.search-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: rgba(255, 255, 255, 0.08);
}

.stats-cards {
  display: flex;
  gap: 1rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 1rem 1.5rem;
  text-align: center;
  min-width: 140px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-container {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: rgba(255, 255, 255, 0.05);
}

.data-table th {
  padding: 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.data-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.customer-name {
  font-weight: 600;
  color: #d1d5db;
}

.customer-contact {
  font-size: 0.875rem;
  color: #9ca3af;
}

.customer-contact div {
  margin-bottom: 0.25rem;
}

.loyalty-points {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.points-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  width: fit-content;
}

.points-value {
  font-size: 0.75rem;
  color: #6b7280;
}

.amount {
  font-weight: 600;
  color: #10b981;
}

.visits {
  font-weight: 600;
  color: #8b5cf6;
}

.date {
  color: #6b7280;
  font-size: 0.875rem;
}

.no-data {
  text-align: center;
  padding: 3rem !important;
  color: #6b7280;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  padding: 0.5rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #60a5fa;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: rgba(59, 130, 246, 0.2);
}

.btn-icon svg {
  width: 1rem;
  height: 1rem;
  display: block;
}

.btn-icon.btn-danger {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.btn-icon.btn-danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #1a1f2e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #d1d5db;
}

.modal-close {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #d1d5db;
}

.modal-content {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #9ca3af;
  font-weight: 500;
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #d1d5db;
  border-radius: 0.375rem;
  font-family: inherit;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  background: rgba(255, 255, 255, 0.08);
}

.form-textarea {
  resize: vertical;
}

.radio-group {
  display: flex;
  gap: 1.5rem;
}

.radio-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: #d1d5db;
}

.customer-info {
  background: rgba(59, 130, 246, 0.1);
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.customer-info h3 {
  margin: 0 0 0.5rem 0;
  color: #60a5fa;
}

.customer-info p {
  margin: 0;
  color: #d1d5db;
}

.points-preview {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
  font-weight: 600;
  font-size: 1.125rem;
  margin-top: 1.5rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
