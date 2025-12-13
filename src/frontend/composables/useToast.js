import { ref } from 'vue';

// Global state for toast notifications
export const toastState = ref({
  show: false,
  message: '',
  type: 'info', // 'success', 'error', 'warning', 'info'
  duration: 3000
});

let toastTimer = null;

export function useToast() {
  const showToast = (message, type = 'info', duration = 3000) => {
    // Clear existing timer
    if (toastTimer) {
      clearTimeout(toastTimer);
    }

    // Show toast
    toastState.value = {
      show: true,
      message,
      type,
      duration
    };

    // Auto-hide after duration
    toastTimer = setTimeout(() => {
      toastState.value.show = false;
    }, duration);
  };

  const showSuccess = (message, duration) => {
    showToast(message, 'success', duration);
  };

  const showError = (message, duration) => {
    showToast(message, 'error', duration);
  };

  const showWarning = (message, duration) => {
    showToast(message, 'warning', duration);
  };

  const showInfo = (message, duration) => {
    showToast(message, 'info', duration);
  };

  const hideToast = () => {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toastState.value.show = false;
  };

  return {
    toastState,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast
  };
}
