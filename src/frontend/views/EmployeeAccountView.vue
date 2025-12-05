<template>
  <div class="employee-account-page">
    <!-- Add Sidebar -->
    <Sidebar />
    
    <!-- Main Content with proper margin for sidebar -->
    <div class="employee-content">
    <!-- Simple Header -->
    <header class="simple-header">
      <div class="header-content">
        <h1 class="employee-greeting">Hi, {{ employeeName }}!</h1>
        <div class="header-actions">
          <span class="role-badge">{{ userRole }}</span>
          <button @click="handleLogout" class="btn-logout">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 18px; height: 18px;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </header>

    <main class="main-container">
      <!-- Quick Actions -->
      <div class="quick-actions-grid">
        <!-- Clock In/Out Card -->
        <div class="action-card clock-card">
          <div class="card-icon clock-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="card-content">
            <h3>Time Clock</h3>
            <div v-if="isClockedIn" class="status-info">
              <p class="status-text">Currently clocked in</p>
              <p class="elapsed-time">{{ elapsedTime }}</p>
              <button @click="handleClockOut" class="btn-action btn-clock-out">Clock Out</button>
            </div>
            <div v-else class="status-info">
              <p class="status-text">Not clocked in</p>
              <button @click="handleClockIn" class="btn-action btn-clock-in">Clock In</button>
            </div>
          </div>
        </div>

        <!-- Today's Schedule Card -->
        <div class="action-card schedule-card">
          <div class="card-icon schedule-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="card-content">
            <h3>Today's Schedule</h3>
            <div v-if="todayShifts.length === 0" class="empty-state-sm">
              <p>No shifts scheduled today</p>
            </div>
            <div v-else class="shifts-list">
              <div v-for="shift in todayShifts" :key="shift.id" class="shift-item">
                <span class="shift-time">{{ formatShiftTime(shift.start_time, shift.end_time) }}</span>
                <span v-if="shift.role" class="shift-role-tag">{{ shift.role }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pending Tasks Card -->
        <div class="action-card tasks-card">
          <div class="card-icon tasks-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div class="card-content">
            <h3>My Tasks ({{ pendingTasks.length }})</h3>
            <div v-if="pendingTasks.length === 0" class="empty-state-sm">
              <p>No pending tasks</p>
            </div>
            <div v-else class="tasks-list">
              <div v-for="task in pendingTasks.slice(0, 3)" :key="task.id" class="task-item">
                <input type="checkbox" @change="completeTask(task.id)" class="task-checkbox" />
                <div class="task-info">
                  <span class="task-title">{{ task.title }}</span>
                  <span v-if="task.due_date" class="task-due">Due: {{ formatDate(task.due_date) }}</span>
                </div>
                <span v-if="task.priority === 'urgent' || task.priority === 'high'" class="priority-badge">{{ task.priority }}</span>
              </div>
              <button v-if="pendingTasks.length > 3" @click="showAllTasks = true" class="btn-view-more">View all tasks</button>
            </div>
          </div>
        </div>

        <!-- Announcements Card -->
        <div class="action-card announcements-card">
          <div class="card-icon announcements-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <div class="card-content">
            <h3>Announcements</h3>
            <div v-if="announcements.length === 0" class="empty-state-sm">
              <p>No new announcements</p>
            </div>
            <div v-else class="announcements-list">
              <div v-for="announcement in announcements.slice(0, 2)" :key="announcement.id" class="announcement-item">
                <div class="announcement-header">
                  <span class="announcement-title">{{ announcement.title }}</span>
                  <span v-if="announcement.priority === 'urgent'" class="priority-badge urgent">URGENT</span>
                </div>
                <p class="announcement-message">{{ announcement.message }}</p>
                <span class="announcement-date">{{ formatDateTime(announcement.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Weekly Schedule Section -->
      <section class="section-card">
        <h2 class="section-title">My Weekly Schedule</h2>
        <div class="week-nav">
          <button @click="previousWeek" class="btn-week-nav">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 20px; height: 20px;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span class="week-label">{{ weekLabel }}</span>
          <button @click="nextWeek" class="btn-week-nav">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 20px; height: 20px;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div class="weekly-schedule-grid">
          <div v-for="day in weekDays" :key="day.date" class="day-column">
            <div class="day-header-simple">
              <div class="day-name">{{ day.fullName }}</div>
              <div class="day-date">{{ day.dateStr }}</div>
            </div>
            <div class="day-shifts">
              <div v-if="getShiftsForDay(day.date).length === 0" class="no-shift">
                Off
              </div>
              <div v-else v-for="shift in getShiftsForDay(day.date)" :key="shift.id" class="employee-shift">
                <div class="shift-time-display">{{ formatShiftTime(shift.start_time, shift.end_time) }}</div>
                <div v-if="shift.role" class="shift-role-display">{{ shift.role }}</div>
                <div v-if="shift.notes" class="shift-notes-display">{{ shift.notes }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Hours Summary Section -->
      <section class="section-card">
        <h2 class="section-title">Hours Summary</h2>
        <div class="hours-period-selector">
          <button 
            v-for="period in ['This Week', 'Last Week', 'This Month']" 
            :key="period"
            @click="selectedPeriod = period; loadTimeLogs();"
            :class="['period-btn', { active: selectedPeriod === period }]"
          >
            {{ period }}
          </button>
        </div>
        <div class="hours-stats">
          <div class="stat-card">
            <div class="stat-label">Total Hours</div>
            <div class="stat-value">{{ totalHours }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Regular Hours</div>
            <div class="stat-value">{{ regularHours }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Overtime Hours</div>
            <div class="stat-value">{{ overtimeHours }}</div>
          </div>
        </div>
      </section>

      <!-- Time History Section -->
      <section class="section-card">
        <h2 class="section-title">Time History ({{ selectedPeriod }})</h2>
        <div v-if="timeLogs.length === 0" class="empty-state">
          <p>No time logs for this period</p>
        </div>
        <div v-else class="time-logs-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in timeLogs" :key="log.id">
                <td>{{ formatDate(log.clock_in) }}</td>
                <td>{{ formatTime(log.clock_in) }}</td>
                <td>{{ log.clock_out ? formatTime(log.clock_out) : 'Still clocked in' }}</td>
                <td>{{ log.clock_out ? calculateHours(log.clock_in, log.clock_out) : '-' }}</td>
                <td>
                  <span :class="['status-badge', log.clock_out ? 'completed' : 'active']">
                    {{ log.clock_out ? 'Completed' : 'Active' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <!-- All Tasks Modal -->
    <div v-if="showAllTasks" class="modal-overlay" @click.self="showAllTasks = false">
      <div class="modal">
        <div class="modal-header">
          <h2>My Tasks</h2>
          <button @click="showAllTasks = false" class="modal-close">×</button>
        </div>
        <div class="modal-content">
          <div v-if="allTasks.length === 0" class="empty-state">
            <p>No tasks assigned</p>
          </div>
          <div v-else class="tasks-full-list">
            <div v-for="task in allTasks" :key="task.id" class="task-full-item">
              <input 
                type="checkbox" 
                :checked="task.status === 'completed'"
                @change="completeTask(task.id)" 
                class="task-checkbox-large" 
              />
              <div class="task-full-info">
                <div class="task-full-header">
                  <span class="task-full-title">{{ task.title }}</span>
                  <span v-if="task.priority === 'urgent' || task.priority === 'high'" class="priority-badge">{{ task.priority }}</span>
                </div>
                <p v-if="task.description" class="task-description">{{ task.description }}</p>
                <div class="task-meta">
                  <span v-if="task.task_type" class="task-type-tag">{{ task.task_type }}</span>
                  <span v-if="task.due_date" class="task-due-full">Due: {{ formatDate(task.due_date) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div><!-- Close employee-content -->
  </div><!-- Close employee-account-page -->
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import Sidebar from '../components/Sidebar.vue';

const router = useRouter();
const { ipcRenderer } = window.require('electron');

const currentUser = ref(null);
const employeeData = ref(null);
const isClockedIn = ref(false);
const activeTimeLog = ref(null);
const currentTime = ref(new Date());
const todayShifts = ref([]);
const weeklyShifts = ref([]);
const pendingTasks = ref([]);
const allTasks = ref([]);
const announcements = ref([]);
const timeLogs = ref([]);
const currentWeekStart = ref(new Date());
const selectedPeriod = ref('This Week');
const showAllTasks = ref(false);

let timeInterval = null;
let clockStatusInterval = null;

const employeeName = computed(() => {
  if (!employeeData.value) return '';
  return `${employeeData.value.first_name} ${employeeData.value.last_name}`;
});

const userRole = computed(() => {
  return employeeData.value?.role || 'Staff';
});

const elapsedTime = computed(() => {
  if (!activeTimeLog.value || !activeTimeLog.value.clock_in) return '0h 0m';
  
  const start = new Date(activeTimeLog.value.clock_in);
  const now = currentTime.value;
  const diffMs = now - start;
  
  if (diffMs < 0) return '0h 0m';
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
});

const weekDays = computed(() => {
  const days = [];
  const start = new Date(currentWeekStart.value);
  start.setHours(0, 0, 0, 0);
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    days.push({
      fullName: dayNames[date.getDay()],
      name: dayNames[date.getDay()].slice(0, 3),
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

const totalHours = computed(() => {
  const logs = getTimeLogsForPeriod();
  const total = logs.reduce((sum, log) => sum + (log.hours_worked || 0), 0);
  return total.toFixed(1);
});

const regularHours = computed(() => {
  const total = parseFloat(totalHours.value);
  return total > 40 ? '40.0' : total.toFixed(1);
});

const overtimeHours = computed(() => {
  const total = parseFloat(totalHours.value);
  return total > 40 ? (total - 40).toFixed(1) : '0.0';
});

const loadEmployeeData = async () => {
  try {
    const stored = JSON.parse(localStorage.getItem('currentUser'));
    if (!stored) {
      router.push('/login');
      return;
    }
    
    // Handle old localStorage without userId (backward compatibility)
    if (!stored.userId && stored.id) {
      stored.userId = stored.id;
    }
    
    // If still no userId, force re-login
    if (!stored.userId) {
      alert('Please log in again to update your session.');
      localStorage.clear();
      router.push('/login');
      return;
    }
    
    currentUser.value = stored;
    
    console.log('Current user:', stored);
    
    // Get employee data linked to this user
    const employees = await ipcRenderer.invoke('employee:get-all', stored.businessId);
    console.log('All employees:', employees);
    console.log('Looking for user_id:', stored.userId);
    
    employeeData.value = employees.find(emp => emp.user_id === stored.userId);
    console.log('Found employee:', employeeData.value);
    
    if (!employeeData.value) {
      alert('Employee data not found. User ID: ' + stored.userId + ', Employees count: ' + employees.length);
      return;
    }
    
    // Load clock status
    await checkClockStatus();
    
    // Load today's shifts
    await loadTodayShifts();
    
    // Load weekly shifts
    await loadWeeklyShifts();
    
    // Load tasks
    await loadTasks();
    
    // Load announcements
    await loadAnnouncements();
    
    // Load time logs
    await loadTimeLogs();
    
  } catch (error) {
    console.error('Error loading employee data:', error);
  }
};

const checkClockStatus = async () => {
  try {
    console.log('Checking clock status for employee:', employeeData.value.id);
    isClockedIn.value = await ipcRenderer.invoke('timelog:is-clocked-in', employeeData.value.id);
    console.log('Clock status result:', isClockedIn.value);
    
    if (isClockedIn.value) {
      // Get the active time log
      const logs = await ipcRenderer.invoke('timelog:get-employee', {
        employeeId: employeeData.value.id,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      });
      console.log('Active time logs:', logs);
      
      activeTimeLog.value = logs.find(log => !log.clock_out);
      console.log('Active time log found:', activeTimeLog.value);
    }
  } catch (error) {
    console.error('Error checking clock status:', error);
  }
};

const handleClockIn = async () => {
  try {
    if (!employeeData.value || !employeeData.value.id) {
      alert('Employee data not loaded. Please refresh the page.');
      return;
    }
    
    await ipcRenderer.invoke('timelog:clock-in', {
      employeeId: employeeData.value.id,
      notes: null
    });
    
    await checkClockStatus();
    alert('Clocked in successfully');
  } catch (error) {
    console.error('Error clocking in:', error);
    alert(error.message || 'Failed to clock in');
  }
};

const handleClockOut = async () => {
  try {
    if (!employeeData.value || !employeeData.value.id) {
      alert('Employee data not loaded. Please refresh the page.');
      return;
    }
    await ipcRenderer.invoke('timelog:clock-out', {
      employeeId: employeeData.value.id,
      notes: null
    });
    
    isClockedIn.value = false;
    activeTimeLog.value = null;
    await loadTimeLogs();
    alert('Clocked out successfully');
  } catch (error) {
    console.error('Error clocking out:', error);
    alert(error.message || 'Failed to clock out');
  }
};

const loadTodayShifts = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const shifts = await ipcRenderer.invoke('schedule:get-shifts', {
      businessId: currentUser.value.businessId,
      startDate: today,
      endDate: today
    });
    
    todayShifts.value = shifts.filter(shift => shift.employee_id === employeeData.value.id);
  } catch (error) {
    console.error('Error loading today shifts:', error);
  }
};

const loadWeeklyShifts = async () => {
  try {
    if (!employeeData.value || !employeeData.value.id) {
      console.warn('Employee data not loaded yet, skipping shift load');
      return;
    }
    
    const startDate = weekDays.value[0].date;
    const endDate = weekDays.value[6].date;
    console.log('Loading shifts for employee:', employeeData.value.id, 'from', startDate, 'to', endDate);
    
    const shifts = await ipcRenderer.invoke('schedule:get-shifts', {
      businessId: currentUser.value.businessId,
      startDate,
      endDate
    });
    console.log('All shifts returned:', shifts.length, shifts);
    
    weeklyShifts.value = shifts.filter(shift => shift.employee_id === employeeData.value.id);
    console.log(`Filtered ${weeklyShifts.value.length} shifts for employee ${employeeData.value.id}`, weeklyShifts.value);
  } catch (error) {
    console.error('Error loading weekly shifts:', error);
  }
};

const loadTasks = async () => {
  try {
    allTasks.value = await ipcRenderer.invoke('tasks:get-employee', {
      employeeId: employeeData.value.id,
      status: null
    });
    
    pendingTasks.value = allTasks.value.filter(task => task.status === 'pending');
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
};

const loadAnnouncements = async () => {
  try {
    if (!employeeData.value) {
      console.error('Cannot load announcements: employeeData is null');
      return;
    }
    if (!employeeData.value.role) {
      console.error('Cannot load announcements: employee role is undefined. Employee data:', employeeData.value);
      return;
    }
    
    console.log('==== LOADING ANNOUNCEMENTS ====');
    console.log('Employee role:', employeeData.value.role);
    console.log('Business ID:', currentUser.value.businessId);
    
    announcements.value = await ipcRenderer.invoke('announcements:get-for-role', {
      businessId: currentUser.value.businessId,
      role: employeeData.value.role
    });
    
    console.log('Announcements received:', announcements.value.length);
    if (announcements.value.length > 0) {
      console.log('Announcements:', announcements.value);
    } else {
      console.warn('No announcements returned from server');
    }
    console.log('==== END LOADING ANNOUNCEMENTS ====');
  } catch (error) {
    console.error('Error loading announcements:', error);
  }
};

const loadTimeLogs = async () => {
  try {
    const startDate = getStartDateForPeriod('This Month');
    const endDate = new Date().toISOString().split('T')[0];
    
    timeLogs.value = await ipcRenderer.invoke('timelog:get-employee', {
      employeeId: employeeData.value.id,
      startDate,
      endDate
    });
  } catch (error) {
    console.error('Error loading time logs:', error);
  }
};

const completeTask = async (taskId) => {
  try {
    await ipcRenderer.invoke('tasks:complete', {
      taskId,
      completedBy: currentUser.value.userId
    });
    
    await loadTasks();
  } catch (error) {
    console.error('Error completing task:', error);
    alert('Failed to complete task');
  }
};

const getShiftsForDay = (date) => {
  return weeklyShifts.value.filter(shift => shift.shift_date === date);
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

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const calculateHours = (clockIn, clockOut) => {
  if (!clockIn || !clockOut) return '0.0';
  const start = new Date(clockIn);
  const end = new Date(clockOut);
  const hours = (end - start) / (1000 * 60 * 60);
  return hours.toFixed(1);
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const previousWeek = () => {
  const newStart = new Date(currentWeekStart.value);
  newStart.setDate(newStart.getDate() - 7);
  currentWeekStart.value = newStart;
  loadWeeklyShifts();
};

const nextWeek = () => {
  const newStart = new Date(currentWeekStart.value);
  newStart.setDate(newStart.getDate() + 7);
  currentWeekStart.value = newStart;
  loadWeeklyShifts();
};

const getStartDateForPeriod = (period) => {
  const now = new Date();
  
  if (period === 'This Week') {
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    return start.toISOString().split('T')[0];
  }
  
  if (period === 'Last Week') {
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day - 7);
    return start.toISOString().split('T')[0];
  }
  
  if (period === 'This Month') {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  }
  
  return now.toISOString().split('T')[0];
};

const getTimeLogsForPeriod = () => {
  const startDate = getStartDateForPeriod(selectedPeriod.value);
  const endDate = new Date().toISOString().split('T')[0];
  
  return timeLogs.value.filter(log => {
    const logDate = log.clock_in.split(' ')[0];
    return logDate >= startDate && logDate <= endDate;
  });
};

const handleLogout = async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (token) {
      await ipcRenderer.invoke('logout', token);
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    router.push('/login');
  } catch (error) {
    console.error('Logout error:', error);
    // Still navigate to login even if logout fails
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    router.push('/login');
  }
};

// Set current week start to Sunday of this week
const initializeWeek = () => {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  currentWeekStart.value = start;
};

onMounted(() => {
  initializeWeek();
  loadEmployeeData();
  
  // Update time every minute
  timeInterval = setInterval(() => {
    currentTime.value = new Date();
  }, 60000);
  
  // Refresh clock status every 5 seconds for better sync
  clockStatusInterval = setInterval(() => {
    console.log('[Interval] Clock status check triggered, employeeData:', !!employeeData.value);
    if (employeeData.value) {
      checkClockStatus();
    }
  }, 5000);
  
  // Also reload time logs periodically
  const timeLogsInterval = setInterval(() => {
    console.log('[Interval] Time logs refresh triggered, employeeData:', !!employeeData.value);
    if (employeeData.value) {
      loadTimeLogs();
    }
  }, 10000);
  
  // Reload shifts, tasks, and announcements every 30 seconds for real-time sync
  const dataRefreshInterval = setInterval(() => {
    console.log('[Interval] Data refresh triggered (shifts/tasks/announcements), employeeData:', !!employeeData.value);
    if (employeeData.value) {
      loadWeeklyShifts();
      loadTasks();
      loadAnnouncements();
    }
  }, 30000);
  
  // Store interval IDs for cleanup
  window.employeeIntervals = { timeInterval, clockStatusInterval, timeLogsInterval, dataRefreshInterval };
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
  if (clockStatusInterval) {
    clearInterval(clockStatusInterval);
  }
  if (window.employeeIntervals) {
    Object.values(window.employeeIntervals).forEach(interval => {
      if (interval) clearInterval(interval);
    });
  }
});

// Watch for period changes to reload time logs
watch(selectedPeriod, () => {
  if (employeeData.value) {
    loadTimeLogs();
  }
});
</script>

<style scoped>
.employee-account-page {
  display: flex;
  min-height: 100vh;
  background: #0f1419;
  color: #d1d5db;
}

.employee-content {
  flex: 1;
  margin-left: 240px;
  min-height: 100vh;
  overflow-y: auto;
  max-height: 100vh;
}

.simple-header {
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem 2rem;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.employee-greeting {
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.role-badge {
  padding: 0.5rem 1rem;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 0.5rem;
  color: #60a5fa;
  font-weight: 600;
  font-size: 0.875rem;
}

.btn-logout {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.3);
}

.main-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.action-card {
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  transition: all 0.2s;
}

.action-card:hover {
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateY(-2px);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon svg {
  width: 24px;
  height: 24px;
}

.clock-icon {
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #60a5fa;
}

.schedule-icon {
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10b981;
}

.tasks-icon {
  background: rgba(245, 158, 11, 0.2);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fbbf24;
}

.announcements-icon {
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #a78bfa;
}

.card-content {
  flex: 1;
}

.card-content h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: #f3f4f6;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.status-text {
  color: #9ca3af;
  margin: 0;
}

.elapsed-time {
  font-size: 1.5rem;
  font-weight: 700;
  color: #10b981;
  margin: 0;
}

.btn-action {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  margin-top: 0.5rem;
}

.btn-clock-in {
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10b981;
}

.btn-clock-in:hover {
  background: rgba(16, 185, 129, 0.3);
}

.btn-clock-out {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.btn-clock-out:hover {
  background: rgba(239, 68, 68, 0.3);
}

.empty-state-sm {
  color: #6b7280;
  font-style: italic;
  padding: 0.5rem 0;
}

.shifts-list, .tasks-list, .announcements-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.shift-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.5rem;
}

.shift-time {
  font-weight: 600;
  color: #f3f4f6;
}

.shift-role-tag {
  padding: 0.25rem 0.5rem;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: #60a5fa;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.5rem;
}

.task-checkbox {
  margin-top: 0.25rem;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.task-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.task-title {
  font-weight: 500;
  color: #f3f4f6;
}

.task-due {
  font-size: 0.75rem;
  color: #9ca3af;
}

.priority-badge {
  padding: 0.25rem 0.5rem;
  background: rgba(239, 68, 68, 0.2);
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 600;
  color: #fca5a5;
  text-transform: uppercase;
}

.priority-badge.urgent {
  background: rgba(239, 68, 68, 0.3);
  color: #fee2e2;
}

.announcement-item {
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.5rem;
  border-left: 3px solid rgba(139, 92, 246, 0.5);
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.announcement-title {
  font-weight: 600;
  color: #f3f4f6;
}

.announcement-message {
  color: #d1d5db;
  margin: 0.5rem 0;
  font-size: 0.875rem;
}

.announcement-date {
  font-size: 0.75rem;
  color: #6b7280;
}

.btn-view-more {
  padding: 0.5rem 1rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border-radius: 0.5rem;
  cursor: pointer;
  width: 100%;
  margin-top: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-view-more:hover {
  background: rgba(59, 130, 246, 0.2);
}

.section-card {
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1.5rem 0;
  color: #f3f4f6;
}

.week-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.btn-week-nav {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #d1d5db;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-week-nav:hover {
  background: rgba(255, 255, 255, 0.1);
}

.week-label {
  font-weight: 600;
  color: #f3f4f6;
}

.weekly-schedule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.day-column {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  overflow: hidden;
}

.day-header-simple {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
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

.day-shifts {
  padding: 1rem;
  min-height: 100px;
}

.no-shift {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  padding: 1rem 0;
}

.employee-shift {
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
}

.shift-time-display {
  font-weight: 600;
  color: #60a5fa;
  margin-bottom: 0.25rem;
}

.shift-role-display {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 0.25rem;
}

.shift-notes-display {
  font-size: 0.75rem;
  color: #d1d5db;
  font-style: italic;
}

.hours-period-selector {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.period-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #9ca3af;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.period-btn.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.3);
  color: #60a5fa;
}

.period-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.hours-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  text-align: center;
}

.stat-label {
  font-size: 0.875rem;
  color: #9ca3af;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #60a5fa;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal {
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #f3f4f6;
}

.modal-close {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  line-height: 1;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #f3f4f6;
}

.modal-content {
  padding: 1.5rem;
  overflow-y: auto;
}

.tasks-full-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-full-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
}

.task-checkbox-large {
  width: 20px;
  height: 20px;
  margin-top: 0.25rem;
  cursor: pointer;
}

.task-full-info {
  flex: 1;
}

.task-full-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.task-full-title {
  font-weight: 600;
  color: #f3f4f6;
}

.task-description {
  color: #d1d5db;
  margin: 0.5rem 0;
  font-size: 0.875rem;
}

.task-meta {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.task-type-tag {
  padding: 0.25rem 0.5rem;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: #60a5fa;
}

.task-due-full {
  font-size: 0.75rem;
  color: #9ca3af;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-style: italic;
}

/* Time logs table */
.time-logs-table {
  overflow-x: auto;
}

.time-logs-table table {
  width: 100%;
  border-collapse: collapse;
}

.time-logs-table th {
  text-align: left;
  padding: 0.75rem;
  background: rgba(30, 41, 59, 0.5);
  color: #94a3b8;
  font-weight: 600;
  font-size: 0.875rem;
  border-bottom: 2px solid rgba(59, 130, 246, 0.2);
}

.time-logs-table td {
  padding: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
}

.time-logs-table tr:hover {
  background: rgba(59, 130, 246, 0.05);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.status-badge.completed {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}
</style>

