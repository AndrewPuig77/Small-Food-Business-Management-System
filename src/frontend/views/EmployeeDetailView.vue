<template>
  <div class="employee-detail-page">
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

        <router-link to="/menu" class="nav-item">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>Menu</span>
        </router-link>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <div v-if="loading" class="loading">Loading employee details...</div>
      <div v-else-if="!employee" class="error">Employee not found</div>
      <div v-else>
        <!-- Header with employee info -->
        <header class="detail-header">
          <button @click="goBack" class="back-btn">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Employees
          </button>
          
          <div class="employee-header-info">
            <div class="employee-avatar-large">{{ getInitials() }}</div>
            <div>
              <h1 class="employee-name">{{ employee.first_name }} {{ employee.last_name }}</h1>
              <div class="employee-meta">
                <span class="role-badge">{{ employee.role }}</span>
                <span :class="['status-badge', employee.status]">{{ employee.status }}</span>
              </div>
              <div class="employee-contact">
                <span v-if="employee.email">{{ employee.email }}</span>
                <span v-if="employee.phone">{{ employee.phone }}</span>
              </div>
            </div>
            <div style="margin-left:auto; display:flex; align-items:center; gap:0.5rem;">
              <button
                v-if="isOwner && employee.user_id"
                class="btn-secondary"
                @click="openResetPassword()"
                title="Reset Password"
              >
                Reset Password
              </button>
            </div>
          </div>
        </header>

        <!-- Tabs -->
        <div class="tabs-container">
          <div class="tabs">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="['tab', { active: activeTab === tab.id }]"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- Tab Content -->
          <div class="tab-content">
            <!-- Schedules Tab -->
            <div v-if="activeTab === 'schedules'" class="tab-panel">
              <div class="panel-header">
                <h2>Weekly Schedule</h2>
                <button @click="editSchedule" class="btn-primary">Edit Schedule</button>
              </div>
              
              <div v-if="schedules.length === 0" class="empty-state">
                <p>No schedule set for this employee</p>
                <button @click="editSchedule" class="btn-secondary">Create Schedule</button>
              </div>
              
              <div v-else class="schedule-grid">
                <div v-for="schedule in sortedSchedules" :key="schedule.id" class="schedule-item">
                  <div class="schedule-day">{{ getDayName(schedule.day_of_week) }}</div>
                  <div class="schedule-time">{{ formatTime(schedule.start_time) }} - {{ formatTime(schedule.end_time) }}</div>
                </div>
              </div>
            </div>

            <!-- Time Off & Availability Tab -->
            <div v-if="activeTab === 'timeoff'" class="tab-panel">
              <!-- Time Off Requests Section -->
              <div class="timeoff-section">
                <div class="panel-header">
                  <h2>Time Off Requests</h2>
                  <button @click="showTimeOffModal = true" class="btn-primary">Request Time Off</button>
                </div>
                
                <div v-if="timeOffRequests.length === 0" class="empty-state">
                  <p>No time off requests</p>
                </div>
                
                <div v-else class="timeoff-list">
                  <div v-for="request in timeOffRequests" :key="request.id" class="timeoff-item">
                    <div class="timeoff-header">
                      <span class="timeoff-dates">{{ formatDate(request.start_date) }} - {{ formatDate(request.end_date) }}</span>
                      <span :class="['status-badge', request.status]">{{ request.status }}</span>
                    </div>
                    <div class="timeoff-info">
                      <span class="timeoff-type">{{ request.request_type }}</span>
                      <span v-if="request.reason" class="timeoff-reason">{{ request.reason }}</span>
                    </div>
                    <div v-if="request.status === 'pending' && isOwner" class="timeoff-actions">
                      <button @click="reviewTimeOff(request.id, 'approved')" class="btn-approve">Approve</button>
                      <button @click="reviewTimeOff(request.id, 'denied')" class="btn-deny">Deny</button>
                    </div>
                    <div v-if="request.status !== 'pending' && request.reviewed_by_name" class="timeoff-review">
                      <span>Reviewed by {{ request.reviewed_by_name }}</span>
                      <span v-if="request.review_notes"> - {{ request.review_notes }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Availability Section -->
              <div class="availability-section">
                <div class="panel-header">
                  <h2>Weekly Availability</h2>
                  <button @click="editAvailability" class="btn-primary">Edit Availability</button>
                </div>
                
                <div v-if="availability.length === 0" class="empty-state">
                  <p>No availability set</p>
                </div>
                
                <div v-else class="availability-grid">
                  <div v-for="day in availability" :key="day.id" class="availability-item">
                    <div class="day-name">{{ getDayName(day.day_of_week) }}</div>
                    <div v-if="day.is_available" class="available">
                      <span class="status-indicator available"></span>
                      <span v-if="day.start_time && day.end_time">
                        {{ formatTime(day.start_time) }} - {{ formatTime(day.end_time) }}
                      </span>
                      <span v-else>Available</span>
                    </div>
                    <div v-else class="unavailable">
                      <span class="status-indicator unavailable"></span>
                      <span>Not Available</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Performance Notes Tab -->
            <div v-if="activeTab === 'notes'" class="tab-panel">
              <div class="panel-header">
                <h2>Performance Notes</h2>
                <button @click="showNoteModal = true" class="btn-primary">Add Note</button>
              </div>
              
              <div v-if="notes.length === 0" class="empty-state">
                <p>No notes recorded</p>
              </div>
              
              <div v-else class="notes-list">
                <div v-for="note in notes" :key="note.id" class="note-item">
                  <div class="note-header">
                    <span :class="['note-type', note.note_type]">{{ note.note_type }}</span>
                    <span v-if="note.rating" class="rating">★ {{ note.rating }}/5</span>
                    <span class="note-date">{{ formatDateTime(note.created_at) }}</span>
                  </div>
                  <p class="note-text">{{ note.note_text }}</p>
                  <p v-if="note.created_by_name" class="note-author">— {{ note.created_by_name }}</p>
                </div>
              </div>
            </div>

            <!-- Tasks Tab -->
            <div v-if="activeTab === 'tasks'" class="tab-panel">
              <div class="panel-header">
                <h2>Assigned Tasks</h2>
                <button @click="showTaskModal = true" class="btn-primary">Assign Task</button>
              </div>
              
              <div v-if="employeeTasks.length === 0" class="empty-state">
                <p>No tasks assigned</p>
              </div>
              
              <div v-else class="tasks-list">
                <div v-for="task in employeeTasks" :key="task.id" class="task-item" :class="{ 'completed': task.status === 'completed' }">
                  <div class="task-header">
                    <div class="task-main-info">
                      <input 
                        type="checkbox" 
                        :checked="task.status === 'completed'" 
                        @change="toggleTaskCompletion(task.id, task.status)"
                        class="task-checkbox"
                      />
                      <div class="task-details">
                        <h3 class="task-title">{{ task.title }}</h3>
                        <p v-if="task.description" class="task-description">{{ task.description }}</p>
                      </div>
                    </div>
                    <div class="task-meta">
                      <span :class="['priority-badge', task.priority]">{{ task.priority }}</span>
                      <span v-if="task.due_date" class="due-date" :class="{ 'overdue': isOverdue(task.due_date) && task.status !== 'completed' }">
                        Due: {{ formatDate(task.due_date) }}
                      </span>
                    </div>
                  </div>
                  <div v-if="task.completed_at" class="task-footer">
                    <span class="completion-info">Completed {{ formatDateTime(task.completed_at) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Emergency Contacts Tab -->
            <div v-if="activeTab === 'contacts'" class="tab-panel">
              <div class="panel-header">
                <h2>Emergency Contacts</h2>
                <button @click="addContact" class="btn-primary">Add Contact</button>
              </div>
              
              <div v-if="contacts.length === 0" class="empty-state">
                <p>No emergency contacts added</p>
              </div>
              
              <div v-else class="contacts-grid">
                <div v-for="contact in contacts" :key="contact.id" class="contact-card">
                  <div class="contact-header">
                    <h3>{{ contact.name }}</h3>
                    <button @click="deleteContact(contact.id)" class="btn-icon-delete">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <p class="contact-relationship">{{ contact.relationship }}</p>
                  <p class="contact-info">{{ contact.phone }}</p>
                  <p v-if="contact.email" class="contact-info">{{ contact.email }}</p>
                </div>
              </div>
            </div>

            <!-- Documents Tab -->
            <div v-if="activeTab === 'documents'" class="tab-panel">
              <div class="panel-header">
                <h2>Documents</h2>
                <button @click="uploadDocument" class="btn-primary">Upload Document</button>
              </div>
              
              <div v-if="documents.length === 0" class="empty-state">
                <p>No documents uploaded</p>
              </div>
              
              <div v-else class="documents-list">
                <div v-for="doc in documents" :key="doc.id" class="document-item">
                  <div class="document-icon">📄</div>
                  <div class="document-info">
                    <div class="document-name">{{ doc.document_name }}</div>
                    <div class="document-meta">{{ doc.document_type }} • {{ formatDate(doc.uploaded_at) }}</div>
                  </div>
                  <div class="document-actions">
                    <button @click="downloadDocument(doc.id, doc.document_name)" class="btn-icon-action" title="Download">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    <button @click="deleteDocument(doc.id)" class="btn-icon-delete" title="Delete">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Time Tracking Tab -->
            <div v-if="activeTab === 'timetracking'" class="tab-panel">
              <div class="panel-header">
                <h2>Time Tracking</h2>
                <div class="time-actions">
                  <button @click="clockIn" class="btn-success" :disabled="isClockedIn">Clock In</button>
                  <button @click="clockOut" class="btn-warning" :disabled="!isClockedIn">Clock Out</button>
                </div>
              </div>
              
              <div class="time-filters">
                <input v-model="timeLogStartDate" type="date" class="form-input">
                <input v-model="timeLogEndDate" type="date" class="form-input">
                <button @click="loadTimeLogs" class="btn-secondary">Filter</button>
              </div>
              
              <div v-if="timeLogs.length === 0" class="empty-state">
                <p>No time logs recorded</p>
              </div>
              
              <table v-else class="time-table">
                <thead>
                  <tr>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="log in timeLogs" :key="log.id">
                    <td>{{ formatDateTime(log.clock_in) }}</td>
                    <td>{{ log.clock_out ? formatDateTime(log.clock_out) : 'Active' }}</td>
                    <td>{{ formatHours(log.hours_worked) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Payroll Tab -->
            <div v-if="activeTab === 'payroll'" class="tab-panel">
              <div class="panel-header">
                <h2>Payroll Calculation</h2>
              </div>
              
              <div class="payroll-filters">
                <input v-model="payrollStartDate" type="date" class="form-input">
                <input v-model="payrollEndDate" type="date" class="form-input">
                <button @click="calculatePayroll" class="btn-primary">Calculate</button>
              </div>
              
              <div v-if="payrollData" class="payroll-summary">
                <div class="payroll-card">
                  <div class="payroll-label">Hourly Rate</div>
                  <div class="payroll-value">${{ payrollData.hourlyRate }}/hr</div>
                </div>
                <div class="payroll-card">
                  <div class="payroll-label">Total Hours</div>
                  <div class="payroll-value">{{ payrollData.totalHours }} hrs</div>
                </div>
                <div class="payroll-card highlight">
                  <div class="payroll-label">Total Pay</div>
                  <div class="payroll-value">${{ payrollData.totalPay }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Add Note Modal -->
    <div v-if="showNoteModal" class="modal-overlay" @click.self="showNoteModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Add Performance Note</h2>
          <button @click="showNoteModal = false" class="modal-close">×</button>
        </div>
        <form @submit.prevent="saveNote" class="modal-content">
          <div class="form-group">
            <label class="form-label">Note Type</label>
            <select v-model="noteForm.noteType" class="form-input" required>
              <option value="performance">Performance</option>
              <option value="disciplinary">Disciplinary</option>
              <option value="achievement">Achievement</option>
              <option value="general">General</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Rating (Optional)</label>
            <input v-model.number="noteForm.rating" type="number" min="1" max="5" class="form-input">
          </div>
          <div class="form-group">
            <label class="form-label">Note</label>
            <textarea v-model="noteForm.noteText" class="form-textarea" rows="4" required></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showNoteModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Save Note</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Assign Task Modal -->
    <div v-if="showTaskModal" class="modal-overlay" @click.self="showTaskModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Assign Task</h2>
          <button @click="showTaskModal = false" class="modal-close">×</button>
        </div>
        <form @submit.prevent="saveTask" class="modal-content">
          <div class="form-group">
            <label class="form-label">Task Title</label>
            <input v-model="taskForm.title" type="text" class="form-input" required placeholder="e.g., Clean kitchen equipment">
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea v-model="taskForm.description" class="form-textarea" rows="3" placeholder="Additional details..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Task Type</label>
            <select v-model="taskForm.taskType" class="form-input" required>
              <option value="general">General</option>
              <option value="opening">Opening Task</option>
              <option value="closing">Closing Task</option>
              <option value="training">Training</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Priority</label>
            <select v-model="taskForm.priority" class="form-input" required>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Due Date (Optional)</label>
            <input v-model="taskForm.dueDate" type="date" class="form-input">
          </div>
          <div class="modal-actions">
            <button type="button" @click="showTaskModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Assign Task</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add Contact Modal -->
    <div v-if="showContactModal" class="modal-overlay" @click.self="showContactModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Add Emergency Contact</h2>
          <button @click="showContactModal = false" class="modal-close">×</button>
        </div>
        <form @submit.prevent="saveContact" class="modal-content">
          <div class="form-group">
            <label class="form-label">Name</label>
            <input v-model="contactForm.name" type="text" class="form-input" required>
          </div>
          <div class="form-group">
            <label class="form-label">Relationship</label>
            <input v-model="contactForm.relationship" type="text" class="form-input" required>
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input v-model="contactForm.phone" type="tel" class="form-input" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email (Optional)</label>
            <input v-model="contactForm.email" type="email" class="form-input">
          </div>
          <div class="modal-actions">
            <button type="button" @click="showContactModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Save Contact</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Document Upload Input (hidden) -->
    <input 
      ref="fileInput" 
      type="file" 
      @change="handleFileUpload" 
      style="display: none"
      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
    />

    <!-- Schedule Editor Modal -->
    <div v-if="showScheduleModal" class="modal-overlay" @click.self="showScheduleModal = false">
      <div class="modal modal-wide">
        <div class="modal-header">
          <h2>Edit Weekly Schedule</h2>
          <button @click="showScheduleModal = false" class="modal-close">×</button>
        </div>
        <form @submit.prevent="saveSchedule" class="modal-content">
          <div class="schedule-editor">
            <div v-for="day in daysOfWeek" :key="day.value" class="schedule-day-row">
              <div class="day-checkbox">
                <input 
                  type="checkbox" 
                  :id="`day-${day.value}`"
                  v-model="scheduleForm[day.value].enabled"
                  class="checkbox"
                />
                <label :for="`day-${day.value}`" class="day-label">{{ day.name }}</label>
              </div>
              <div v-if="scheduleForm[day.value].enabled" class="time-inputs">
                <input 
                  v-model="scheduleForm[day.value].startTime" 
                  type="time" 
                  class="form-input time-input"
                  required
                />
                <span class="time-separator">to</span>
                <input 
                  v-model="scheduleForm[day.value].endTime" 
                  type="time" 
                  class="form-input time-input"
                  required
                />
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showScheduleModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Save Schedule</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <div v-if="showResetModal" class="modal-overlay" @click.self="showResetModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Reset Password</h2>
          <button @click="showResetModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-content">
          <p class="section-description">Set a new password for {{ employee.first_name }} {{ employee.last_name }}.</p>
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

    <!-- Time Off Request Modal -->
    <div v-if="showTimeOffModal" class="modal-overlay" @click.self="showTimeOffModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Request Time Off</h2>
          <button @click="showTimeOffModal = false" class="modal-close">×</button>
        </div>
        <form @submit.prevent="saveTimeOffRequest">
          <div class="modal-content">
            <div class="form-group">
              <label class="form-label">Request Type</label>
              <select v-model="timeOffForm.requestType" class="form-input" required>
                <option value="vacation">Vacation</option>
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Start Date</label>
              <input type="date" v-model="timeOffForm.startDate" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">End Date</label>
              <input type="date" v-model="timeOffForm.endDate" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">Reason (Optional)</label>
              <textarea v-model="timeOffForm.reason" class="form-input" rows="3" placeholder="Provide additional details..."></textarea>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showTimeOffModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Submit Request</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Availability Edit Modal -->
    <div v-if="showAvailabilityModal" class="modal-overlay" @click.self="showAvailabilityModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Edit Availability</h2>
          <button @click="showAvailabilityModal = false" class="modal-close">×</button>
        </div>
        <form @submit.prevent="saveAvailability">
          <div class="modal-content">
            <p class="section-description">Set the days and times {{ employee.first_name }} is available to work.</p>
            <div class="availability-editor">
              <div v-for="day in availabilityDays" :key="day.value" class="availability-day-row">
                <div class="day-checkbox">
                  <input 
                    type="checkbox" 
                    :id="'avail-' + day.value" 
                    v-model="day.isAvailable"
                    class="form-checkbox"
                  />
                  <label :for="'avail-' + day.value" class="day-label">{{ day.name }}</label>
                </div>
                <div class="time-inputs" v-if="day.isAvailable">
                  <input 
                    type="time" 
                    v-model="day.startTime" 
                    class="form-input time-input"
                    placeholder="Start"
                  />
                  <span class="time-separator">to</span>
                  <input 
                    type="time" 
                    v-model="day.endTime" 
                    class="form-input time-input"
                    placeholder="End"
                  />
                </div>
                <div class="time-placeholder" v-else>
                  <span class="text-gray-500">Not available</span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showAvailabilityModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Save Availability</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const { ipcRenderer } = window.require('electron');

const employee = ref(null);
const loading = ref(true);
const activeTab = ref('schedules');
const currentUser = ref(null);
const showResetModal = ref(false);
const resetForm = ref({ newPassword: '', confirmPassword: '' });
const resetError = ref('');
const resetSuccess = ref('');

const schedules = ref([]);
const notes = ref([]);
const contacts = ref([]);
const documents = ref([]);
const timeLogs = ref([]);
const payrollData = ref(null);
const timeOffRequests = ref([]);
const availability = ref([]);
const employeeTasks = ref([]);

const showNoteModal = ref(false);
const showContactModal = ref(false);
const showScheduleModal = ref(false);
const showTimeOffModal = ref(false);
const showAvailabilityModal = ref(false);
const showTaskModal = ref(false);

const noteForm = ref({ noteType: 'general', noteText: '', rating: null });
const contactForm = ref({ name: '', relationship: '', phone: '', email: '' });
const taskForm = ref({
  title: '',
  description: '',
  taskType: 'general',
  priority: 'normal',
  dueDate: ''
});
const scheduleForm = ref({
  0: { enabled: false, startTime: '09:00', endTime: '17:00' },
  1: { enabled: false, startTime: '09:00', endTime: '17:00' },
  2: { enabled: false, startTime: '09:00', endTime: '17:00' },
  3: { enabled: false, startTime: '09:00', endTime: '17:00' },
  4: { enabled: false, startTime: '09:00', endTime: '17:00' },
  5: { enabled: false, startTime: '09:00', endTime: '17:00' },
  6: { enabled: false, startTime: '09:00', endTime: '17:00' }
});
const timeOffForm = ref({
  requestType: 'vacation',
  startDate: '',
  endDate: '',
  reason: ''
});
const availabilityDays = ref([
  { name: 'Sunday', value: 0, isAvailable: false, startTime: '09:00', endTime: '17:00' },
  { name: 'Monday', value: 1, isAvailable: false, startTime: '09:00', endTime: '17:00' },
  { name: 'Tuesday', value: 2, isAvailable: false, startTime: '09:00', endTime: '17:00' },
  { name: 'Wednesday', value: 3, isAvailable: false, startTime: '09:00', endTime: '17:00' },
  { name: 'Thursday', value: 4, isAvailable: false, startTime: '09:00', endTime: '17:00' },
  { name: 'Friday', value: 5, isAvailable: false, startTime: '09:00', endTime: '17:00' },
  { name: 'Saturday', value: 6, isAvailable: false, startTime: '09:00', endTime: '17:00' }
]);

const daysOfWeek = [
  { name: 'Sunday', value: 0 },
  { name: 'Monday', value: 1 },
  { name: 'Tuesday', value: 2 },
  { name: 'Wednesday', value: 3 },
  { name: 'Thursday', value: 4 },
  { name: 'Friday', value: 5 },
  { name: 'Saturday', value: 6 }
];

const timeLogStartDate = ref('');
const timeLogEndDate = ref('');
const payrollStartDate = ref('');
const payrollEndDate = ref('');

const tabs = [
  { id: 'schedules', label: 'Schedules' },
  { id: 'timeoff', label: 'Time Off & Availability' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'notes', label: 'Performance Notes' },
  { id: 'contacts', label: 'Emergency Contacts' },
  { id: 'documents', label: 'Documents' },
  { id: 'timetracking', label: 'Time Tracking' },
  { id: 'payroll', label: 'Payroll' }
];

const sortedSchedules = computed(() => {
  return [...schedules.value].sort((a, b) => a.day_of_week - b.day_of_week);
});

const isClockedIn = computed(() => {
  return timeLogs.value.some(log => !log.clock_out);
});

const isOwner = computed(() => currentUser.value?.role === 'owner');

const loadEmployee = async () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem('currentUser'));
    currentUser.value = storedUser;
    const employeeId = route.params.id;
    
    employee.value = await ipcRenderer.invoke('employee:get-by-id', {
      businessId: storedUser.businessId,
      employeeId: parseInt(employeeId)
    });
    
    await Promise.all([
      loadSchedules(),
      loadNotes(),
      loadContacts(),
      loadDocuments(),
      loadTimeLogs(),
      loadTimeOffRequests(),
      loadAvailability(),
      loadTasks()
    ]);
  } catch (error) {
    console.error('Error loading employee:', error);
  } finally {
    loading.value = false;
  }
};

const loadSchedules = async () => {
  schedules.value = await ipcRenderer.invoke('employee:get-schedules', parseInt(route.params.id));
};

const loadNotes = async () => {
  notes.value = await ipcRenderer.invoke('employee:get-notes', parseInt(route.params.id));
};

const loadContacts = async () => {
  contacts.value = await ipcRenderer.invoke('employee:get-emergency-contacts', parseInt(route.params.id));
};

const loadDocuments = async () => {
  documents.value = await ipcRenderer.invoke('employee:get-documents', parseInt(route.params.id));
};

const loadTimeLogs = async () => {
  timeLogs.value = await ipcRenderer.invoke('employee:get-time-logs', {
    employeeId: parseInt(route.params.id),
    startDate: timeLogStartDate.value || null,
    endDate: timeLogEndDate.value || null
  });
};

const loadTimeOffRequests = async () => {
  try {
    timeOffRequests.value = await ipcRenderer.invoke('timeoff:get-employee', parseInt(route.params.id));
  } catch (error) {
    console.error('Error loading time-off requests:', error);
  }
};

const loadAvailability = async () => {
  try {
    const availData = await ipcRenderer.invoke('availability:get', parseInt(route.params.id));
    // Update availabilityDays with loaded data
    availabilityDays.value.forEach(day => {
      const existingDay = availData.find(a => a.day_of_week === day.value);
      if (existingDay) {
        day.isAvailable = existingDay.is_available === 1;
        day.startTime = existingDay.start_time || '09:00';
        day.endTime = existingDay.end_time || '17:00';
      } else {
        day.isAvailable = false;
        day.startTime = '09:00';
        day.endTime = '17:00';
      }
    });
    availability.value = availData;
  } catch (error) {
    console.error('Error loading availability:', error);
  }
};

const saveTimeOffRequest = async () => {
  try {
    if (!timeOffForm.value.startDate || !timeOffForm.value.endDate) {
      alert('Please select both start and end dates');
      return;
    }

    await ipcRenderer.invoke('timeoff:create', {
      employeeId: parseInt(route.params.id),
      startDate: timeOffForm.value.startDate,
      endDate: timeOffForm.value.endDate,
      requestType: timeOffForm.value.requestType,
      reason: timeOffForm.value.reason || null
    });

    showTimeOffModal.value = false;
    timeOffForm.value = {
      requestType: 'vacation',
      startDate: '',
      endDate: '',
      reason: ''
    };
    await loadTimeOffRequests();
  } catch (error) {
    console.error('Error creating time-off request:', error);
    alert('Failed to create time-off request');
  }
};

const reviewTimeOff = async (requestId, status) => {
  try {
    const storedUser = JSON.parse(localStorage.getItem('currentUser'));
    await ipcRenderer.invoke('timeoff:review', {
      requestId,
      reviewData: {
        status,
        reviewedBy: storedUser.userId,
        reviewedAt: new Date().toISOString()
      }
    });
    await loadTimeOffRequests();
  } catch (error) {
    console.error('Error reviewing time-off:', error);
    alert('Failed to review time-off request');
  }
};

const editAvailability = () => {
  showAvailabilityModal.value = true;
};

const saveAvailability = async () => {
  try {
    const availabilityData = availabilityDays.value
      .filter(day => day.isAvailable)
      .map(day => ({
        dayOfWeek: day.value,
        isAvailable: 1,
        startTime: day.startTime,
        endTime: day.endTime
      }));

    await ipcRenderer.invoke('availability:update', {
      employeeId: parseInt(route.params.id),
      availabilityData
    });

    showAvailabilityModal.value = false;
    await loadAvailability();
  } catch (error) {
    console.error('Error saving availability:', error);
    alert('Failed to save availability');
  }
};

const loadTasks = async () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem('currentUser'));
    employeeTasks.value = await ipcRenderer.invoke('tasks:get-employee', {
      businessId: storedUser.businessId,
      employeeId: parseInt(route.params.id)
    });
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
};

const saveTask = async () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!taskForm.value.title) {
      alert('Please enter a task title');
      return;
    }

    await ipcRenderer.invoke('tasks:create', {
      businessId: storedUser.businessId,
      assignedTo: parseInt(route.params.id),
      assignedBy: storedUser.userId || storedUser.id,
      title: taskForm.value.title,
      description: taskForm.value.description || null,
      taskType: taskForm.value.taskType,
      priority: taskForm.value.priority,
      dueDate: taskForm.value.dueDate || null
    });

    showTaskModal.value = false;
    taskForm.value = {
      title: '',
      description: '',
      taskType: 'general',
      priority: 'normal',
      dueDate: ''
    };
    await loadTasks();
  } catch (error) {
    console.error('Error creating task:', error);
    alert('Failed to create task');
  }
};

