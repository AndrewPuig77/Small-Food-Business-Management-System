<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Quick Inventory Adjustment</h3>
        <button @click="$emit('close')" class="btn-close">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Select Item</label>
          <select v-model="selectedItem" class="form-control">
            <option value="">Choose an item...</option>
            <option v-for="item in inventoryItems" :key="item.id" :value="item.id">
              {{ item.name }} (Current: {{ item.quantity }})
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Adjustment Type</label>
          <div class="button-group">
            <button 
              @click="adjustmentType = 'add'"
              :class="{ active: adjustmentType === 'add' }"
              class="btn-type"
            >
              Add Stock
            </button>
            <button 
              @click="adjustmentType = 'remove'"
              :class="{ active: adjustmentType === 'remove' }"
              class="btn-type"
            >
              Remove Stock
            </button>
          </div>
        </div>
        
        <div class="form-group">
          <label>Quantity</label>
          <input 
            v-model.number="quantity" 
            type="number" 
            min="1" 
            class="form-control"
            placeholder="Enter quantity"
          />
        </div>
        
        <div class="form-group">
          <label>Reason (Optional)</label>
          <textarea 
            v-model="reason" 
            class="form-control" 
            rows="3"
            placeholder="Enter reason for adjustment..."
          ></textarea>
        </div>
        
        <button @click="handleAdjustment" class="btn-submit" :disabled="!selectedItem || !quantity">
          Apply Adjustment
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  businessId: Number
});

const emit = defineEmits(['close', 'success']);
const { ipcRenderer } = window.require('electron');

const inventoryItems = ref([]);
const selectedItem = ref('');
const adjustmentType = ref('add');
const quantity = ref(null);
const reason = ref('');

onMounted(async () => {
  try {
    const items = await ipcRenderer.invoke('inventory:get-all-items', props.businessId);
    inventoryItems.value = items;
  } catch (error) {
    console.error('Error loading inventory:', error);
  }
});

const handleAdjustment = async () => {
  if (!selectedItem.value || !quantity.value) return;
  
  try {
    await ipcRenderer.invoke('inventory:adjust-quantity', {
      itemId: selectedItem.value,
      change: adjustmentType.value === 'add' ? quantity.value : -quantity.value,
      reason: reason.value
    });
    emit('success');
  } catch (error) {
    console.error('Adjustment error:', error);
    alert('Failed to adjust inventory');
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
  max-width: 600px;
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
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #e5e7eb;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-control {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #f9fafb;
  font-size: 0.9375rem;
}

.form-control:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.5);
}

.button-group {
  display: flex;
  gap: 0.5rem;
}

.btn-type {
  flex: 1;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #9ca3af;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-type:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-type.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
  color: #93c5fd;
}

.btn-submit {
  padding: 0.875rem;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border: none;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.4);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
