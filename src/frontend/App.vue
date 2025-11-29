<template>
  <div id="app">
    <router-view />
    
    <!-- Global Modal Components -->
    <AlertModal 
      :show="alertState.show"
      :title="alertState.title"
      :message="alertState.message"
      :type="alertState.type"
      @close="closeAlert"
    />
    
    <ConfirmModal 
      :show="confirmState.show"
      :title="confirmState.title"
      :message="confirmState.message"
      :type="confirmState.type"
      :confirmText="confirmState.confirmText"
      :cancelText="confirmState.cancelText"
      @confirm="confirmState.onConfirm"
      @cancel="confirmState.onCancel"
    />
    
    <LoadingSpinner 
      :show="loadingState.show"
      :message="loadingState.message"
    />
  </div>
</template>

<script setup>
import AlertModal from './components/AlertModal.vue';
import ConfirmModal from './components/ConfirmModal.vue';
import LoadingSpinner from './components/LoadingSpinner.vue';
import { useModals } from './composables/useModals';

const { alertState, confirmState, loadingState, closeAlert } = useModals();
</script>

<style>
/* Global styles are in assets/styles.css */
</style>
