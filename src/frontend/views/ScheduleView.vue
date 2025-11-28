<template>
  <div class="schedule-page">
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

        <router-link to="/employees" class="nav-item">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>Employees</span>
        </router-link>

        <router-link to="/schedule" class="nav-item active">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Schedule</span>
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
      <header class="page-header">
        <div>
          <h1 class="page-title">Weekly Schedule</h1>
          <p class="page-subtitle">Manage employee shifts for the week</p>
        </div>
        <div class="header-actions">
          <button @click="previousWeek" class="btn-nav">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 20px; height: 20px;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span class="week-label">{{ weekLabel }}</span>
          <button @click="nextWeek" class="btn-nav">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 20px; height: 20px;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button @click="goToToday" class="btn-secondary">Today</button>
          <button @click="showAddShift = true" class="btn-primary">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Shift
          </button>
        </div>
      </header>

      <!-- Clock In/Out Section -->
      <div class="clock-section">
        <div class="clock-header">
          <h3 class="clock-title">Time Clock</h3>
          <button @click="refreshClockedIn" class="btn-icon-only">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 20px; height: 20px;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <!-- Currently Clocked In Employees -->
        <div v-if="clockedInEmployees.length > 0" class="clocked-in-list">
          <div v-for="emp in clockedInEmployees" :key="emp.employee_id" class="clocked-in-item">
            <div class="clocked-in-avatar">{{ getInitials(emp.full_name.split(' ')[0], emp.full_name.split(' ')[1] || '') }}</div>
            <div class="clocked-in-info">
              <div class="clocked-in-name">{{ emp.full_name }}</div>
              <div class="clocked-in-position">{{ emp.position }}</div>
              <div class="clocked-in-time">Clocked in: {{ formatTime(emp.clock_in) }}</div>
              <div class="clocked-in-duration">{{ calculateElapsedTime(emp.clock_in) }}</div>
            </div>
            <button @click="handleClockOut(emp.employee_id)" class="btn-clock-out">
              Clock Out
            </button>
          </div>
        </div>
        <div v-else class="empty-clock">
          <p>No employees currently clocked in</p>
        </div>

        <!-- Clock In Form -->
        <div class="clock-in-form">
          <select v-model="selectedEmployeeId" class="form-input" style="flex: 1;">
            <option value="">Select employee to clock in...</option>
            <option v-for="emp in availableEmployees" :key="emp.id" :value="emp.id">
              {{ emp.first_name }} {{ emp.last_name }} - {{ emp.role }}
            </option>
          </select>
          <button @click="handleClockIn" :disabled="!selectedEmployeeId" class="btn-primary">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Clock In
          </button>
        </div>
      </div>

      <!-- Schedule Grid -->
      <div class="schedule-container">
        <div class="schedule-grid">
          <!-- Header Row -->
          <div class="schedule-header">
            <div class="employee-column-header">Employee</div>
            <div v-for="day in weekDays" :key="day.date" class="day-header">
              <div class="day-name">{{ day.name }}</div>
              <div class="day-date">{{ day.dateStr }}</div>
            </div>
          </div>

          <!-- Employee Rows -->
          <div class="schedule-body">
            <div v-for="emp in employees" :key="emp.id" class="employee-row">
              <div class="employee-label">
                <div class="employee-avatar-small">{{ getInitials(emp.first_name, emp.last_name) }}</div>
                <div class="employee-info">
                  <div class="employee-name-text">{{ emp.first_name }} {{ emp.last_name }}</div>
                  <div class="employee-role-text">{{ emp.role }}</div>
                </div>
              </div>
              <div 
                v-for="day in weekDays" 
                :key="`${emp.id}-${day.date}`"
                class="day-cell"
                @click="openShiftModal(day, null, emp.id)"
              >
                <div 
                  v-for="shift in getShiftsForEmployee(emp.id, day.date)" 
                  :key="shift.id"
                  :class="['shift-card', getShiftClass(shift)]"
                  @click.stop="editShift(shift)"
                >
                  <div class="shift-time">{{ formatShiftTime(shift.start_time, shift.end_time) }}</div>
                  <div v-if="shift.role" class="shift-role">{{ shift.role }}</div>
                  <button @click.stop="deleteShift(shift.id)" class="shift-delete">×</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Add/Edit Shift Modal -->
    <div v-if="showAddShift" class="modal-overlay" @click.self="showAddShift = false">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingShift ? 'Edit Shift' : 'Add Shift' }}</h2>
          <button @click="closeShiftModal" class="modal-close">×</button>
        </div>
        <form @submit.prevent="saveShift" class="modal-content">
          <div class="form-group">
            <label class="form-label">Employee *</label>
            <select v-model="shiftForm.employeeId" class="form-input" required>
              <option value="">Select employee</option>
              <option v-for="emp in employees" :key="emp.id" :value="emp.id">
                {{ emp.first_name }} {{ emp.last_name }}
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input v-model="shiftForm.date" type="date" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">Role</label>
              <input v-model="shiftForm.role" type="text" class="form-input" placeholder="Server, Chef, etc." />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Start Time *</label>
              <input v-model="shiftForm.startTime" type="time" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">End Time *</label>
              <input v-model="shiftForm.endTime" type="time" class="form-input" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea v-model="shiftForm.notes" class="form-textarea" rows="3" placeholder="Any special instructions..."></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeShiftModal" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">{{ editingShift ? 'Update' : 'Add' }} Shift</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const { ipcRenderer } = window.require('electron');

