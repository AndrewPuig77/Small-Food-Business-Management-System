import { ref } from 'vue';

// Global state for modals
const alertState = ref({
  show: false,
  title: '',
  message: '',
  type: 'info'
});

const confirmState = ref({
  show: false,
  title: '',
  message: '',
  type: 'warning',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  onConfirm: null,
  onCancel: null
});

const loadingState = ref({
  show: false,
  message: ''
});

export function useModals() {
  // Alert Modal
  const showAlert = (title, message, type = 'info') => {
    alertState.value = {
      show: true,
      title,
      message,
      type
    };
  };

  const showSuccess = (message, title = 'Success') => {
    showAlert(title, message, 'success');
  };

  const showError = (message, title = 'Error') => {
    showAlert(title, message, 'error');
  };

  const showWarning = (message, title = 'Warning') => {
    showAlert(title, message, 'warning');
  };

  const showInfo = (message, title = 'Information') => {
    showAlert(title, message, 'info');
  };

  const closeAlert = () => {
    alertState.value.show = false;
  };

  // Confirm Modal
  const showConfirm = (message, onConfirm, options = {}) => {
    return new Promise((resolve) => {
      confirmState.value = {
        show: true,
        title: options.title || 'Confirm Action',
        message,
        type: options.type || 'warning',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        onConfirm: () => {
          confirmState.value.show = false;
          if (onConfirm) onConfirm();
          resolve(true);
        },
        onCancel: () => {
          confirmState.value.show = false;
          if (options.onCancel) options.onCancel();
          resolve(false);
        }
      };
    });
  };

  const closeConfirm = () => {
    if (confirmState.value.onCancel) {
      confirmState.value.onCancel();
    }
    confirmState.value.show = false;
  };

  // Loading Spinner
  const showLoading = (message = 'Loading...') => {
    loadingState.value = {
      show: true,
      message
    };
  };

  const hideLoading = () => {
    loadingState.value.show = false;
  };

  return {
    // Alert
    alertState,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeAlert,
    
    // Confirm
    confirmState,
    showConfirm,
    closeConfirm,
    
    // Loading
    loadingState,
    showLoading,
    hideLoading
  };
}
