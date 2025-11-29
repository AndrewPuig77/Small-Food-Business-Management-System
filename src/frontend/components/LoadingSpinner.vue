<template>
  <div v-if="show" class="spinner-overlay" :class="{ fullscreen }">
    <div class="spinner-container">
      <div class="spinner"></div>
      <p v-if="message" class="spinner-message">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

defineProps({
  show: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  },
  fullscreen: {
    type: Boolean,
    default: true
  }
});
</script>

<style scoped>
.spinner-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
}

.spinner-overlay.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinner-message {
  color: #f9fafb;
  font-size: 1rem;
  font-weight: 500;
}
</style>