const employees = ref([]);
const shifts = ref([]);
const clockedInEmployees = ref([]);
const selectedEmployeeId = ref('');
const currentWeekStart = ref(new Date());
const showAddShift = ref(false);
const editingShift = ref(null);
const currentTime = ref(new Date());

const shiftForm = ref({
  employeeId: '',
  date: '',
  startTime: '09:00',
  endTime: '17:00',
  role: '',
  notes: ''
});

// Calculate week days
const weekDays = computed(() => {
  const days = [];
  const start = new Date(currentWeekStart.value);
  start.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    days.push({
      name: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
      date: date.toISOString().split('T')[0],
      dateStr: `${date.getMonth() + 1}/${date.getDate()}`
    });
  }
  return days;
});

const weekLabel = computed(() => {
  const start = new Date(currentWeekStart.value);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
});

// Available employees (not currently clocked in)
const availableEmployees = computed(() => {
  const clockedInIds = clockedInEmployees.value.map(emp => emp.employee_id);
  return employees.value.filter(emp => !clockedInIds.includes(emp.id));
});

const loadEmployees = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    employees.value = await ipcRenderer.invoke('employee:get-all', currentUser.businessId);
    employees.value = employees.value.filter(emp => emp.status === 'active');
  } catch (error) {
    console.error('Error loading employees:', error);
  }
};

const loadShifts = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const startDate = weekDays.value[0].date;
    const endDate = weekDays.value[6].date;
    
    shifts.value = await ipcRenderer.invoke('schedule:get-shifts', {
      businessId: currentUser.businessId,
      startDate,
      endDate
    });
  } catch (error) {
    console.error('Error loading shifts:', error);
    shifts.value = [];
  }
};

const loadClockedInEmployees = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    clockedInEmployees.value = await ipcRenderer.invoke('timelog:get-clocked-in', currentUser.businessId);
  } catch (error) {
    console.error('Error loading clocked in employees:', error);
    clockedInEmployees.value = [];
  }
};

const refreshClockedIn = () => {
  loadClockedInEmployees();
};

const handleClockIn = async () => {
  if (!selectedEmployeeId.value) return;
  
  try {
    await ipcRenderer.invoke('timelog:clock-in', {
      employeeId: selectedEmployeeId.value,
      notes: null
    });
    
    selectedEmployeeId.value = '';
    await loadClockedInEmployees();
    alert('Clocked in successfully');
  } catch (error) {
    console.error('Error clocking in:', error);
    alert(error.message || 'Failed to clock in');
  }
};

