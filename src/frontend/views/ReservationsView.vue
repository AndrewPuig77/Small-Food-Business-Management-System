<template>
  <div class="app-container">
    <Sidebar />
    
    <div class="reservations-view">
      <!-- Header with Settings Button -->
      <div class="view-header">
        <h1>Reservations</h1>
        <div v-if="!settings.enabled" class="alert alert-info">
          <span>Reservation system is currently disabled. </span>
          <button v-if="canManageSettings" @click="showSettingsModal = true" class="btn-link">Enable Now</button>
        </div>
        <button v-if="canManageSettings" @click="showSettingsModal = true" class="btn-secondary">
          Settings
        </button>
      </div>

    <!-- Main Content (only show if reservations enabled) -->
    <div v-if="settings.enabled" class="reservations-content">
      <!-- Date Selector -->
      <div class="date-selector">
        <button @click="previousDay" class="btn-icon">←</button>
        <input 
          type="date" 
          v-model="selectedDate" 
          @change="loadReservationsForDate"
          class="date-input"
        />
        <button @click="nextDay" class="btn-icon">→</button>
        <button @click="goToToday" class="btn-secondary">Today</button>
      </div>

      <!-- Time Slot Grid -->
      <div class="time-slots-section">
        <h2>Available Time Slots - {{ formattedDate }}</h2>
        <div class="time-slots-grid">
          <div 
            v-for="slot in timeSlots" 
            :key="slot.time"
            :class="['time-slot', { 'available': slot.available, 'booked': !slot.available }]"
            @click="slot.available && openNewReservationModal(slot.time)"
          >
            <div class="slot-time">{{ slot.time }}</div>
            <div class="slot-status">
              {{ slot.available ? `${slot.availableCapacity}/${settings.capacity} tables` : 'Fully Booked' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Reservations List -->
      <div class="reservations-list-section">
        <div class="section-header">
          <h2>Reservations for {{ formattedDate }}</h2>
          <button @click="openNewReservationModal()" class="btn-primary">+ New Reservation</button>
        </div>

        <div v-if="reservations.length === 0" class="empty-state">
          <p>No reservations for this date</p>
        </div>

        <div v-else class="reservations-list">
          <div v-for="reservation in reservations" :key="reservation.id" class="reservation-card">
            <div class="reservation-info">
              <div class="reservation-header">
                <h3>{{ reservation.guest_name || getCustomerName(reservation.customer_id) }}</h3>
                <span :class="['status-badge', reservation.status]">{{ reservation.status }}</span>
              </div>
              <div class="reservation-details">
                <div><strong>Time:</strong> {{ reservation.reservation_time }}</div>
                <div><strong>Party Size:</strong> {{ reservation.party_size }} guests</div>
                <div v-if="reservation.table_number"><strong>Table:</strong> {{ reservation.table_number }}</div>
                <div v-if="reservation.guest_phone"><strong>Phone:</strong> {{ reservation.guest_phone }}</div>
                <div v-if="reservation.guest_email"><strong>Email:</strong> {{ reservation.guest_email }}</div>
                <div v-if="reservation.special_requests"><strong>Special Requests:</strong> {{ reservation.special_requests }}</div>
              </div>
            </div>
            <div class="reservation-actions">
              <button 
                v-if="reservation.status === 'pending'" 
                @click="updateStatus(reservation.id, 'confirmed')" 
                class="btn-success btn-sm"
              >
                Confirm
              </button>
              <button 
                v-if="reservation.status === 'confirmed'" 
                @click="updateStatus(reservation.id, 'seated')" 
                class="btn-info btn-sm"
              >
                Seated
              </button>
              <button 
                v-if="reservation.status === 'seated'" 
                @click="updateStatus(reservation.id, 'completed')" 
                class="btn-success btn-sm"
              >
                Complete
              </button>
              <button 
                v-if="['pending', 'confirmed'].includes(reservation.status)" 
                @click="updateStatus(reservation.id, 'cancelled')" 
                class="btn-danger btn-sm"
              >
                Cancel
              </button>
              <button @click="editReservation(reservation)" class="btn-secondary btn-sm">Edit</button>
              <button @click="deleteReservation(reservation.id)" class="btn-danger btn-sm">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <div v-if="showSettingsModal" class="modal-overlay" @click.self="showSettingsModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Reservation Settings</h2>
          <button @click="showSettingsModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="settingsForm.enabled" />
              <span>Enable Reservation System</span>
            </label>
          </div>

          <div v-if="settingsForm.enabled" class="settings-form">
            <div class="form-group">
              <label>Maximum Table Capacity per Time Slot</label>
              <input type="number" v-model.number="settingsForm.capacity" min="1" class="form-control" />
              <small>Number of tables/parties that can be seated at the same time</small>
            </div>

            <div class="form-group">
              <label>Time Slot Interval (minutes)</label>
              <select v-model.number="settingsForm.intervalMinutes" class="form-control">
                <option :value="15">15 minutes</option>
                <option :value="30">30 minutes</option>
                <option :value="60">60 minutes</option>
                <option :value="90">90 minutes</option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Opening Hour</label>
                <select v-model.number="settingsForm.openingHour" class="form-control">
                  <option v-for="hour in 24" :key="hour" :value="hour - 1">
                    {{ formatHour(hour - 1) }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>Closing Hour</label>
                <select v-model.number="settingsForm.closingHour" class="form-control">
                  <option v-for="hour in 24" :key="hour" :value="hour">
                    {{ formatHour(hour) }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showSettingsModal = false" class="btn-secondary">Cancel</button>
          <button @click="saveSettings" class="btn-primary">Save Settings</button>
        </div>
      </div>
    </div>

    <!-- New/Edit Reservation Modal -->
    <div v-if="showReservationModal" class="modal-overlay" @click.self="showReservationModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingReservation ? 'Edit Reservation' : 'New Reservation' }}</h2>
          <button @click="showReservationModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Guest Name *</label>
            <input type="text" v-model="reservationForm.guest_name" class="form-control" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Phone</label>
              <input type="tel" v-model="reservationForm.guest_phone" class="form-control" />
            </div>

            <div class="form-group">
              <label>Email</label>
              <input type="email" v-model="reservationForm.guest_email" class="form-control" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Date *</label>
              <input type="date" v-model="reservationForm.reservation_date" class="form-control" required />
            </div>

            <div class="form-group">
              <label>Time *</label>
              <input type="time" v-model="reservationForm.reservation_time" class="form-control" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Party Size *</label>
              <input type="number" v-model.number="reservationForm.party_size" min="1" class="form-control" required />
            </div>

            <div class="form-group">
              <label>Table Number</label>
              <input type="text" v-model="reservationForm.table_number" class="form-control" />
            </div>
          </div>

          <div class="form-group">
            <label>Special Requests</label>
            <textarea v-model="reservationForm.special_requests" class="form-control" rows="3"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showReservationModal = false" class="btn-secondary">Cancel</button>
          <button @click="saveReservation" class="btn-primary">
            {{ editingReservation ? 'Update' : 'Create' }} Reservation
          </button>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script>
import Sidebar from '../components/Sidebar.vue';

export default {
  name: 'ReservationsView',
  components: {
    Sidebar
  },
  data() {
    return {
      settings: {
        enabled: false,
        capacity: 10,
        intervalMinutes: 30,
        openingHour: 11,
        closingHour: 22
      },
      settingsForm: {
        enabled: false,
        capacity: 10,
        intervalMinutes: 30,
        openingHour: 11,
        closingHour: 22
      },
      selectedDate: new Date().toISOString().split('T')[0],
      reservations: [],
      timeSlots: [],
      showSettingsModal: false,
      showReservationModal: false,
      editingReservation: null,
      reservationForm: {
        guest_name: '',
        guest_phone: '',
        guest_email: '',
        reservation_date: new Date().toISOString().split('T')[0],
        reservation_time: '',
        party_size: 2,
        table_number: '',
        special_requests: ''
      }
    };
  },
  computed: {
    canManageSettings() {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return user.role === 'owner' || user.role === 'manager';
    },
    businessId() {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return user.businessId;
    },
    formattedDate() {
      return new Date(this.selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  },
  async mounted() {
    await this.loadSettings();
    if (this.settings.enabled) {
      await this.loadReservationsForDate();
      await this.loadAvailableSlots();
    }
  },
  methods: {
    async loadSettings() {
      try {
        const { ipcRenderer } = window.electron;
        const result = await ipcRenderer.invoke('reservation:get-settings', this.businessId);
        console.log('loadSettings result:', result);
        if (result && result.success && result.settings) {
          this.settings = result.settings;
          this.settingsForm = { ...result.settings };
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    },
    async saveSettings() {
      try {
        console.log('saveSettings called');
        const { ipcRenderer } = window.electron;
        // Convert to plain object to avoid cloning issues
        const settingsData = {
          enabled: this.settingsForm.enabled,
          capacity: this.settingsForm.capacity,
          intervalMinutes: this.settingsForm.intervalMinutes,
          openingHour: this.settingsForm.openingHour,
          closingHour: this.settingsForm.closingHour
        };
        
        console.log('Calling IPC with:', this.businessId, settingsData);
        const result = await ipcRenderer.invoke('reservation:update-settings', {
          businessId: this.businessId,
          settings: settingsData
        });
        console.log('IPC result:', result);
        console.log('Result type:', typeof result);
        console.log('Result.success:', result?.success);
        console.log('Result.settings:', result?.settings);
        
        // Update settings from backend result to ensure it's saved
        if (result && result.success) {
          this.settings = result.settings;
          this.settingsForm = { ...result.settings };
          this.showSettingsModal = false;
          alert('Settings saved successfully!');
          
          // Reload data if enabled
          if (this.settings.enabled) {
            await this.loadReservationsForDate();
            await this.loadAvailableSlots();
          }
        } else {
          console.error('Save failed, result:', JSON.stringify(result));
          alert('Failed to save settings: ' + (result?.message || 'Unknown error'));
        }
      } catch (error) {
        console.error('Failed to save settings:', error);
        console.error('Error stack:', error.stack);
        alert('Failed to save settings: ' + error.message);
      }
    },
    async loadReservationsForDate() {
      if (!this.settings.enabled) return;
      
      try {
        const { ipcRenderer } = window.electron;
        console.log('Loading reservations for date:', this.selectedDate);
        const result = await ipcRenderer.invoke('reservation:get-by-date', {
          businessId: this.businessId,
          date: this.selectedDate
        });
        
        console.log('Load reservations result:', result);
        console.log('Number of reservations returned:', result.reservations?.length);
        
        if (result.success) {
          this.reservations = result.reservations;
          console.log('Updated this.reservations, count:', this.reservations.length);
        }
      } catch (error) {
        console.error('Failed to load reservations:', error);
      }
    },
    async loadAvailableSlots() {
      if (!this.settings.enabled) return;
      
      try {
        const { ipcRenderer } = window.electron;
        const result = await ipcRenderer.invoke('reservation:get-available-slots', {
          businessId: this.businessId,
          date: this.selectedDate,
          partySize: 2 // Default party size for availability display
        });
        
        if (result.success) {
          this.timeSlots = result.slots;
        }
      } catch (error) {
        console.error('Failed to load time slots:', error);
      }
    },
    openNewReservationModal(time = '') {
      this.editingReservation = null;
      this.reservationForm = {
        guest_name: '',
        guest_phone: '',
        guest_email: '',
        reservation_date: this.selectedDate,
        reservation_time: time,
        party_size: 2,
        table_number: '',
        special_requests: ''
      };
      this.showReservationModal = true;
    },
    editReservation(reservation) {
      this.editingReservation = reservation;
      this.reservationForm = {
        guest_name: reservation.guest_name,
        guest_phone: reservation.guest_phone || '',
        guest_email: reservation.guest_email || '',
        reservation_date: reservation.reservation_date,
        reservation_time: reservation.reservation_time,
        party_size: reservation.party_size,
        table_number: reservation.table_number || '',
        special_requests: reservation.special_requests || '',
        status: reservation.status || 'pending'
      };
      this.showReservationModal = true;
    },
    async saveReservation() {
      // Validation
      if (!this.reservationForm.guest_name || !this.reservationForm.reservation_date || 
          !this.reservationForm.reservation_time || !this.reservationForm.party_size) {
        alert('Please fill in all required fields');
        return;
      }

      try {
        const { ipcRenderer } = window.electron;
        
        // Convert to plain object to avoid cloning issues
        const reservationData = {
          guestName: this.reservationForm.guest_name,
          guestPhone: this.reservationForm.guest_phone,
          guestEmail: this.reservationForm.guest_email,
          reservationDate: this.reservationForm.reservation_date,
          reservationTime: this.reservationForm.reservation_time,
          partySize: this.reservationForm.party_size,
          tableNumber: this.reservationForm.table_number,
          specialRequests: this.reservationForm.special_requests,
          status: this.reservationForm.status || 'pending'
        };
        
        let result;
        if (this.editingReservation) {
          result = await ipcRenderer.invoke('reservation:update', {
            businessId: this.businessId,
            reservationId: this.editingReservation.id,
            reservationData: reservationData
          });
        } else {
          result = await ipcRenderer.invoke('reservation:create', {
            businessId: this.businessId,
            reservationData: reservationData
          });
        }

        if (result) {
          this.showReservationModal = false;
          alert(this.editingReservation ? 'Reservation updated!' : 'Reservation created!');
          await this.loadReservationsForDate();
          await this.loadAvailableSlots();
        } else {
          alert('Failed to save reservation');
        }
      } catch (error) {
        console.error('Failed to save reservation:', error);
        console.error('Error details:', error.message, error.stack);
        alert('Failed to save reservation: ' + (error.message || 'Unknown error'));
      }
    },
    async updateStatus(reservationId, status) {
      try {
        const { ipcRenderer } = window.electron;
        const result = await ipcRenderer.invoke('reservation:update-status', {
          businessId: this.businessId,
          reservationId,
          status
        });

        if (result.success) {
          await this.loadReservationsForDate();
          await this.loadAvailableSlots();
        } else {
          alert('Failed to update status: ' + result.message);
        }
      } catch (error) {
        console.error('Failed to update status:', error);
      }
    },
    async deleteReservation(reservationId) {
      if (!confirm('Are you sure you want to delete this reservation?')) return;

      try {
        console.log('Deleting reservation:', reservationId);
        const { ipcRenderer } = window.electron;
        const result = await ipcRenderer.invoke('reservation:delete', {
          businessId: this.businessId,
          reservationId
        });
        console.log('Delete result:', result);
        
        if (result.success) {
          console.log('Reloading reservations after delete...');
          await this.loadReservationsForDate();
          await this.loadAvailableSlots();
          console.log('Reservations reloaded');
        } else {
          alert('Failed to delete reservation: ' + result.message);
        }
      } catch (error) {
        console.error('Failed to delete reservation:', error);
        alert('Failed to delete reservation: ' + error.message);
      }
    },
    getCustomerName(customerId) {
      // TODO: Load customer data if needed
      return customerId ? `Customer #${customerId}` : 'Walk-in';
    },
    previousDay() {
      const date = new Date(this.selectedDate + 'T00:00:00');
      date.setDate(date.getDate() - 1);
      this.selectedDate = date.toISOString().split('T')[0];
      this.loadReservationsForDate();
      this.loadAvailableSlots();
    },
    nextDay() {
      const date = new Date(this.selectedDate + 'T00:00:00');
      date.setDate(date.getDate() + 1);
      this.selectedDate = date.toISOString().split('T')[0];
      this.loadReservationsForDate();
      this.loadAvailableSlots();
    },
    goToToday() {
      this.selectedDate = new Date().toISOString().split('T')[0];
      this.loadReservationsForDate();
      this.loadAvailableSlots();
    },
    formatHour(hour) {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:00 ${period}`;
    }
  }
};
</script>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  background: #0a0a0a;
}

.reservations-view {
  flex: 1;
  min-width: 0;
  padding: 2rem;
  max-width: 1400px;
  height: 100vh;
  overflow-y: auto;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.view-header h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--text);
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.alert-info {
  background-color: var(--accent-soft);
  color: #ea580c;
  border: 1px solid var(--accent-ring);
}

.btn-link {
  background: none;
  border: none;
  color: #ea580c;
  text-decoration: underline;
  cursor: pointer;
  font-weight: 600;
}

.date-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(23, 23, 23, 0.5);
  border: 1px solid rgba(82, 82, 82, 0.3);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.date-input {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(82, 82, 82, 0.5);
  border-radius: 4px;
  font-size: 1rem;
  background: rgba(23, 23, 23, 0.8);
  color: #f5f5f5;
  color-scheme: dark;
}

.date-input::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}

.btn-icon {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(82, 82, 82, 0.5);
  background: rgba(23, 23, 23, 0.8);
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2rem;
  color: #f5f5f5;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: rgba(55, 65, 81, 0.9);
  border-color: rgba(115, 115, 115, 0.7);
}

.time-slots-section {
  margin-bottom: 2rem;
}

.time-slots-section h2 {
  margin-bottom: 1rem;
  color: #f5f5f5;
}

.time-slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.time-slot {
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(23, 23, 23, 0.5);
}

.time-slot.available {
  background: rgba(16, 185, 129, 0.1);
  border: 2px solid #10b981;
  color: #f5f5f5;
}

.time-slot.available:hover {
  background: rgba(16, 185, 129, 0.2);
  transform: translateY(-2px);
}

.time-slot.booked {
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid #ef4444;
  cursor: not-allowed;
  opacity: 0.6;
  color: #a3a3a3;
}

.slot-time {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #f5f5f5;
}

.slot-status {
  font-size: 0.9rem;
  color: #d4d4d4;
}

.reservations-list-section {
  background: rgba(23, 23, 23, 0.5);
  border: 1px solid rgba(82, 82, 82, 0.3);
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
  color: #f5f5f5;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #a3a3a3;
}

.reservations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.reservation-card {
  display: flex;
  justify-content: space-between;
  padding: 1.5rem;
  border: 1px solid rgba(82, 82, 82, 0.3);
  border-radius: 8px;
  background: rgba(17, 17, 17, 0.5);
}

.reservation-info {
  flex: 1;
}

.reservation-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.reservation-header h3 {
  margin: 0;
  color: #f5f5f5;
}

.status-badge {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid transparent;
}

.status-badge.pending {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.3);
  color: #fbbf24;
}

.status-badge.confirmed {
  background: var(--accent-soft);
  border-color: var(--accent-ring);
  color: #fb923c;
}

.status-badge.seated,
.status-badge.completed {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.3);
  color: #4ade80;
}

.status-badge.cancelled {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.reservation-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  color: #d4d4d4;
}

.reservation-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
  white-space: nowrap;
}

/* Buttons: same system as the rest of the app */
.btn-primary,
.btn-secondary,
.btn-success,
.btn-info,
.btn-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 150ms, border-color 150ms, color 150ms;
}

.btn-primary {
  background: var(--accent);
  color: #fff;
  border: 1px solid var(--accent);
  padding: 0.625rem 1.125rem;
}
.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-secondary {
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  padding: 0.625rem 1.125rem;
}
.btn-secondary:hover {
  background: var(--surface-hover);
  border-color: var(--border-strong);
}

.btn-success {
  background: rgba(34, 197, 94, 0.12);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
  padding: 0.5rem 1rem;
}
.btn-success:hover {
  background: rgba(34, 197, 94, 0.2);
}

.btn-info {
  background: var(--accent-soft);
  color: #fb923c;
  border: 1px solid var(--accent-ring);
  padding: 0.5rem 1rem;
}
.btn-info:hover {
  background: rgba(249, 115, 22, 0.2);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 0.5rem 1rem;
}
.btn-danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #171717;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
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
  color: #fafafa;
}

.modal-close {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #a3a3a3;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fafafa;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #f5f5f5;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  background: rgba(23, 23, 23, 0.8);
  border: 1px solid rgba(82, 82, 82, 0.5);
  border-radius: 0.5rem;
  color: #f5f5f5;
  font-size: 1rem;
}

.form-control:focus {
  outline: none;
  border-color: #f97316;
  background: rgba(23, 23, 23, 0.95);
}

/* Date and time picker styling */
input[type="date"],
input[type="time"] {
  color-scheme: dark;
}

input[type="date"]::-webkit-calendar-picker-indicator,
input[type="time"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: #f5f5f5;
}

.checkbox-label input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.settings-form {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

small {
  display: block;
  margin-top: 0.25rem;
  color: #a3a3a3;
  font-size: 0.85rem;
}
</style>
