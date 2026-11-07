<template>
  <Transition name="modal">
    <div v-if="show" class="modal-overlay" @click="handleCancel">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button @click="handleCancel" class="close-btn" aria-label="Close"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        </div>
        
        <div class="modal-body">
          <p class="modal-message">{{ message }}</p>
          
          <div class="pin-input-container">
            <input
              v-for="i in 4"
              :key="i"
              :ref="el => pinInputs[i - 1] = el"
              v-model="pinDigits[i - 1]"
              @input="handleInput(i - 1, $event)"
              @keydown="handleKeydown(i - 1, $event)"
              @paste="handlePaste"
              type="text"
              inputmode="numeric"
              maxlength="1"
              class="pin-digit"
              :class="{ 'error': error }"
            />
          </div>
          
          <p v-if="error" class="error-message">{{ error }}</p>
        </div>
        
        <div class="modal-footer">
          <button @click="handleCancel" class="btn-secondary">
            {{ cancelText }}
          </button>
          <button @click="handleConfirm" class="btn-primary" :disabled="!isComplete">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';

const props = defineProps({
  show: Boolean,
  title: {
    type: String,
    default: 'Enter Owner Code'
  },
  message: {
    type: String,
    default: 'Please enter the 4-digit owner code to proceed'
  },
  confirmText: {
    type: String,
    default: 'Verify'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  }
});

const emit = defineEmits(['confirm', 'cancel']);

const pinDigits = ref(['', '', '', '']);
const pinInputs = ref([]);
const error = ref('');

const isComplete = computed(() => {
  return pinDigits.value.every(digit => digit !== '');
});

const handleInput = (index, event) => {
  const value = event.target.value;
  
  // Only allow digits
  if (value && !/^\d$/.test(value)) {
    pinDigits.value[index] = '';
    return;
  }
  
  error.value = '';
  
  // Move to next input if digit entered
  if (value && index < 3) {
    nextTick(() => {
      pinInputs.value[index + 1]?.focus();
    });
  }
};

const handleKeydown = (index, event) => {
  // Handle backspace
  if (event.key === 'Backspace' && !pinDigits.value[index] && index > 0) {
    nextTick(() => {
      pinInputs.value[index - 1]?.focus();
    });
  }
  
  // Handle enter
  if (event.key === 'Enter' && isComplete.value) {
    handleConfirm();
  }
};

const handlePaste = (event) => {
  event.preventDefault();
  const pasteData = event.clipboardData.getData('text');
  
  // Only accept 4 digits
  if (/^\d{4}$/.test(pasteData)) {
    pinDigits.value = pasteData.split('');
    nextTick(() => {
      pinInputs.value[3]?.focus();
    });
  }
};

const handleConfirm = () => {
  if (isComplete.value) {
    const code = pinDigits.value.join('');
    emit('confirm', code);
  }
};

const handleCancel = () => {
  pinDigits.value = ['', '', '', ''];
  error.value = '';
  emit('cancel');
};

const setError = (message) => {
  error.value = message;
  // Shake animation trigger
  nextTick(() => {
    pinInputs.value.forEach(input => {
      if (input) {
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
      }
    });
  });
};

// Watch show prop to focus first input
watch(() => props.show, (newVal) => {
  if (newVal) {
    pinDigits.value = ['', '', '', ''];
    error.value = '';
    nextTick(() => {
      pinInputs.value[0]?.focus();
    });
  }
});

defineExpose({ setError });
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: #171717;
  border-radius: 12px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #fafafa;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #a3a3a3;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fafafa;
}

.modal-body {
  padding: 24px;
}

.modal-message {
  margin: 0 0 24px 0;
  color: #d4d4d4;
  font-size: 14px;
  text-align: center;
}

.pin-input-container {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 16px;
}

.pin-digit {
  width: 56px;
  height: 64px;
  font-size: 32px;
  font-weight: bold;
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(249, 115, 22, 0.3);
  border-radius: 8px;
  color: #fafafa;
  transition: all 0.2s;
}

.pin-digit:focus {
  outline: none;
  border-color: #f97316;
  background: rgba(249, 115, 22, 0.1);
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2);
}

.pin-digit.error {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.error-message {
  margin: 0;
  color: #ef4444;
  font-size: 13px;
  text-align: center;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-primary,
.btn-secondary {
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #f97316;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #ea580c;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #d4d4d4;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fafafa;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.shake {
  animation: shake 0.5s;
}
</style>