const handleClockOut = async (employeeId) => {
  try {
    await ipcRenderer.invoke('timelog:clock-out', {
      employeeId,
      notes: null
    });
    
    await loadClockedInEmployees();
    alert('Clocked out successfully');
  } catch (error) {
    console.error('Error clocking out:', error);
    alert(error.message || 'Failed to clock out');
  }
};

const formatTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const calculateElapsedTime = (clockInTime) => {
  const start = new Date(clockInTime);
  const now = currentTime.value;
  const diffMs = now - start;
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const getInitials = (firstName, lastName) => {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
};

const getShiftsForEmployee = (employeeId, date) => {
  return shifts.value.filter(shift => 
    shift.employee_id === employeeId && shift.shift_date === date
  );
};

const formatShiftTime = (start, end) => {
  const formatTime = (time) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${m} ${suffix}`;
  };
  return `${formatTime(start)} - ${formatTime(end)}`;
};

const getShiftClass = (shift) => {
  const duration = calculateDuration(shift.start_time, shift.end_time);
  if (duration >= 8) return 'shift-long';
  if (duration >= 4) return 'shift-medium';
  return 'shift-short';
};

const calculateDuration = (start, end) => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
};

const openShiftModal = (day, hour, employeeId = null) => {
  shiftForm.value = {
    employeeId: employeeId || '',
    date: day.date,
    startTime: '09:00',
    endTime: '17:00',
    role: '',
    notes: ''
  };
  editingShift.value = null;
  showAddShift.value = true;
};

const editShift = (shift) => {
  shiftForm.value = {
    employeeId: shift.employee_id,
    date: shift.shift_date,
    startTime: shift.start_time,
    endTime: shift.end_time,
    role: shift.role || '',
    notes: shift.notes || ''
  };
  editingShift.value = shift;
  showAddShift.value = true;
};

const closeShiftModal = () => {
  showAddShift.value = false;
  editingShift.value = null;
};

const saveShift = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const shiftData = {
      employeeId: parseInt(shiftForm.value.employeeId),
      shiftDate: shiftForm.value.date,
      startTime: shiftForm.value.startTime,
      endTime: shiftForm.value.endTime,
      role: shiftForm.value.role,
      notes: shiftForm.value.notes
    };

    if (editingShift.value) {
      await ipcRenderer.invoke('schedule:update-shift', {
        businessId: currentUser.businessId,
        shiftId: editingShift.value.id,
        shiftData
      });
    } else {
      await ipcRenderer.invoke('schedule:create-shift', {
        businessId: currentUser.businessId,
        shiftData
      });
    }

    closeShiftModal();
    await loadShifts();
  } catch (error) {
    console.error('Error saving shift:', error);
    alert('Failed to save shift');
  }
};

const deleteShift = async (shiftId) => {
  if (!confirm('Delete this shift?')) return;
  
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    await ipcRenderer.invoke('schedule:delete-shift', {
      businessId: currentUser.businessId,
      shiftId
    });
    await loadShifts();
  } catch (error) {
    console.error('Error deleting shift:', error);
    alert('Failed to delete shift');
  }
};

const previousWeek = () => {
  const newDate = new Date(currentWeekStart.value);
  newDate.setDate(newDate.getDate() - 7);
  currentWeekStart.value = newDate;
  loadShifts();
};

const nextWeek = () => {
  const newDate = new Date(currentWeekStart.value);
  newDate.setDate(newDate.getDate() + 7);
  currentWeekStart.value = newDate;
  loadShifts();
};

const goToToday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek);
  currentWeekStart.value = weekStart;
  loadShifts();
};

// Update current time every minute for elapsed time calculations
let timeInterval;

onMounted(() => {
  goToToday();
  loadEmployees();
  loadClockedInEmployees();
  
  // Update time every minute
  timeInterval = setInterval(() => {
    currentTime.value = new Date();
  }, 60000); // Update every minute
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});
</script>

<style scoped>
.schedule-page {
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
  align-items: center;
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

.btn-nav {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #d1d5db;
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-nav:hover {
  background: rgba(255, 255, 255, 0.1);
}

.week-label {
  font-weight: 600;
  color: #f3f4f6;
  padding: 0 0.5rem;
  min-width: 180px;
  text-align: center;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 0.625rem 1.25rem;
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
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #d1d5db;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

/* Clock Section */
.clock-section {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.clock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.clock-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #f3f4f6;
  margin: 0;
}

.btn-icon-only {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #d1d5db;
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon-only:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: rotate(180deg);
}

.clocked-in-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.clocked-in-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.clocked-in-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  color: white;
  flex-shrink: 0;
}

.clocked-in-info {
  flex: 1;
}

.clocked-in-name {
  font-weight: 600;
  color: #f3f4f6;
  margin-bottom: 0.125rem;
}

.clocked-in-position {
  color: #9ca3af;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.clocked-in-time {
  color: #60a5fa;
  font-size: 0.75rem;
}

.clocked-in-duration {
  color: #10b981;
  font-size: 0.875rem;
  font-weight: 600;
  margin-top: 0.25rem;
}

.btn-clock-out {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-clock-out:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.5);
  color: #fecaca;
}

.empty-clock {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-style: italic;
  margin-bottom: 1.5rem;
}

.clock-in-form {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.schedule-container {
  overflow-x: auto;
}

.schedule-grid {
  min-width: 1200px;
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  overflow: hidden;
}

.schedule-header {
  display: grid;
  grid-template-columns: 200px repeat(7, 1fr);
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.employee-column-header {
  padding: 1rem;
  font-weight: 600;
  color: #9ca3af;
  font-size: 0.75rem;
  text-transform: uppercase;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.day-header {
  padding: 1rem;
  text-align: center;
  border-left: 1px solid rgba(255, 255, 255, 0.05);
}

.day-name {
  font-weight: 600;
  color: #f3f4f6;
  margin-bottom: 0.25rem;
}

.day-date {
  font-size: 0.75rem;
  color: #9ca3af;
}

.schedule-body {
  max-height: 600px;
  overflow-y: auto;
}

.employee-row {
  display: grid;
  grid-template-columns: 200px repeat(7, 1fr);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  min-height: 80px;
}

.employee-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

.employee-avatar-small {
  width: 40px;
  height: 40px;
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

.employee-info {
  flex: 1;
  min-width: 0;
}

.employee-name-text {
  font-weight: 600;
  color: #f3f4f6;
  font-size: 0.875rem;
  margin-bottom: 0.125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.employee-role-text {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: capitalize;
}

.day-cell {
  padding: 0.5rem;
  border-left: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.day-cell:hover {
  background: rgba(255, 255, 255, 0.03);
}

.shift-card {
  padding: 0.5rem;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 0.375rem;
  margin-bottom: 0.25rem;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.shift-card:hover {
  background: rgba(59, 130, 246, 0.3);
  transform: translateY(-2px);
}

.shift-card.shift-long {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.4);
}

.shift-card.shift-medium {
  background: rgba(245, 158, 11, 0.2);
  border-color: rgba(245, 158, 11, 0.4);
}

.shift-time {
  font-weight: 600;
  font-size: 0.75rem;
  color: #f3f4f6;
  margin-bottom: 0.125rem;
}

.shift-role {
  font-size: 0.625rem;
  color: #9ca3af;
  text-transform: capitalize;
}

.shift-delete {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(239, 68, 68, 0.8);
  color: white;
  border: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.shift-card:hover .shift-delete {
  opacity: 1;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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
</style>
