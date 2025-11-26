<template>
  <div class="menu-page">
    <!-- Sidebar Navigation (same as dashboard) -->
    <aside class="sidebar">
      <nav class="nav-menu">
        <router-link to="/dashboard" class="nav-item">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Dashboard</span>
        </router-link>
        <a href="#" class="nav-item" @click.prevent="showComingSoon('Employees')">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>Employees</span>
        </a>
        <a href="#" class="nav-item" @click.prevent="showComingSoon('Inventory')">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span>Inventory</span>
        </a>
        <router-link to="/menu" class="nav-item active">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span>Menu</span>
        </router-link>
        <a href="#" class="nav-item" @click.prevent="showComingSoon('POS')">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>POS</span>
        </a>
        <a href="#" class="nav-item" @click.prevent="showComingSoon('Reports')">
          <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Reports</span>
        </a>
      </nav>
    </aside>

    <!-- Main Content -->
    <div class="menu-view">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="text-3xl font-bold mb-2">Menu Management</h1>
        <p class="text-gray-300">Manage your menu items and categories</p>
      </div>
      <button @click="showAddItemModal = true" class="btn-add">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Menu Item
      </button>
    </div>

    <!-- Category Filter -->
    <div class="category-filter">
      <button 
        @click="selectedCategory = null" 
        :class="['category-chip', { active: selectedCategory === null }]"
      >
        All Items
      </button>
      <button 
        v-for="category in categories" 
        :key="category.id"
        @click="selectedCategory = category.id"
        :class="['category-chip', { active: selectedCategory === category.id }]"
      >
        {{ category.name }}
      </button>
      <button @click="showCategoryModal = true" class="category-chip add-category">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Category
      </button>
    </div>

    <!-- Menu Items Grid -->
    <div v-if="loading" class="loading">Loading menu items...</div>
    <div v-else-if="filteredItems.length === 0" class="empty-state">
      <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p>No menu items found</p>
      <button @click="showAddItemModal = true" class="btn-secondary">Add Your First Item</button>
    </div>
    <div v-else class="menu-grid">
      <div v-for="item in filteredItems" :key="item.id" class="menu-card">
        <div class="menu-card-content">
          <div class="menu-card-left">
            <div class="menu-card-header">
              <div class="menu-item-info">
                <h3 class="menu-item-name">{{ item.name }}</h3>
                <span v-if="item.category_name" class="menu-item-category">{{ item.category_name }}</span>
              </div>
              <div class="menu-item-actions">
                <button @click="editItem(item)" class="action-icon-btn" title="Edit">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button @click="confirmDelete(item)" class="action-icon-btn delete" title="Delete">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <p v-if="item.description" class="menu-item-description">{{ item.description }}</p>
            <div class="menu-item-footer">
              <div class="menu-item-price">${{ parseFloat(item.price).toFixed(2) }}</div>
              <div :class="['menu-item-status', { available: item.available, unavailable: !item.available }]">
                {{ item.available ? 'Available' : 'Unavailable' }}
              </div>
            </div>
          </div>
          <div v-if="item.image_url" class="menu-card-right">
            <img :src="item.image_url" :alt="item.name" class="menu-item-image" />
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Item Modal -->
    <div v-if="showAddItemModal || editingItem" class="modal-overlay" @click.self="closeItemModal">
      <div class="modal">
        <div class="modal-header">
          <h2 class="text-2xl font-bold">{{ editingItem ? 'Edit Menu Item' : 'Add Menu Item' }}</h2>
          <button @click="closeItemModal" class="modal-close">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form @submit.prevent="saveItem" class="modal-body">
          <div class="form-group">
            <label>Item Name *</label>
            <input v-model="itemForm.name" type="text" class="input-field" required />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="itemForm.description" class="input-field" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>Image (optional)</label>
            <input 
              v-if="!itemForm.imageUrl" 
              type="file" 
              @change="handleImageUpload" 
              accept="image/jpeg,image/png"
              class="input-field file-input"
            />
            <div v-if="itemForm.imageUrl" class="image-preview-container">
              <img :src="itemForm.imageUrl" alt="Preview" class="image-preview" />
              <button type="button" @click="removeImage" class="btn-remove-image">Remove Image</button>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Category</label>
              <select v-model="itemForm.categoryId" class="input-field">
                <option :value="null">No Category</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Price *</label>
              <input v-model.number="itemForm.price" type="number" step="0.01" min="0" class="input-field" required />
            </div>
          </div>
          <div class="form-group">
            <label>Available</label>
            <select v-model.number="itemForm.available" class="input-field">
              <option :value="1">Yes</option>
              <option :value="0">No</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeItemModal" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">{{ editingItem ? 'Update' : 'Create' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add Category Modal -->
    <div v-if="showCategoryModal" class="modal-overlay" @click.self="showCategoryModal = false">
      <div class="modal modal-small">
        <div class="modal-header">
          <h2 class="text-2xl font-bold">Add Category</h2>
          <button @click="showCategoryModal = false" class="modal-close">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form @submit.prevent="saveCategory" class="modal-body">
          <div class="form-group">
            <label>Category Name *</label>
            <input v-model="categoryForm.name" type="text" class="input-field" required placeholder="e.g., Appetizers, Main Courses" />
          </div>
          <div class="modal-actions">
            <button type="button" @click="showCategoryModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Create</button>
          </div>
        </form>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const loading = ref(false);
const menuItems = ref([]);
const categories = ref([]);
const selectedCategory = ref(null);
const showAddItemModal = ref(false);
const showCategoryModal = ref(false);
const editingItem = ref(null);

const itemForm = ref({
  name: '',
  description: '',
  categoryId: null,
  price: 0,
  imageUrl: '',
  available: 1
});

const categoryForm = ref({
  name: ''
});

const filteredItems = computed(() => {
  if (selectedCategory.value === null) {
    return menuItems.value;
  }
  return menuItems.value.filter(item => item.category_id === selectedCategory.value);
});

onMounted(async () => {
  await loadMenuData();
});

const loadMenuData = async () => {
  loading.value = true;
  try {
    const { ipcRenderer } = window.require('electron');
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    const [itemsResult, categoriesResult] = await Promise.all([
      ipcRenderer.invoke('menu:get-all-items', user.businessId),
      ipcRenderer.invoke('menu:get-categories', user.businessId)
    ]);

    if (itemsResult.success) {
      menuItems.value = itemsResult.items;
    }
    if (categoriesResult.success) {
      categories.value = categoriesResult.categories;
    }
  } catch (error) {
    console.error('Load menu data error:', error);
    alert('Failed to load menu data');
  } finally {
    loading.value = false;
  }
};

const editItem = (item) => {
  editingItem.value = item;
  itemForm.value = {
    name: item.name,
    description: item.description || '',
    categoryId: item.category_id,
    price: item.price,
    imageUrl: item.image_url || '',
    available: item.available
  };
};

const closeItemModal = () => {
  showAddItemModal.value = false;
  editingItem.value = null;
  itemForm.value = {
    name: '',
    description: '',
    categoryId: null,
    price: 0,
    imageUrl: '',
    available: 1
  };
};

const saveItem = async () => {
  try {
    const { ipcRenderer } = window.require('electron');
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    // Convert reactive object to plain object for IPC
    const itemData = {
      name: itemForm.value.name,
      description: itemForm.value.description,
      categoryId: itemForm.value.categoryId,
      price: itemForm.value.price,
      imageUrl: itemForm.value.imageUrl,
      available: itemForm.value.available
    };
    
    let result;
    if (editingItem.value) {
      result = await ipcRenderer.invoke('menu:update-item', {
        itemId: editingItem.value.id,
        itemData: itemData
      });
    } else {
      result = await ipcRenderer.invoke('menu:create-item', {
        businessId: user.businessId,
        itemData: itemData
      });
    }

    if (result.success) {
      await loadMenuData();
      closeItemModal();
    } else {
      alert('Failed to save item: ' + result.error);
    }
  } catch (error) {
    console.error('Save item error:', error);
    alert('Failed to save item');
  }
};

const confirmDelete = async (item) => {
  if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) {
    return;
  }

  try {
    const { ipcRenderer } = window.require('electron');
    const result = await ipcRenderer.invoke('menu:delete-item', item.id);

    if (result.success) {
      await loadMenuData();
    } else {
      alert('Failed to delete item: ' + result.error);
    }
  } catch (error) {
    console.error('Delete item error:', error);
    alert('Failed to delete item');
  }
};

const saveCategory = async () => {
  try {
    const { ipcRenderer } = window.require('electron');
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    // Convert reactive object to plain object for IPC
    const categoryData = {
      name: categoryForm.value.name
    };
    
    const result = await ipcRenderer.invoke('menu:create-category', {
      businessId: user.businessId,
      categoryData: categoryData
    });

    if (result.success) {
      await loadMenuData();
      showCategoryModal.value = false;
      categoryForm.value = { name: '' };
    } else {
      alert('Failed to create category: ' + result.error);
    }
  } catch (error) {
    console.error('Save category error:', error);
    alert('Failed to create category');
  }
};

const showComingSoon = (feature) => {
  alert(`${feature} feature coming soon!`);
};

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Convert image to base64 data URL
  const reader = new FileReader();
  reader.onload = (e) => {
    itemForm.value.imageUrl = e.target.result;
  };
  reader.readAsDataURL(file);
};

