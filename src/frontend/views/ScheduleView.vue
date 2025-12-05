<template>
  <div class="app-container">
    <Sidebar />
    
    <div class="main-content">
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
        <!-- History Container -->
        <div class="card mb-6 history-container">
          <div class="card-header">
            <h3 class="card-title">History</h3>
            <div class="date-range-selector">
              <input type="date" v-model="historyStartDate" class="date-input" />
              <input type="date" v-model="historyEndDate" class="date-input" />
              <button @click="loadHistory" class="btn-primary-sm">Refresh</button>
            </div>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Hours</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in historyLogs" :key="log.id">
                  <td>{{ log.employee_name || log.full_name || 'Employee ' + log.employee_id }}</td>
                  <td>{{ formatTime(log.clock_in) }}</td>
                  <td>{{ log.clock_out ? formatTime(log.clock_out) : 'Active' }}</td>
                  <td>{{ formatHours(log.hours_worked) }}</td>
                  <td>{{ log.notes || '' }}</td>
                </tr>
                <tr v-if="historyLogs.length === 0">
                  <td colspan="5" class="text-center text-gray-500">No history found for selected dates.</td>
                </tr>
              </tbody>
            </table>
          </div>
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
        <!-- Labor Cost Summary -->
        <div class="labor-cost-summary">
          <div class="cost-card">
            <div class="cost-label">Weekly Labor Cost</div>
            <div class="cost-value">${{ weeklyLaborCost.toFixed(2) }}</div>
          </div>
          <div class="cost-card" v-for="day in weekDays" :key="`cost-${day.date}`">
            <div class="cost-label-sm">{{ day.name }}</div>
            <div class="cost-value-sm">${{ getDailyLaborCost(day.date).toFixed(2) }}</div>
            <div class="cost-hours">{{ getDailyLaborHours(day.date).toFixed(1) }}h</div>
          </div>
        </div>

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
    </div>

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
    
    <!-- Time Logs Modal -->
    <div v-if="showTimeLogs" class="modal-overlay" @click.self="closeTimeLogsModal()">
      <div class="modal">
        <div class="modal-header">
          <h2>Time Logs for {{ modalDate }}</h2>
          <button @click="closeTimeLogsModal" class="modal-close">×</button>
        </div>
        <div class="modal-content">
          <div v-if="timeLogsForModal.length === 0" class="empty-state">
            <p>No time logs found for this date.</p>
          </div>
          <table v-else class="time-table">
            <thead>
              <tr>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Hours</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in timeLogsForModal" :key="log.id">
                <td>{{ formatTime(log.clock_in) }}</td>
                <td>{{ log.clock_out ? formatTime(log.clock_out) : 'Active' }}</td>
                <td>{{ formatHours(log.hours_worked) }}</td>
                <td>{{ log.notes || '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Sidebar from '../components/Sidebar.vue';

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

// History state
const historyStartDate = ref('');
const historyEndDate = ref('');
const historyLogs = ref([]);
const weeklyTimeLogs = ref([]);

const loadWeeklyTimeLogs = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.businessId) return;
    
    const startDate = weekDays.value[0]?.date;
    const endDate = weekDays.value[6]?.date;
    
    if (!startDate || !endDate) return;
    
    const logs = await ipcRenderer.invoke('timelog:get-all', { 
      businessId: currentUser.businessId, 
      startDate, 
      endDate 
    });
    weeklyTimeLogs.value = Array.isArray(logs) ? logs : [];
  } catch (e) {
    console.error('Failed to load weekly time logs', e);
    weeklyTimeLogs.value = [];
  }
};

const loadHistory = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.businessId) return;
    const start = historyStartDate.value || null;
    const end = historyEndDate.value || null;
    const logs = await ipcRenderer.invoke('timelog:get-all', { businessId: currentUser.businessId, startDate: start, endDate: end });
    historyLogs.value = Array.isArray(logs) ? logs : [];
  } catch (e) {
    console.error('Failed to load history logs', e);
    historyLogs.value = [];
  }
};

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
    if (!weekDays.value || weekDays.value.length === 0) {
      console.warn('Week days not ready yet');
      return;
    }
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

