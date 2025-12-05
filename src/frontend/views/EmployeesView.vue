<template>
  <div class="employees-page">
    <!-- Sidebar Navigation -->
    <Sidebar />

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
          <button @click="openAnnouncementModal" class="btn-secondary" style="background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.3); color: #818cf8;">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            Post Announcement
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

      <!-- Posted Announcements Section -->
      <section class="announcements-section">
        <div class="section-header">
          <h2 class="section-title">Posted Announcements</h2>
          <button @click="loadAnnouncements" class="btn-icon" title="Refresh">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 20px; height: 20px;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        
        <div v-if="loadingAnnouncements" class="loading">Loading announcements...</div>
        <div v-else-if="postedAnnouncements.length === 0" class="empty-state-sm">
          <svg class="empty-icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          <p>No announcements posted yet</p>
        </div>
        <div v-else class="announcements-grid">
          <div v-for="announcement in postedAnnouncements" :key="announcement.id" class="announcement-card" :class="'priority-' + announcement.priority">
            <div class="announcement-header">
              <div class="announcement-meta">
                <span class="priority-badge" :class="announcement.priority">{{ announcement.priority }}</span>
                <span class="date-text">{{ formatAnnouncementDate(announcement.created_at) }}</span>
              </div>
              <div class="announcement-actions">
                <button @click="toggleAnnouncementStatus(announcement)" class="btn-icon" :title="announcement.is_active ? 'Deactivate' : 'Activate'">
                  <svg v-if="announcement.is_active" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 18px; height: 18px;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 18px; height: 18px;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
                <button @click="deleteAnnouncement(announcement)" class="btn-icon btn-danger" title="Delete">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 18px; height: 18px;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <h3 class="announcement-title">{{ announcement.title }}</h3>
            <p class="announcement-message">{{ announcement.message }}</p>
            <div class="announcement-footer">
              <div class="target-roles">
                <span class="label">For:</span>
                <span v-for="role in parseTargetRoles(announcement.target_roles)" :key="role" class="role-tag">{{ role }}</span>
              </div>
              <span v-if="!announcement.is_active" class="inactive-badge">Inactive</span>
              <span v-else-if="isExpired(announcement.expires_at)" class="expired-badge">Expired</span>
            </div>
          </div>
        </div>
      </section>
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

          <!-- Account Credentials Section -->
          <div class="account-section">
            <div class="section-header">
              <h3>{{ editingEmployee && employeeForm.hasAccount ? 'Account Credentials' : 'System Access (Optional)' }}</h3>
              <!-- Only show toggle if creating new employee or editing employee without account -->
              <label v-if="(!editingEmployee || !employeeForm.hasAccount)" class="toggle-switch">
                <input type="checkbox" v-model="employeeForm.createAccount" />
                <span class="toggle-slider"></span>
              </label>
              <span v-else class="account-status-badge">Active Account</span>
            </div>
            <p v-if="!editingEmployee" class="section-description">Create a login account for this employee to access the system</p>
            <p v-else-if="!employeeForm.hasAccount" class="section-description">Enable system access for this employee</p>
            <p v-else class="section-description">View and manage account credentials and permissions</p>
            
            <div v-if="employeeForm.createAccount || (editingEmployee && employeeForm.hasAccount)" class="account-fields">
              <div class="form-row">
                <div class="form-group">
                  <label for="username" class="form-label">Username *</label>
                  <input 
                    id="username"
                    v-model="employeeForm.username" 
                    type="text" 
                    class="form-input"
                    :required="employeeForm.createAccount && !editingEmployee"
                    :readonly="editingEmployee && employeeForm.hasAccount"
                    :class="{ 'readonly-input': editingEmployee && employeeForm.hasAccount }"
                    placeholder="john.doe"
                  />
                  <p v-if="editingEmployee && employeeForm.hasAccount" class="field-hint">Username cannot be changed</p>
                </div>
                <div class="form-group">
                  <label for="password" class="form-label">{{ editingEmployee && employeeForm.hasAccount ? 'New Password (leave blank to keep current)' : 'Password *' }}</label>
                  <input 
                    id="password"
                    v-model="employeeForm.password" 
                    type="password" 
                    class="form-input"
                    :required="employeeForm.createAccount && !editingEmployee"
                    :placeholder="editingEmployee && employeeForm.hasAccount ? 'Enter new password to change' : '••••••••'"
                  />
                </div>
              </div>

              <!-- Permissions Section -->
              <div class="permissions-section">
                <h4>System Permissions</h4>
                <p class="field-hint">Select what this employee can access in the system</p>
                
                <div class="permissions-grid">
                  <label class="permission-item">
                    <input type="checkbox" v-model="employeeForm.permissions.canAccessPOS" />
                    <div class="permission-info">
                      <span class="permission-name">POS System</span>
                      <span class="permission-desc">Process sales and transactions</span>
                    </div>
                  </label>

                  <label class="permission-item">
                    <input type="checkbox" v-model="employeeForm.permissions.canViewInventory" />
                    <div class="permission-info">
                      <span class="permission-name">View Inventory</span>
                      <span class="permission-desc">Check stock levels</span>
                    </div>
                  </label>

                  <label class="permission-item">
                    <input type="checkbox" v-model="employeeForm.permissions.canEditInventory" />
                    <div class="permission-info">
                      <span class="permission-name">Edit Inventory</span>
                      <span class="permission-desc">Update stock, add items</span>
                    </div>
                  </label>

                  <label class="permission-item">
                    <input type="checkbox" v-model="employeeForm.permissions.canViewReports" />
                    <div class="permission-info">
                      <span class="permission-name">View Reports</span>
                      <span class="permission-desc">Access sales and business reports</span>
                    </div>
                  </label>

                  <label class="permission-item">
                    <input type="checkbox" v-model="employeeForm.permissions.canManageEmployees" />
                    <div class="permission-info">
                      <span class="permission-name">Manage Employees</span>
                      <span class="permission-desc">Add/edit employee records</span>
                    </div>
                  </label>

                  <label class="permission-item">
                    <input type="checkbox" v-model="employeeForm.permissions.canManageSchedule" />
                    <div class="permission-info">
                      <span class="permission-name">Manage Schedule</span>
                      <span class="permission-desc">Create and edit shifts</span>
                    </div>
                  </label>

                  <label class="permission-item">
                    <input type="checkbox" v-model="employeeForm.permissions.canApproveTimeOff" />
                    <div class="permission-info">
                      <span class="permission-name">Approve Time Off</span>
                      <span class="permission-desc">Review time-off requests</span>
                    </div>
                  </label>

                  <label class="permission-item">
                    <input type="checkbox" v-model="employeeForm.permissions.canViewPayroll" />
                    <div class="permission-info">
                      <span class="permission-name">View Payroll</span>
                      <span class="permission-desc">Access payroll information</span>
                    </div>
                  </label>
                </div>

                <div class="quick-presets">
                  <button type="button" @click="applyPreset('staff')" class="btn-preset">Staff Preset</button>
                  <button type="button" @click="applyPreset('manager')" class="btn-preset">Manager Preset</button>
                  <button type="button" @click="applyPreset('admin')" class="btn-preset">Admin Preset</button>
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

  <!-- Reset Password Modal -->
  <div v-if="showResetModal" class="modal-overlay" @click.self="showResetModal = false">
    <div class="modal">
      <div class="modal-header">
        <h2>Reset Password</h2>
        <button @click="showResetModal = false" class="modal-close">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="modal-content">
        <p class="section-description">Set a new password for {{ resetTarget?.first_name }} {{ resetTarget?.last_name }}.</p>
        <div class="form-group">
          <label class="form-label">New Password</label>
          <input type="password" class="form-input" v-model.trim="resetForm.newPassword" placeholder="Minimum 8 characters" />
        </div>
        <div class="form-group">
          <label class="form-label">Confirm New Password</label>
          <input type="password" class="form-input" v-model.trim="resetForm.confirmPassword" placeholder="Re-enter password" />
        </div>
        <div v-if="resetError" class="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-sm">{{ resetError }}</div>
        <div v-if="resetSuccess" class="p-3 bg-green-900/50 border border-green-700 text-green-300 rounded-lg text-sm">{{ resetSuccess }}</div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showResetModal = false">Cancel</button>
          <button class="btn-primary" @click="performResetPassword">Reset Password</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Create Account Modal -->
  <div v-if="showCreateAccountModal" class="modal-overlay" @click.self="showCreateAccountModal = false">
    <div class="modal">
      <div class="modal-header">
        <h2>Create System Account</h2>
        <button @click="showCreateAccountModal = false" class="modal-close">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="modal-content">
        <p class="section-description">Create a login for {{ createAccountTarget?.first_name }} {{ createAccountTarget?.last_name }}.</p>
        <div class="form-group">
          <label class="form-label">Username</label>
          <input type="text" class="form-input" v-model.trim="createAccountForm.username" placeholder="e.g. john.doe" />
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" class="form-input" v-model.trim="createAccountForm.password" placeholder="Minimum 8 characters" />
        </div>
        <div v-if="createAccountError" class="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-sm">{{ createAccountError }}</div>
        <div v-if="createAccountSuccess" class="p-3 bg-green-900/50 border border-green-700 text-green-300 rounded-lg text-sm">{{ createAccountSuccess }}</div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showCreateAccountModal = false">Cancel</button>
          <button class="btn-primary" @click="performCreateAccount">Create Account</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Announcement Modal -->
  <div v-if="showAnnouncementModal" class="modal-overlay" @click.self="showAnnouncementModal = false">
    <div class="modal">
      <div class="modal-header">
        <h2>Post Announcement</h2>
        <button @click="showAnnouncementModal = false" class="modal-close">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form @submit.prevent="saveAnnouncement" class="modal-content">
        <div class="form-group">
          <label class="form-label">Title</label>
          <input v-model="announcementForm.title" type="text" class="form-input" required placeholder="e.g., New Menu Launch">
        </div>
        <div class="form-group">
          <label class="form-label">Message</label>
          <textarea v-model="announcementForm.message" class="form-textarea" rows="4" required placeholder="Enter the announcement details..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Priority</label>
          <select v-model="announcementForm.priority" class="form-input" required>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Target Roles (select multiple)</label>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="announcementForm.targetRoles" value="owner" class="form-checkbox">
              <span>Owners</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="announcementForm.targetRoles" value="manager" class="form-checkbox">
              <span>Managers</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="announcementForm.targetRoles" value="admin" class="form-checkbox">
              <span>Admins</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="announcementForm.targetRoles" value="staff" class="form-checkbox">
              <span>Staff</span>
            </label>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Expiration Date (Optional)</label>
          <input v-model="announcementForm.expiresAt" type="datetime-local" class="form-input">
        </div>
        <div class="modal-actions">
          <button type="button" @click="showAnnouncementModal = false" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary">Post Announcement</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Sidebar from '../components/Sidebar.vue';