const toggleTaskCompletion = async (taskId, currentStatus) => {
  try {
    const storedUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (currentStatus === 'completed') {
      // Reopen task
      await ipcRenderer.invoke('tasks:update', {
        taskId,
        updates: { status: 'pending' }
      });
    } else {
      // Complete task
      await ipcRenderer.invoke('tasks:complete', {
        taskId,
        completedBy: storedUser.userId
      });
    }
    
    await loadTasks();
  } catch (error) {
    console.error('Error toggling task completion:', error);
    alert('Failed to update task');
  }
};

const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

const calculatePayroll = async () => {
  if (!payrollStartDate.value || !payrollEndDate.value) {
    alert('Please select both start and end dates');
    return;
  }
  
  payrollData.value = await ipcRenderer.invoke('employee:calculate-payroll', {
    employeeId: parseInt(route.params.id),
    startDate: payrollStartDate.value,
    endDate: payrollEndDate.value
  });
};

const goBack = () => router.push('/employees');
const getInitials = () => `${employee.value.first_name[0]}${employee.value.last_name[0]}`.toUpperCase();

const getDayName = (day) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];

const formatTime = (time) => {
  if (!time) return '';
  return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

// Parse local datetime strings (YYYY-MM-DD HH:MM:SS or T variant) to local Date
const parseLocalDateTime = (s) => {
  if (!s) return null;
  const str = String(s).trim();
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1;
  const day = parseInt(m[3], 10);
  const hour = parseInt(m[4], 10);
  const minute = parseInt(m[5], 10);
  const second = parseInt(m[6], 10);
  return new Date(year, month, day, hour, minute, second);
};

const formatDateTime = (datetime) => {
  const d = parseLocalDateTime(datetime) || new Date(datetime);
  if (!d || isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatHours = (h) => {
  if (h === null || h === undefined) return '—';
  const n = Number(h) || 0;
  const safe = n < 0 ? 0 : n;
  return safe.toFixed(2);
};

const editSchedule = () => {
  // Load existing schedules into form
  scheduleForm.value = {
    0: { enabled: false, startTime: '09:00', endTime: '17:00' },
    1: { enabled: false, startTime: '09:00', endTime: '17:00' },
    2: { enabled: false, startTime: '09:00', endTime: '17:00' },
    3: { enabled: false, startTime: '09:00', endTime: '17:00' },
    4: { enabled: false, startTime: '09:00', endTime: '17:00' },
    5: { enabled: false, startTime: '09:00', endTime: '17:00' },
    6: { enabled: false, startTime: '09:00', endTime: '17:00' }
  };
  
  schedules.value.forEach(schedule => {
    scheduleForm.value[schedule.day_of_week] = {
      enabled: true,
      startTime: schedule.start_time,
      endTime: schedule.end_time
    };
  });
  
  showScheduleModal.value = true;
};

const saveSchedule = async () => {
  const scheduleData = [];
  
  Object.keys(scheduleForm.value).forEach(day => {
    if (scheduleForm.value[day].enabled) {
      scheduleData.push({
        day: parseInt(day),
        startTime: scheduleForm.value[day].startTime,
        endTime: scheduleForm.value[day].endTime
      });
    }
  });
  
  await ipcRenderer.invoke('employee:save-schedule', {
    employeeId: parseInt(route.params.id),
    scheduleData
  });
  
  showScheduleModal.value = false;
  await loadSchedules();
};

const saveNote = async () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  await ipcRenderer.invoke('employee:add-note', {
    employeeId: parseInt(route.params.id),
    noteData: {
      createdBy: currentUser.userId,
      noteType: noteForm.value.noteType,
      noteText: noteForm.value.noteText,
      rating: noteForm.value.rating
    }
  });
  
  noteForm.value = { noteType: 'general', noteText: '', rating: null };
  showNoteModal.value = false;
  await loadNotes();
};

const addContact = () => {
  contactForm.value = { name: '', relationship: '', phone: '', email: '' };
  showContactModal.value = true;
};

const saveContact = async () => {
  await ipcRenderer.invoke('employee:save-emergency-contact', {
    employeeId: parseInt(route.params.id),
    contactData: contactForm.value
  });
  
  showContactModal.value = false;
  await loadContacts();
};

const deleteContact = async (contactId) => {
  if (confirm('Delete this emergency contact?')) {
    await ipcRenderer.invoke('employee:delete-emergency-contact', contactId);
    await loadContacts();
  }
};

const fileInput = ref(null);

const uploadDocument = () => {
  fileInput.value.click();
};

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    await ipcRenderer.invoke('employee:upload-document', {
      employeeId: parseInt(route.params.id),
      documentData: {
        name: file.name,
        type: file.type,
        fileData: e.target.result
      }
    });
    
    await loadDocuments();
  };
  reader.readAsDataURL(file);
};

