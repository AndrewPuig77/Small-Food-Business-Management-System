<template>
  <Transition name="toast">
    <div v-if="toastState.show" :class="['toast', `toast-${toastState.type}`]">
      <div class="toast-icon">
        <span v-if="toastState.type === 'success'">✓</span>
        <span v-else-if="toastState.type === 'error'">✕</span>
        <span v-else-if="toastState.type === 'warning'">⚠</span>
        <span v-else>ℹ</span>
      </div>
      <div class="toast-content">
        <p class="toast-message">{{ toastState.message }}</p>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { toastState } from '../composables/useToast';
</script>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  min-width: 300px;
  max-width: 500px;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 10000;
  backdrop-filter: blur(10px);
}

.toast-success {
  background: rgba(34, 197, 94, 0.95);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.toast-error {
  background: rgba(239, 68, 68, 0.95);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.toast-warning {
  background: rgba(245, 158, 11, 0.95);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.toast-info {
  background: rgba(59, 130, 246, 0.95);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.toast-icon {
  font-size: 24px;
  font-weight: bold;
  color: white;
  flex-shrink: 0;
}

.toast-content {
  flex: 1;
}

.toast-message {
  margin: 0;
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.toast-enter-active {
  animation: toast-in 0.3s ease-out;
}

.toast-leave-active {
  animation: toast-out 0.3s ease-in;
}

@keyframes toast-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes toast-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
</style>
