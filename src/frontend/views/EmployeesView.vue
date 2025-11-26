<template>
  <div class="employees-page">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <div class="logo-section">
        <h2 class="logo">FoodBiz</h2>
      </div>
      
      <nav class="nav-menu">
        <router-link to="/dashboard" class="nav-item">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Dashboard</span>
        </router-link>

        <router-link to="/employees" class="nav-item active">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>Employees</span>
        </router-link>

        <router-link to="/inventory" class="nav-item">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span>Inventory</span>
        </router-link>

        <router-link to="/menu" class="nav-item">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>Menu</span>
        </router-link>

        <router-link to="/pos" class="nav-item">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>POS</span>
        </router-link>

        <router-link to="/reports" class="nav-item">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Reports</span>
        </router-link>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <header class="page-header">
        <div>
          <h1 class="page-title">Employee Management</h1>
          <p class="page-subtitle">Manage your team and track employee information</p>
        </div>
        <div class="header-actions">
          <button @click="$router.push('/schedule')" class="btn-secondary">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Manage Schedules
          </button>
          <button @click="openEmployeeModal()" class="btn-primary">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Employee
          </button>
        </div>
      </header>

      <!-- Search and Filter -->
      <div class="filter-bar">
        <div class="search-box">
          <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search employees..."
            class="search-input"
          />
        </div>
        
        <div class="filter-chips">
          <button 
            @click="selectedStatus = null" 
            :class="['filter-chip', { active: selectedStatus === null }]"
          >
            All
          </button>
          <button 
            @click="selectedStatus = 'active'" 
            :class="['filter-chip', { active: selectedStatus === 'active' }]"
          >
            Active
          </button>
          <button 
            @click="selectedStatus = 'inactive'" 
            :class="['filter-chip', { active: selectedStatus === 'inactive' }]"
          >
            Inactive
          </button>
        </div>
      </div>

      <!-- Employees Table -->
      <div v-if="loading" class="loading">Loading employees...</div>
      <div v-else-if="filteredEmployees.length === 0" class="empty-state">
        <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <p>No employees found</p>
        <button @click="openEmployeeModal()" class="btn-secondary">Add Your First Employee</button>
      </div>
      <div v-else class="employees-table-container">
        <table class="employees-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Contact</th>
              <th>Hourly Rate</th>
              <th>Hire Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="employee in filteredEmployees" :key="employee.id">
              <td class="employee-name">
                <div class="employee-avatar">{{ getInitials(employee.first_name, employee.last_name) }}</div>
                <span>{{ employee.first_name }} {{ employee.last_name }}</span>
              </td>
              <td>
                <span class="role-badge">{{ employee.role }}</span>
              </td>
              <td class="contact-info">
                <div v-if="employee.email">{{ employee.email }}</div>
                <div v-if="employee.phone" class="contact-secondary">{{ employee.phone }}</div>
              </td>
              <td class="hourly-rate">
                <span v-if="employee.hourly_rate">${{ parseFloat(employee.hourly_rate).toFixed(2) }}/hr</span>
                <span v-else class="text-muted">—</span>
              </td>
              <td>{{ formatDate(employee.hire_date) }}</td>
              <td>
                <span :class="['status-badge', employee.status]">
                  {{ employee.status }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button @click="viewDetails(employee)" class="action-icon-btn" title="View Details">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button @click="editEmployee(employee)" class="action-icon-btn" title="Edit">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button @click="confirmDelete(employee)" class="action-icon-btn delete" title="Delete">
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
    </main>

    <!-- Add/Edit Employee Modal -->
    <div v-if="showEmployeeModal" class="modal-overlay" @click.self="closeEmployeeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingEmployee ? 'Edit Employee' : 'Add New Employee' }}</h2>
          <button @click="closeEmployeeModal" class="modal-close">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form @submit.prevent="saveEmployee" class="modal-content">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName" class="form-label">First Name *</label>
              <input 
                id="firstName"
                v-model="employeeForm.firstName" 
                type="text" 
                class="form-input" 
                required
                placeholder="John"
              />
            </div>
            <div class="form-group">
              <label for="lastName" class="form-label">Last Name *</label>
              <input 
                id="lastName"
                v-model="employeeForm.lastName" 
                type="text" 
                class="form-input" 
                required
                placeholder="Doe"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="email" class="form-label">Email</label>
              <input 
                id="email"
                v-model="employeeForm.email" 
                type="email" 
                class="form-input"
                placeholder="john.doe@example.com"
              />
            </div>
            <div class="form-group">
              <label for="phone" class="form-label">Phone</label>
              <input 
                id="phone"
                v-model="employeeForm.phone" 
                type="tel" 
                class="form-input"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="role" class="form-label">Role *</label>
              <select 
                id="role"
                v-model="employeeForm.role" 
                class="form-input"
                required
              >
                <option value="staff">Staff</option>
                <option value="chef">Chef</option>
                <option value="manager">Manager</option>
                <option value="server">Server</option>
                <option value="cashier">Cashier</option>
                <option value="driver">Delivery Driver</option>
              </select>
            </div>
            <div class="form-group">
              <label for="hourlyRate" class="form-label">Hourly Rate ($)</label>
              <input 
                id="hourlyRate"
                v-model="employeeForm.hourlyRate" 
                type="number" 
                step="0.01"
                class="form-input"
                placeholder="15.00"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="hireDate" class="form-label">Hire Date *</label>
              <input 
                id="hireDate"
                v-model="employeeForm.hireDate" 
                type="date" 
                class="form-input"
                required
              />
            </div>
            <div class="form-group">
              <label for="status" class="form-label">Status *</label>
              <select 
                id="status"
                v-model="employeeForm.status" 
                class="form-input"
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <!-- Account Creation Section -->
          <div v-if="!editingEmployee" class="account-section">
            <div class="section-header">
              <h3>System Access (Optional)</h3>
              <label class="toggle-switch">
                <input type="checkbox" v-model="employeeForm.createAccount" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <p class="section-description">Create a login account for this employee to access the system</p>
            
            <div v-if="employeeForm.createAccount" class="account-fields">
              <div class="form-row">
                <div class="form-group">
                  <label for="username" class="form-label">Username *</label>
                  <input 
                    id="username"
                    v-model="employeeForm.username" 
                    type="text" 
                    class="form-input"
                    :required="employeeForm.createAccount"
                    placeholder="john.doe"
                  />
                </div>
                <div class="form-group">
                  <label for="password" class="form-label">Password *</label>
                  <input 
                    id="password"
                    v-model="employeeForm.password" 
                    type="password" 
                    class="form-input"
                    :required="employeeForm.createAccount"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <p class="field-hint">Employee will use these credentials to log into the system</p>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeEmployeeModal" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">
              {{ editingEmployee ? 'Update' : 'Create' }} Employee
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Schedule Manager Modal -->
    <div v-if="showScheduleManager" class="modal-overlay" @click.self="showScheduleManager = false">
      <div class="modal modal-wide">
        <div class="modal-header">
          <h2>Weekly Schedule Manager</h2>
          <button @click="showScheduleManager = false" class="modal-close">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="modal-content">
          <p class="section-description">Select an employee to manage their weekly schedule</p>
          
          <div class="employee-list">
            <div 
              v-for="emp in employees" 
              :key="emp.id"
              @click="openEmployeeSchedule(emp)"
              class="employee-list-item"
            >
              <div class="employee-avatar-small">{{ getInitials(emp.first_name, emp.last_name) }}</div>
              <div class="employee-list-info">
                <div class="employee-list-name">{{ emp.first_name }} {{ emp.last_name }}</div>
                <div class="employee-list-role">{{ emp.role }}</div>
              </div>
              <svg class="chevron-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const employees = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedStatus = ref(null);
const showEmployeeModal = ref(false);
const showScheduleManager = ref(false);
const editingEmployee = ref(null);

const employeeForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'staff',
  hourlyRate: null,
  hireDate: new Date().toISOString().split('T')[0],
  status: 'active',
  createAccount: false,
  username: '',
  password: ''
});

