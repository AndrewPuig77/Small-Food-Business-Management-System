<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Clock In/Out</h3>
        <button @click="$emit('close')" class="btn-close">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <p class="info-text">
          Current Status: <span :class="isClocked ? 'status-in' : 'status-out'">
            {{ isClocked ? 'Clocked In' : 'Clocked Out' }}
          </span>
        </p>
        <p class="user-name">{{ currentUser?.fullName }}</p>
        <button @click="handleClockAction" class="btn-action">
          {{ isClocked ? 'Clock Out' : 'Clock In' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  currentUser: Object
});

const emit = defineEmits(['close', 'success']);
const { ipcRenderer } = window.require('electron');

const isClocked = ref(false);

const handleClockAction = async () => {
  try {
    const action = isClocked.value ? 'clock-out' : 'clock-in';
    await ipcRenderer.invoke('timelog:clock-action', {
      userId: props.currentUser.id,
      action
    });
    emit('success');
  } catch (error) {
    console.error('Clock action error:', error);
    alert('Failed to ' + (isClocked.value ? 'clock out' : 'clock in'));
  }
};
</script>

<style scoped>
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

.modal-content {
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #f9fafb;
  margin: 0;
}

.btn-close {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  color: #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-close svg {
  width: 20px;
  height: 20px;
}

.modal-body {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.info-text {
  font-size: 1rem;
  color: #d1d5db;
}

.status-in {
  font-weight: 700;
  color: #4ade80;
}

.status-out {
  font-weight: 700;
  color: #9ca3af;
}

.user-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f9fafb;
}

.btn-action {
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border: none;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.4);
}
</style>
