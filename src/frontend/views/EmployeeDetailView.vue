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
                    <td>{{ log.hours_worked ? log.hours_worked.toFixed(2) : '—' }}</td>
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

const showNoteModal = ref(false);
const showContactModal = ref(false);
const showScheduleModal = ref(false);

const noteForm = ref({ noteType: 'general', noteText: '', rating: null });
const contactForm = ref({ name: '', relationship: '', phone: '', email: '' });
const scheduleForm = ref({
  0: { enabled: false, startTime: '09:00', endTime: '17:00' },
  1: { enabled: false, startTime: '09:00', endTime: '17:00' },
  2: { enabled: false, startTime: '09:00', endTime: '17:00' },
  3: { enabled: false, startTime: '09:00', endTime: '17:00' },
  4: { enabled: false, startTime: '09:00', endTime: '17:00' },
  5: { enabled: false, startTime: '09:00', endTime: '17:00' },
  6: { enabled: false, startTime: '09:00', endTime: '17:00' }
});

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
      loadTimeLogs()
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

const formatDateTime = (datetime) => {
  const d = new Date(datetime);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
</style>