const removeImage = () => {
  itemForm.value.imageUrl = '';
};
</script>

<style scoped>
.menu-page {
  display: flex;
  min-height: 100vh;
  background-color: #0f1419;
  color: #f3f4f6;
}

.menu-page * {
  color: inherit;
}

.sidebar {
  width: 240px;
  background: #0a0e14;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem 0;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  color: #d1d5db;
  text-decoration: none;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.nav-item.active {
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
  border-left-color: #3b82f6;
}

.nav-icon {
  width: 20px;
  height: 20px;
}

.menu-view {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white !important;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
}

.category-filter {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.category-chip {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 2rem;
  color: #d1d5db;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.category-chip:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.category-chip.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  color: #60a5fa;
}

.category-chip.add-category {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  border-style: dashed;
}

.loading {
  text-align: center;
  padding: 4rem;
  color: #9ca3af;
}

.empty-state {
  text-align: center;
  padding: 4rem;
  color: #9ca3af;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  color: #4b5563;
}

.btn-secondary {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: #d1d5db;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 1.5rem;
}

.menu-card {
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.2s;
}

.menu-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
}

.menu-card-content {
  display: flex;
  gap: 1rem;
  align-items: stretch;
  min-height: 180px;
}

.menu-card-left {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.menu-card-right {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-item-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.menu-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.menu-item-info {
  flex: 1;
}

.menu-item-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f3f4f6;
  margin-bottom: 0.25rem;
}

.menu-item-category {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.menu-item-actions {
  display: flex;
  gap: 0.5rem;
}

.action-icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
}

.action-icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #60a5fa;
}

.action-icon-btn.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.action-icon-btn svg {
  width: 18px;
  height: 18px;
}

.menu-item-description {
  color: #9ca3af;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.menu-item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 0.75rem;
}

.menu-item-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #10b981;
}

.menu-item-status {
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.menu-item-status.available {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.menu-item-status.unavailable {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: #1a1f2e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-small {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #f3f4f6;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  color: #d1d5db;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.input-field,
.input-field:focus {
  background-color: #1f2937 !important;
  color: #f3f4f6 !important;
  border-color: #374151 !important;
}

.input-field::placeholder {
  color: #6b7280;
}

.file-input {
  padding: 0.5rem !important;
  cursor: pointer;
}

.image-preview-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-start;
}

.image-preview {
  max-width: 200px;
  max-height: 200px;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-remove-image {
  padding: 0.5rem 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn-remove-image:hover {
  background: rgba(239, 68, 68, 0.2);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white !important;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
</style>