const router = useRouter();
const employees = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedStatus = ref(null);
const showEmployeeModal = ref(false);
const showScheduleManager = ref(false);
const showAnnouncementModal = ref(false);
const editingEmployee = ref(null);
const currentUser = ref(null);
const showResetModal = ref(false);
const resetTarget = ref(null);
const resetForm = ref({ newPassword: '', confirmPassword: '' });
const resetError = ref('');
const resetSuccess = ref('');

// Create Account state
const showCreateAccountModal = ref(false);
const createAccountTarget = ref(null);
const createAccountForm = ref({ username: '', password: '' });
const createAccountError = ref('');
const createAccountSuccess = ref('');

// Announcement state
const announcementForm = ref({
  title: '',
  message: '',
  priority: 'normal',
  targetRoles: [],
  expiresAt: ''
});
const postedAnnouncements = ref([]);
const loadingAnnouncements = ref(false);

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
  password: '',
  permissions: {
    canAccessPOS: true,
    canViewInventory: false,
    canEditInventory: false,
    canViewReports: false,
    canManageEmployees: false,
    canManageSchedule: false,
    canApproveTimeOff: false,
    canViewPayroll: false
  }
});

// Load employees
const loadEmployees = async () => {
  loading.value = true;
  try {
    const stored = JSON.parse(localStorage.getItem('currentUser'));
    if (!stored) return;
    currentUser.value = stored;

    const { ipcRenderer } = window.require('electron');
    const result = await ipcRenderer.invoke('employee:get-all', stored.businessId);
    console.log('Loaded employees:', result);
    employees.value = result;
  } catch (error) {
    console.error('Error loading employees:', error);
  } finally {
    loading.value = false;
  }
};

