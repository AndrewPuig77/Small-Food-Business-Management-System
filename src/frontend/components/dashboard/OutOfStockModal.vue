<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Mark Item Out of Stock</h3>
        <button @click="$emit('close')" class="btn-close">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <p class="instruction">Select an item to mark as out of stock:</p>
        
        <div class="items-grid">
          <div 
            v-for="item in menuItems" 
            :key="item.id"
            @click="toggleItem(item.id)"
            class="item-card"
            :class="{ selected: selectedItems.includes(item.id) }"
          >
            <div class="item-name">{{ item.name }}</div>
            <div class="item-category">{{ item.category }}</div>
            <div v-if="selectedItems.includes(item.id)" class="check-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
        
        <button 
          @click="handleMarkOutOfStock" 
          class="btn-submit" 
          :disabled="selectedItems.length === 0"
        >
          Mark {{ selectedItems.length }} Item(s) Out of Stock
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

const menuItems = ref([]);
const selectedItems = ref([]);

onMounted(async () => {
  try {
    const items = await ipcRenderer.invoke('menu:get-all-items', props.businessId);
    menuItems.value = items.filter(item => item.availability);
  } catch (error) {
    console.error('Error loading menu items:', error);
  }
});

const toggleItem = (itemId) => {
  const index = selectedItems.value.indexOf(itemId);
  if (index > -1) {
    selectedItems.value.splice(index, 1);
  } else {
    selectedItems.value.push(itemId);
  }
};

const handleMarkOutOfStock = async () => {
  if (selectedItems.value.length === 0) return;
  
  try {
    for (const itemId of selectedItems.value) {
      await ipcRenderer.invoke('menu:update-item', {
        itemId,
        itemData: { availability: false }
      });
    }
    emit('success');
  } catch (error) {
    console.error('Error marking out of stock:', error);
    alert('Failed to update items');
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
  max-width: 700px;
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

.instruction {
  font-size: 0.9375rem;
  color: #d1d5db;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
}

.item-card {
  position: relative;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.625rem;
  cursor: pointer;
  transition: all 0.2s;
}

.item-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.item-card.selected {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
}

.item-name {
  font-size: 1rem;
  font-weight: 600;
  color: #f9fafb;
  margin-bottom: 0.25rem;
}

.item-category {
  font-size: 0.8125rem;
  color: #9ca3af;
}

.check-icon {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 24px;
  height: 24px;
  background: #ef4444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon svg {
  width: 16px;
  height: 16px;
  color: #fff;
}

.btn-submit {
  padding: 0.875rem;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
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
  box-shadow: 0 8px 16px rgba(239, 68, 68, 0.4);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