// Load employees
const loadEmployees = async () => {
  loading.value = true;
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    const { ipcRenderer } = window.require('electron');
    const result = await ipcRenderer.invoke('employee:get-all', currentUser.businessId);
    employees.value = result;
  } catch (error) {
    console.error('Error loading employees:', error);
  } finally {
    loading.value = false;
  }
};

// Filtered employees
const filteredEmployees = computed(() => {
  let filtered = employees.value;

  // Filter by status
  if (selectedStatus.value) {
    filtered = filtered.filter(emp => emp.status === selectedStatus.value);
  }

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(emp => 
      emp.first_name.toLowerCase().includes(query) ||
      emp.last_name.toLowerCase().includes(query) ||
      emp.email?.toLowerCase().includes(query) ||
      emp.role.toLowerCase().includes(query)
    );
  }

  return filtered;
});

// Get initials for avatar
const getInitials = (firstName, lastName) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Open employee modal
const openEmployeeModal = (employee = null) => {
  if (employee) {
    editingEmployee.value = employee;
    employeeForm.value = {
      firstName: employee.first_name,
      lastName: employee.last_name,
      email: employee.email || '',
      phone: employee.phone || '',
      role: employee.role,
      hourlyRate: employee.hourly_rate || null,
      hireDate: employee.hire_date,
      status: employee.status,
      createAccount: false,
      username: '',
      password: ''
    };
  } else {
    editingEmployee.value = null;
    employeeForm.value = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'staff',
      hourlyRate: null,
      hireDate: new Date().toISOString().split('T')[0],
      status: 'active',
      createAccount: false,
      username: '',
      password: ''
    };
  }
  showEmployeeModal.value = true;
};