// Open announcement modal
const openAnnouncementModal = () => {
  showAnnouncementModal.value = true;
};

// Load announcements
const loadAnnouncements = async () => {
  loadingAnnouncements.value = true;
  try {
    const stored = JSON.parse(localStorage.getItem('currentUser'));
    if (!stored) return;

    const { ipcRenderer } = window.require('electron');
    const result = await ipcRenderer.invoke('announcements:get-all', {
      businessId: stored.businessId,
      includeExpired: true
    });
    postedAnnouncements.value = result;
  } catch (error) {
    console.error('Error loading announcements:', error);
  } finally {
    loadingAnnouncements.value = false;
  }
};

const parseTargetRoles = (targetRoles) => {
  if (!targetRoles) return ['All'];
  // Split by comma and filter out empty strings
  const roles = targetRoles.split(',')
    .map(r => r.trim())
    .filter(r => r.length > 0)
    .map(r => {
      // Capitalize first letter
      const role = r.toLowerCase();
      return role.charAt(0).toUpperCase() + role.slice(1);
    });
  return roles.length > 0 ? roles : ['All'];
};

const formatAnnouncementDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const isExpired = (expiresAt) => {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
};

const toggleAnnouncementStatus = async (announcement) => {
  try {
    const { ipcRenderer } = window.require('electron');
    await ipcRenderer.invoke('announcements:update', {
      announcementId: announcement.id,
      announcementData: { isActive: !announcement.is_active }
    });
    await loadAnnouncements();
  } catch (error) {
    console.error('Error toggling announcement status:', error);
    alert('Failed to update announcement status');
  }
};