const deleteDocument = async (docId) => {
  if (confirm('Delete this document?')) {
    await ipcRenderer.invoke('employee:delete-document', docId);
    await loadDocuments();
  }
};

const downloadDocument = async (docId, fileName) => {
  try {
    const doc = await ipcRenderer.invoke('employee:get-document', docId);
    if (!doc || !doc.file_data) {
      alert('Document not found');
      return;
    }
    
    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = doc.file_data;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading document:', error);
    alert('Failed to download document');
  }
};

const clockIn = async () => {
  await ipcRenderer.invoke('employee:clock-in', parseInt(route.params.id));
  await loadTimeLogs();
};

const clockOut = async () => {
  await ipcRenderer.invoke('employee:clock-out', parseInt(route.params.id));
  await loadTimeLogs();
};

onMounted(() => {
  loadEmployee();
  
  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  
  timeLogStartDate.value = firstDay;
  timeLogEndDate.value = today;
  payrollStartDate.value = firstDay;
  payrollEndDate.value = today;
});

const openResetPassword = () => {
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
    const res = await ipcRenderer.invoke('auth:reset-password', {
      userId: employee.value.user_id,
      businessId: currentUser.value.businessId,
      newPassword: resetForm.value.newPassword
    });
    if (res.success) {
      resetSuccess.value = 'Password reset successfully';
      setTimeout(() => { showResetModal.value = false; }, 800);
    } else {
      resetError.value = res.error || 'Failed to reset password';
    }
  } catch (e) {
    console.error('Reset password error:', e);
    resetError.value = 'An error occurred while resetting password';
  }
};
</script>