// Parse a local datetime string in format 'YYYY-MM-DD HH:MM:SS' into a local Date
const parseLocalDateTime = (s) => {
  if (!s) return null;
  const str = String(s).trim();
  // match YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS
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

const formatTime = (timeString) => {
  const d = parseLocalDateTime(timeString) || new Date(timeString);
  if (!d || isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const calculateElapsedTime = (clockInTime) => {
  const start = parseLocalDateTime(clockInTime) || new Date(clockInTime);
  const now = currentTime.value || new Date();
  if (!start || isNaN(start.getTime())) return '';

  let diffMs = now.getTime() - start.getTime();
  if (isNaN(diffMs) || diffMs <= 0) return '0m';

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

// Labor cost calculations
const getDailyLaborHours = (date) => {
  // Calculate from actual time logs, not scheduled shifts
  const dayLogs = weeklyTimeLogs.value.filter(log => {
    if (!log.clock_in) return false;
    const logDate = log.clock_in.split(' ')[0];
    return logDate === date && log.clock_out; // Only count completed logs
  });
  
  return dayLogs.reduce((total, log) => {
    try {
      // Parse datetime strings properly
      const clockInStr = log.clock_in.replace(' ', 'T');
      const clockOutStr = log.clock_out.replace(' ', 'T');
      const clockIn = new Date(clockInStr);
      const clockOut = new Date(clockOutStr);
      
      // Validate dates
      if (isNaN(clockIn.getTime()) || isNaN(clockOut.getTime())) {
        console.error('Invalid date in time log:', log);
        return total;
      }
      
      const hours = Math.abs((clockOut - clockIn) / (1000 * 60 * 60));
      return total + hours;
    } catch (error) {
      console.error('Error calculating hours:', error, log);
      return total;
    }
  }, 0);
};

const getDailyLaborCost = (date) => {
  // Calculate from actual time logs, not scheduled shifts
  const dayLogs = weeklyTimeLogs.value.filter(log => {
    if (!log.clock_in) return false;
    const logDate = log.clock_in.split(' ')[0];
    return logDate === date && log.clock_out; // Only count completed logs
  });
  
  return dayLogs.reduce((total, log) => {
    try {
      const employee = employees.value.find(emp => emp.id === log.employee_id);
      const hourlyRate = employee?.hourly_rate || 0;
      
      // Parse datetime strings properly
      const clockInStr = log.clock_in.replace(' ', 'T');
      const clockOutStr = log.clock_out.replace(' ', 'T');
      const clockIn = new Date(clockInStr);
      const clockOut = new Date(clockOutStr);
      
      // Validate dates
      if (isNaN(clockIn.getTime()) || isNaN(clockOut.getTime())) {
        console.error('Invalid date in time log:', log);
        return total;
      }
      
      const hours = Math.abs((clockOut - clockIn) / (1000 * 60 * 60));
      return total + (hourlyRate * hours);
    } catch (error) {
      console.error('Error calculating cost:', error, log);
      return total;
    }
  }, 0);
};

const weeklyLaborCost = computed(() => {
  return weekDays.value.reduce((total, day) => {
    return total + getDailyLaborCost(day.date);
  }, 0);
});

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

// Time logs modal for day/employee
const showTimeLogs = ref(false);
const timeLogsForModal = ref([]);
const modalEmployee = ref(null);
const modalDate = ref(null);

const formatHours = (h) => {
  if (h === null || h === undefined) return '—';
  const n = Number(h) || 0;
  return (n < 0 ? 0 : n).toFixed(2);
};

const openTimeLogsModal = async (date, employeeId) => {
  try {
    modalEmployee.value = employeeId;
    modalDate.value = date;
    // fetch logs for that exact date
    const logs = await ipcRenderer.invoke('timelog:get-employee', {
      employeeId,
      startDate: date,
      endDate: date
    });
    timeLogsForModal.value = Array.isArray(logs) ? logs : [];
    showTimeLogs.value = true;
  } catch (e) {
    console.error('Failed to load time logs for modal', e);
    timeLogsForModal.value = [];
    showTimeLogs.value = true;
  }
};

const closeTimeLogsModal = () => {
  showTimeLogs.value = false;
  timeLogsForModal.value = [];
  modalEmployee.value = null;
  modalDate.value = null;
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
    // Load shifts without blocking - let it happen in background
    loadShifts().catch(err => console.error('Error reloading shifts:', err));
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
  loadWeeklyTimeLogs();
};

const nextWeek = () => {
  const newDate = new Date(currentWeekStart.value);
  newDate.setDate(newDate.getDate() + 7);
  currentWeekStart.value = newDate;
  loadShifts();
  loadWeeklyTimeLogs();
};

const goToToday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek);
  currentWeekStart.value = weekStart;
  loadShifts();
  loadWeeklyTimeLogs();
};

// Update current time every minute for elapsed time calculations
let timeInterval;

onMounted(() => {
  goToToday();
  loadEmployees();
  loadClockedInEmployees();
  loadWeeklyTimeLogs();
  // Initialize history date range to today and load
  const today = new Date().toISOString().split('T')[0];
  historyStartDate.value = today;
  historyEndDate.value = today;
  loadHistory();
  
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
.app-container {
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

.labor-cost-summary {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 0.75rem;
  overflow-x: auto;
}

.cost-card {
  flex: 0 0 auto;
  padding: 1rem 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 0.5rem;
  min-width: 150px;
}

.cost-card:first-child {
  min-width: 200px;
  border-color: rgba(59, 130, 246, 0.3);
  background: rgba(59, 130, 246, 0.1);
}

.cost-label {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.cost-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #10b981;
}

.cost-card:first-child .cost-value {
  color: #60a5fa;
}

.cost-label-sm {
  font-size: 0.625rem;
  color: #9ca3af;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.cost-value-sm {
  font-size: 1.125rem;
  font-weight: 600;
  color: #10b981;
  margin-bottom: 0.25rem;
}

.cost-hours {
  font-size: 0.75rem;
  color: #6b7280;
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