const deleteAnnouncement = async (announcement) => {
  if (!confirm(`Are you sure you want to delete the announcement "${announcement.title}"?`)) return;
  
  try {
    const { ipcRenderer } = window.require('electron');
    await ipcRenderer.invoke('announcements:delete', announcement.id);
    await loadAnnouncements();
  } catch (error) {
    console.error('Error deleting announcement:', error);
    alert('Failed to delete announcement');
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

// Role check (owner only controls)
const isOwner = computed(() => currentUser.value?.role === 'owner');

// Get initials for avatar
const getInitials = (firstName, lastName) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

// Apply permission preset
const applyPreset = (presetType) => {
  const presets = {
    staff: {
      canAccessPOS: true,
      canViewInventory: true,
      canEditInventory: false,
      canViewReports: false,
      canManageEmployees: false,
      canManageSchedule: false,
      canApproveTimeOff: false,
      canViewPayroll: false
    },
    manager: {
      canAccessPOS: true,
      canViewInventory: true,
      canEditInventory: true,
      canViewReports: true,
      canManageEmployees: true,
      canManageSchedule: true,
      canApproveTimeOff: true,
      canViewPayroll: true
    },
    admin: {
      canAccessPOS: true,
      canViewInventory: true,
      canEditInventory: true,
      canViewReports: true,
      canManageEmployees: true,
      canManageSchedule: true,
      canApproveTimeOff: true,
      canViewPayroll: true
    }
  };
  
  employeeForm.value.permissions = { ...presets[presetType] };
};

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Open employee modal
const openEmployeeModal = async (employee = null) => {
  if (employee) {
    editingEmployee.value = employee;
    
    console.log('Opening modal for employee:', employee);
    console.log('Employee user_id:', employee.user_id);
    
    // Parse permissions if they exist
    let permissions = {
      canAccessPOS: true,
      canViewInventory: false,
      canEditInventory: false,
      canViewReports: false,
      canManageEmployees: false,
      canManageSchedule: false,
      canApproveTimeOff: false,
      canViewPayroll: false
    };
    
    if (employee.permissions) {
      try {
        permissions = JSON.parse(employee.permissions);
        console.log('Parsed permissions:', permissions);
      } catch (e) {
        console.error('Error parsing permissions:', e);
      }
    }
    
    // Check if employee has a user account
    let hasAccount = false;
    let username = '';
    
    if (employee.user_id) {
      try {
        const { ipcRenderer } = window.require('electron');
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        console.log('Fetching user account for user_id:', employee.user_id);
        const result = await ipcRenderer.invoke('user:get-by-id', {
          businessId: currentUser.businessId,
          userId: employee.user_id
        });
        
        console.log('User account result:', result);
        
        if (result) {
          hasAccount = true;
          username = result.username;
        }
      } catch (error) {
        console.error('Error loading user account:', error);
      }
    }
    
    console.log('Final hasAccount:', hasAccount, 'username:', username);
    
    employeeForm.value = {
      firstName: employee.first_name,
      lastName: employee.last_name,
      email: employee.email || '',
      phone: employee.phone || '',
      role: employee.role,
      hourlyRate: employee.hourly_rate || null,
      hireDate: employee.hire_date,
      status: employee.status,
      hasAccount: hasAccount,
      createAccount: false,
      username: username,
      password: '',
      permissions: permissions
    };
    
    console.log('Employee form set to:', employeeForm.value);
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
      password: '',
      permissions: {
        canAccessPOS: false,
        canViewInventory: false,
        canEditInventory: false,
        canViewReports: false,
        canManageEmployees: false,
        canManageSchedule: false,
        canApproveTimeOff: false,
        canViewPayroll: false
      }
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
    
    // For editing, include permissions if account exists OR being created
    const includePermissions = editingEmployee.value 
      ? (employeeForm.value.hasAccount || employeeForm.value.createAccount)
      : employeeForm.value.createAccount;
    
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
      password: employeeForm.value.password || null,
      permissions: includePermissions ? { ...employeeForm.value.permissions } : null,
      hasAccount: employeeForm.value.hasAccount || false
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
    
    // Handle specific errors
    if (error.message.includes('UNIQUE constraint failed: users.username')) {
      alert('This username is already taken. Please choose a different username.');
    } else if (error.message.includes('UNIQUE constraint failed: users.email')) {
      alert('This email is already registered. Please use a different email.');
    } else {
      alert('Failed to save employee. Please try again.');
    }
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
  loadAnnouncements();
});

const openResetPassword = (employee) => {
  if (!employee.user_id) {
    openCreateAccount(employee);
    return;
  }
  resetTarget.value = employee;
  resetForm.value = { newPassword: '', confirmPassword: '' };
  resetError.value = '';
  resetSuccess.value = '';
  showResetModal.value = true;
};

const performResetPassword = async () => {
  resetError.value = '';
  resetSuccess.value = '';

  if (!resetForm.value.newPassword || !resetForm.value.confirmPassword) {
    resetError.value = 'Please fill in both fields';
    return;
  }
  if (resetForm.value.newPassword.length < 8) {
    resetError.value = 'Password must be at least 8 characters';
    return;
  }
  if (resetForm.value.newPassword !== resetForm.value.confirmPassword) {
    resetError.value = 'Passwords do not match';
    return;
  }

  try {
    const { ipcRenderer } = window.require('electron');
    const res = await ipcRenderer.invoke('auth:reset-password', {
      userId: resetTarget.value.user_id,
      businessId: currentUser.value.businessId,
      newPassword: resetForm.value.newPassword
    });

    if (res.success) {
      resetSuccess.value = 'Password reset successfully';
      setTimeout(() => {
        showResetModal.value = false;
      }, 800);
    } else {
      resetError.value = res.error || 'Failed to reset password';
    }
  } catch (e) {
    console.error('Reset password error:', e);
    resetError.value = 'An error occurred while resetting password';
  }
};

const openCreateAccount = (employee) => {
  createAccountTarget.value = employee;
  // Suggest a username based on name if possible
  const first = (employee.first_name || '').toLowerCase().replace(/\s+/g, '');
  const last = (employee.last_name || '').toLowerCase().replace(/\s+/g, '');
  const suggestion = [first, last].filter(Boolean).join('.') || '';
  createAccountForm.value = { username: suggestion, password: '' };
  createAccountError.value = '';
  createAccountSuccess.value = '';
  showCreateAccountModal.value = true;
};

const performCreateAccount = async () => {
  createAccountError.value = '';
  createAccountSuccess.value = '';

  if (!createAccountForm.value.username) {
    createAccountError.value = 'Username is required';
    return;
  }
  if (!createAccountForm.value.password || createAccountForm.value.password.length < 8) {
    createAccountError.value = 'Password must be at least 8 characters';
    return;
  }

  try {
    const { ipcRenderer } = window.require('electron');
    const res = await ipcRenderer.invoke('employee:create-account', {
      businessId: currentUser.value.businessId,
      employeeId: createAccountTarget.value.id,
      accountData: {
        username: createAccountForm.value.username,
        password: createAccountForm.value.password
      }
    });

    if (res && res.success) {
      createAccountSuccess.value = 'Account created and linked successfully';
      await loadEmployees();
      setTimeout(() => {
        showCreateAccountModal.value = false;
      }, 800);
    } else {
      const msg = res && res.error ? res.error : 'Failed to create account';
      // Friendly messages for common uniqueness constraints
      if (typeof msg === 'string' && msg.includes('UNIQUE') && msg.includes('users.username')) {
        createAccountError.value = 'This username is already taken. Please choose another.';
      } else if (typeof msg === 'string' && msg.includes('UNIQUE') && msg.includes('users.email')) {
        createAccountError.value = 'This email is already linked to another account.';
      } else {
        createAccountError.value = msg;
      }
    }
  } catch (e) {
    const raw = e && e.message ? e.message : String(e);
    if (raw.includes('UNIQUE constraint failed: users.username')) {
      createAccountError.value = 'This username is already taken. Please choose another.';
    } else if (raw.includes('UNIQUE constraint failed: users.email')) {
      createAccountError.value = 'This email is already linked to another account.';
    } else {
      createAccountError.value = 'An error occurred while creating the account';
    }
  }
};

const saveAnnouncement = async () => {
  try {
    const { ipcRenderer } = window.require('electron');
    
    if (!announcementForm.value.title || !announcementForm.value.message) {
      alert('Please enter both title and message');
      return;
    }
    
    if (announcementForm.value.targetRoles.length === 0) {
      alert('Please select at least one target role');
      return;
    }

    await ipcRenderer.invoke('announcements:create', {
      businessId: currentUser.value.businessId,
      createdBy: currentUser.value.userId || currentUser.value.id,
      title: announcementForm.value.title,
      message: announcementForm.value.message,
      priority: announcementForm.value.priority,
      targetRoles: announcementForm.value.targetRoles.join(','),
      expiresAt: announcementForm.value.expiresAt || null
    });

    showAnnouncementModal.value = false;
    announcementForm.value = {
      title: '',
      message: '',
      priority: 'normal',
      targetRoles: [],
      expiresAt: ''
    };
    
    // Could add a success notification here
    alert('Announcement posted successfully!');
    
    // Reload announcements to show the new one
    await loadAnnouncements();
  } catch (error) {
    console.error('Error creating announcement:', error);
    alert('Failed to post announcement');
  }
};
</script>

<style scoped>
.employees-page {
  display: flex;
  height: 100vh;
  background: #0f1419;
  color: #d1d5db;
}

/* Sidebar Styles */
/* Main Content */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  height: 100vh;
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
  margin-bottom: 0.25rem;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
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

.readonly-input {
  background: #111827 !important;
  cursor: not-allowed;
  opacity: 0.6;
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

.account-status-badge {
  padding: 0.375rem 0.75rem;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 0.375rem;
  color: #22c55e;
  font-size: 0.875rem;
  font-weight: 500;
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

.permissions-section {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 0.5rem;
}

.permissions-section h4 {
  margin: 0 0 0.5rem 0;
  color: #60a5fa;
  font-size: 1rem;
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.permission-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.permission-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(59, 130, 246, 0.3);
}

.permission-item input[type="checkbox"] {
  margin-top: 0.25rem;
  cursor: pointer;
}

.permission-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.permission-name {
  font-weight: 600;
  color: #d1d5db;
  font-size: 0.875rem;
}

.permission-desc {
  font-size: 0.75rem;
  color: #9ca3af;
}

.quick-presets {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-preset {
  flex: 1;
  padding: 0.5rem 1rem;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #a78bfa;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-preset:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.5);
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

/* Announcement Modal Styles */
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-group .checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background 0.2s;
}

.checkbox-group .checkbox-label:hover {
  background: rgba(59, 130, 246, 0.1);
}

.checkbox-group .checkbox-label span {
  font-size: 0.875rem;
  color: #e5e7eb;
}

.form-checkbox {
  width: 1.125rem;
  height: 1.125rem;
  border: 2px solid #374151;
  border-radius: 0.25rem;
  background: #111827;
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  position: relative;
  flex-shrink: 0;
}

.form-checkbox:checked {
  background: #3b82f6;
  border-color: #3b82f6;
}

.form-checkbox:checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.form-checkbox:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  background: #111827;
  border: 1px solid #374151;
  border-radius: 0.5rem;
  color: #f3f4f6;
  font-size: 0.875rem;
  resize: vertical;
  font-family: inherit;
}

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Announcements Section */
.announcements-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(17, 24, 39, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #f3f4f6;
}

.btn-icon {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  padding: 0.5rem;
  cursor: pointer;
  color: #9ca3af;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #f3f4f6;
}

.btn-icon.btn-danger:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.empty-state-sm {
  text-align: center;
  padding: 2rem;
  color: #9ca3af;
}

.empty-icon-sm {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  opacity: 0.5;
}

.announcements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}

.announcement-card {
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 1rem;
  transition: all 0.2s;
}

.announcement-card:hover {
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.announcement-card.priority-urgent {
  border-left: 3px solid #ef4444;
}

.announcement-card.priority-high {
  border-left: 3px solid #f59e0b;
}

.announcement-card.priority-normal {
  border-left: 3px solid #3b82f6;
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.announcement-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.priority-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.priority-badge.urgent {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.priority-badge.high {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.priority-badge.normal {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.date-text {
  font-size: 0.75rem;
  color: #6b7280;
}

.announcement-actions {
  display: flex;
  gap: 0.5rem;
}

.announcement-title {
  font-size: 1rem;
  font-weight: 600;
  color: #f3f4f6;
  margin-bottom: 0.5rem;
}

.announcement-message {
  font-size: 0.875rem;
  color: #d1d5db;
  line-height: 1.5;
  margin-bottom: 0.75rem;
}

.announcement-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.target-roles {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.target-roles .label {
  font-size: 0.75rem;
  color: #6b7280;
}

.role-tag {
  padding: 0.125rem 0.5rem;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: #818cf8;
}

.inactive-badge {
  padding: 0.25rem 0.5rem;
  background: rgba(107, 114, 128, 0.2);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

.expired-badge {
  padding: 0.25rem 0.5rem;
  background: rgba(239, 68, 68, 0.2);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: #ef4444;
}
</style>