// Close employee modal
const closeEmployeeModal = () => {
  showEmployeeModal.value = false;
  editingEmployee.value = null;
};

// Edit employee
const editEmployee = (employee) => {
  openEmployeeModal(employee);
};

// View employee details
const viewDetails = (employee) => {
  router.push(`/employees/${employee.id}`);
};

// Save employee
const saveEmployee = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    const { ipcRenderer } = window.require('electron');
    const employeeData = {
      firstName: employeeForm.value.firstName,
      lastName: employeeForm.value.lastName,
      email: employeeForm.value.email || null,
      phone: employeeForm.value.phone || null,
      role: employeeForm.value.role,
      hourlyRate: employeeForm.value.hourlyRate || null,
      hireDate: employeeForm.value.hireDate,
      status: employeeForm.value.status,
      createAccount: employeeForm.value.createAccount,
      username: employeeForm.value.username || null,
      password: employeeForm.value.password || null
    };

    if (editingEmployee.value) {
      await ipcRenderer.invoke('employee:update', {
        businessId: currentUser.businessId,
        employeeId: editingEmployee.value.id,
        employeeData
      });
    } else {
      await ipcRenderer.invoke('employee:create', {
        businessId: currentUser.businessId,
        employeeData
      });
    }

    closeEmployeeModal();
    loadEmployees();
  } catch (error) {
    console.error('Error saving employee:', error);
    alert('Failed to save employee. Please try again.');
  }
};

// Delete employee
const confirmDelete = async (employee) => {
  if (confirm(`Are you sure you want to delete ${employee.first_name} ${employee.last_name}?`)) {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      const { ipcRenderer } = window.require('electron');
      await ipcRenderer.invoke('employee:delete', {
        businessId: currentUser.businessId,
        employeeId: employee.id
      });
      loadEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee. Please try again.');
    }
  }
};

// Open employee schedule
const openEmployeeSchedule = (employee) => {
  showScheduleManager.value = false;
  router.push(`/employees/${employee.id}`);
};