<style scoped>
.employee-detail-page {
  display: flex;
  height: 100vh;
  background: #0f1419;
  color: #d1d5db;
}

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

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  height: 100vh;
}

.loading, .error {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.detail-header {
  margin-bottom: 2rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #60a5fa;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
}

.back-btn svg {
  width: 16px;
  height: 16px;
}

.back-btn:hover {
  color: #3b82f6;
}

.employee-header-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
}

.employee-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: white;
}

.employee-name {
  font-size: 1.75rem;
  font-weight: 700;
  color: #f3f4f6;
  margin-bottom: 0.5rem;
}

.employee-meta {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
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

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
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

.employee-contact {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #9ca3af;
}

.tabs-container {
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  overflow: hidden;
}

.tabs {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
}

.tab {
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab:hover {
  color: #f3f4f6;
  background: rgba(255, 255, 255, 0.03);
}

.tab.active {
  color: #60a5fa;
  border-bottom-color: #3b82f6;
}

.tab-content {
  padding: 2rem;
}

.tab-panel {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.panel-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #f3f4f6;
}

.btn-primary, .btn-secondary, .btn-success, .btn-warning {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #d1d5db;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-success:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.btn-warning:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.time-actions {
  display: flex;
  gap: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #6b7280;
}

.schedule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.schedule-item {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
}

.schedule-day {
  font-weight: 600;
  color: #60a5fa;
  margin-bottom: 0.5rem;
}

.schedule-time {
  font-size: 0.875rem;
  color: #d1d5db;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.note-item {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
}

.note-header {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.75rem;
}

.note-type {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-weight: 600;
  text-transform: capitalize;
}

.note-type.performance {
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
}

.note-type.disciplinary {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

.note-type.achievement {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.note-type.general {
  background: rgba(156, 163, 175, 0.1);
  color: #9ca3af;
}

.rating {
  color: #fbbf24;
  font-weight: 600;
}

.note-date {
  color: #6b7280;
  margin-left: auto;
}

.note-text {
  color: #d1d5db;
  line-height: 1.6;
}

.note-author {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #9ca3af;
  font-style: italic;
}

.contacts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.contact-card {
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
}

.contact-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.contact-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #f3f4f6;
}

.btn-icon-delete {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #f87171;
  padding: 0.375rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon-delete:hover {
  background: rgba(239, 68, 68, 0.2);
}

.btn-icon-delete svg {
  width: 16px;
  height: 16px;
  display: block;
}

.contact-relationship {
  color: #60a5fa;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.contact-info {
  font-size: 0.875rem;
  color: #9ca3af;
  margin-bottom: 0.25rem;
}

.documents-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.document-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
}

.document-icon {
  font-size: 2rem;
}

.document-info {
  flex: 1;
}

.document-name {
  font-weight: 500;
  color: #f3f4f6;
  margin-bottom: 0.25rem;
}

.document-meta {
  font-size: 0.75rem;
  color: #6b7280;
}

.document-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon-action {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  padding: 0.375rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon-action:hover {
  background: rgba(59, 130, 246, 0.2);
}

.btn-icon-action svg {
  width: 16px;
  height: 16px;
  display: block;
}

.time-filters, .payroll-filters {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  align-items: center;
}

.time-table {
  width: 100%;
  border-collapse: collapse;
}

.time-table th {
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #9ca3af;
  font-size: 0.75rem;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.time-table td {
  padding: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #d1d5db;
}

.payroll-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.payroll-card {
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  text-align: center;
}

.payroll-card.highlight {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
}

.payroll-label {
  font-size: 0.875rem;
  color: #9ca3af;
  margin-bottom: 0.5rem;
}

.payroll-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #f3f4f6;
}

.payroll-card.highlight .payroll-value {
  color: #10b981;
}

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
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-wide {
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f3f4f6;
}

.modal-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 2rem;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
}

.modal-close:hover {
  color: #f3f4f6;
}

.modal-content {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #d1d5db;
  margin-bottom: 0.5rem;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 0.75rem;
  background: #1f2937;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #f3f4f6;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.schedule-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.schedule-day-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
}

.day-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 120px;
}

.checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.day-label {
  font-weight: 500;
  color: #f3f4f6;
  cursor: pointer;
  user-select: none;
}

.time-inputs {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.time-input {
  padding: 0.5rem;
  width: 120px;
}

.time-separator {
  color: #9ca3af;
  font-size: 0.875rem;
}

/* Time Off & Availability Styles */
.timeoff-section {
  background: #1f2937;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.timeoff-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #111827;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  border: 1px solid #374151;
}

.timeoff-info {
  flex: 1;
}

.timeoff-dates {
  font-size: 0.875rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.timeoff-type {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.approved {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.denied {
  background: #fee2e2;
  color: #991b1b;
}

.timeoff-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
}

.btn-approve {
  padding: 0.5rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-approve:hover {
  background: #059669;
}

.btn-deny {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-deny:hover {
  background: #dc2626;
}

.availability-grid {
  display: grid;
  gap: 0.75rem;
}

.availability-day {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #111827;
  border-radius: 0.5rem;
  border: 1px solid #374151;
}

.day-name {
  font-weight: 600;
  min-width: 100px;
}

.availability-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.indicator-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
}

.indicator-dot.available {
  background: #10b981;
}

.indicator-dot.unavailable {
  background: #ef4444;
}

.availability-time {
  color: #9ca3af;
  font-size: 0.875rem;
}

.availability-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.availability-day-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #111827;
  border-radius: 0.5rem;
  border: 1px solid #374151;
}

.day-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 120px;
}

.day-label {
  font-weight: 500;
  cursor: pointer;
}

.form-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}

/* Task Styles */
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-item {
  padding: 1rem;
  background: #111827;
  border-radius: 0.5rem;
  border: 1px solid #374151;
  transition: all 0.2s;
}

.task-item.completed {
  opacity: 0.7;
  background: #0f1419;
}

.task-item.completed .task-title {
  text-decoration: line-through;
  color: #6b7280;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 1rem;
}

.task-main-info {
  display: flex;
  gap: 0.75rem;
  flex: 1;
}

.task-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.25rem;
  cursor: pointer;
}

.task-details {
  flex: 1;
}

.task-title {
  font-size: 1rem;
  font-weight: 600;
  color: #f3f4f6;
  margin-bottom: 0.25rem;
}

.task-description {
  font-size: 0.875rem;
  color: #9ca3af;
  margin: 0;
}

.task-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.priority-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.priority-badge.urgent {
  background: #fee2e2;
  color: #991b1b;
}

.priority-badge.high {
  background: #fed7aa;
  color: #9a3412;
}

.priority-badge.normal {
  background: #dbeafe;
  color: #1e40af;
}

.priority-badge.low {
  background: #e5e7eb;
  color: #374151;
}

.due-date {
  font-size: 0.75rem;
  color: #9ca3af;
}

.due-date.overdue {
  color: #ef4444;
  font-weight: 600;
}

.task-footer {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #374151;
}

.completion-info {
  font-size: 0.75rem;
  color: #10b981;
  font-style: italic;
}

.time-placeholder {
  flex: 1;
  padding: 0.5rem;
  color: #6b7280;
  font-style: italic;
}

.review-info {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.5rem;
}
</style>
