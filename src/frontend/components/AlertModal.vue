<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="alert-modal" :class="type">
      <div class="alert-icon">
        <svg v-if="type === 'success'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else-if="type === 'error'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else-if="type === 'warning'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="alert-content">
        <h3 class="alert-title">{{ title }}</h3>
        <p class="alert-message">{{ message }}</p>
      </div>
      <button @click="close" class="alert-close">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, onMounted } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'info', // 'success', 'error', 'warning', 'info'
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  autoDismiss: {
    type: Number,
    default: 0 // 0 means no auto dismiss, otherwise time in ms
  }
});

const emit = defineEmits(['close']);

const close = () => {
  emit('close');
};

onMounted(() => {
  if (props.autoDismiss > 0) {
    setTimeout(() => {
      close();
    }, props.autoDismiss);
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 2rem;
  z-index: 9999;
}

.alert-modal {
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 2px solid;
  position: relative;
  animation: alertSlideDown 0.3s ease-out;
  display: flex;
  gap: 1rem;
}

@keyframes alertSlideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert-modal.success {
  border-color: #10b981;
}

.alert-modal.error {
  border-color: #ef4444;
}

.alert-modal.warning {
  border-color: #f59e0b;
}

.alert-modal.info {
  border-color: #3b82f6;
}

.alert-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.alert-modal.success .alert-icon {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.alert-modal.error .alert-icon {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.alert-modal.warning .alert-icon {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.alert-modal.info .alert-icon {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.alert-icon svg {
  width: 24px;
  height: 24px;
}

.alert-content {
  flex: 1;
  padding-right: 1.5rem;
}

.alert-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #f9fafb;
  margin-bottom: 0.5rem;
}

.alert-message {
  font-size: 0.875rem;
  color: #d1d5db;
  line-height: 1.5;
}

.alert-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 0.375rem;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.alert-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f9fafb;
}

.alert-close svg {
  width: 16px;
  height: 16px;
}
</style>