onMounted(() => {
  loadEmployees();
});
</script>

<style scoped>
.employees-page {
  display: flex;
  height: 100vh;
  background: #0f1419;
  color: #d1d5db;
}

/* Sidebar Styles */
.sidebar {
  width: 250px;
  background: linear-gradient(180deg, #1a1f2e 0%, #0f1419 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0;
}

.logo-section {
  padding: 0 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  font-size: 1.75rem;
  font-weight: 800;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-menu {
  flex: 1;
  padding: 1.5rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  color: #9ca3af;
  text-decoration: none;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #f3f4f6;
}

.nav-item.active {
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
  border-left-color: #3b82f6;
}

.nav-icon {
  width: 20px;
  height: 20px;
}

/* Main Content */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #f3f4f6;
  margin-bottom: 0.25rem;
}

.page-subtitle {
  color: #9ca3af;
  font-size: 0.875rem;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
}

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #d1d5db;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f3f4f6;
  transform: translateY(-2px);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

/* Filter Bar */
.filter-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 300px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #6b7280;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  background: #1f2937;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #f3f4f6;
  font-size: 0.875rem;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.filter-chips {
  display: flex;
  gap: 0.5rem;
}

.filter-chip {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.filter-chip:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f3f4f6;
}

.filter-chip.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  color: #60a5fa;
}

/* Employees Table */
.employees-table-container {
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  overflow: hidden;
}

.employees-table {
  width: 100%;
  border-collapse: collapse;
}

.employees-table thead {
  background: rgba(0, 0, 0, 0.3);
}

.employees-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #9ca3af;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.employees-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #d1d5db;
}

.employees-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.employee-name {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  color: #f3f4f6;
}

.employee-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.contact-info {
  font-size: 0.875rem;
}

.contact-secondary {
  color: #6b7280;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.hourly-rate {
  font-weight: 600;
  color: #10b981;
}

.text-muted {
  color: #6b7280;
}

.status-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-badge.active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-badge.inactive {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
}

.action-icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #60a5fa;
}

.action-icon-btn.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.action-icon-btn svg {
  width: 18px;
  height: 18px;
}

/* Empty State */
.loading, .empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  opacity: 0.5;
}

.btn-secondary {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #d1d5db;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f3f4f6;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: #1a1f2e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  max-width: 600px;
  width: 100%;
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
  font-size: 1.5rem;
  font-weight: 700;
  color: #f3f4f6;
}

.modal-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.2s;
  padding: 0.5rem;
}

.modal-close:hover {
  color: #f3f4f6;
}

.modal-close svg {
  width: 24px;
  height: 24px;
}

.modal-content {
  padding: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #d1d5db;
  margin-bottom: 0.5rem;
}

.form-input {
  padding: 0.75rem;
  background: #1f2937;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #f3f4f6;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.account-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.section-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #f3f4f6;
}

.section-description {
  font-size: 0.875rem;
  color: #9ca3af;
  margin-bottom: 1rem;
}

.account-fields {
  margin-top: 1rem;
}

.field-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.5rem;
  font-style: italic;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.1);
  transition: 0.3s;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: #6b7280;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: rgba(59, 130, 246, 0.3);
  border-color: #3b82f6;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(20px);
  background-color: #3b82f6;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-wide {
  max-width: 700px;
}

.employee-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
  max-height: 500px;
  overflow-y: auto;
}

.employee-list-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.employee-list-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: #3b82f6;
  transform: translateX(4px);
}

.employee-avatar-small {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.employee-list-info {
  flex: 1;
}

.employee-list-name {
  font-weight: 600;
  color: #f3f4f6;
  margin-bottom: 0.25rem;
}

.employee-list-role {
  font-size: 0.875rem;
  color: #9ca3af;
  text-transform: capitalize;
}

.chevron-icon {
  width: 20px;
  height: 20px;
  color: #6b7280;
  flex-shrink: 0;
}

.section-description {
  color: #9ca3af;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}
</style>
