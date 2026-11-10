<template>
  <div class="menu-page">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content -->
    <div class="menu-view">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Menu Management</h1>
        <p class="page-subtitle">Manage your menu items and categories</p>
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
            <p v-if="recipesByItem[item.id]" class="item-recipe" data-testid="item-recipe">
              Uses {{ recipesByItem[item.id].map((r) => `${r.quantity} ${r.unit} ${r.name}`).join(', ') }}
            </p>
            <div v-if="groupsForItem(item.id).length" class="item-group-chips">
              <span v-for="g in groupsForItem(item.id)" :key="g.id" class="item-group-chip">{{ g.name }}</span>
            </div>
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

    <!-- Modifier Groups -->
    <section class="modifier-section">
      <div class="modifier-section-header">
        <div>
          <h2 class="section-title">Modifier groups</h2>
          <p class="section-subtitle">Choices customers make for an item, like size or toppings. Attach groups to items when editing them.</p>
        </div>
        <button type="button" class="btn-secondary" @click="openGroupEditor()">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12M6 12h12" /></svg>
          New group
        </button>
      </div>

      <div v-if="modifierGroups.length === 0" class="modifier-empty">
        No modifier groups yet. Create one such as "Size" (pick 1) or "Toppings" (pick up to 3).
      </div>
      <div v-else class="modifier-grid">
        <div v-for="group in modifierGroups" :key="group.id" class="modifier-card" data-testid="modifier-group">
          <div class="modifier-card-header">
            <div>
              <h3 class="modifier-card-title">{{ group.name }}</h3>
              <p class="modifier-rule">{{ ruleText(group) }}</p>
            </div>
            <div class="menu-item-actions">
              <button @click="openGroupEditor(group)" class="action-icon-btn" title="Edit group" aria-label="Edit group">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button @click="deleteGroup(group)" class="action-icon-btn delete" title="Delete group" aria-label="Delete group">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
          <ul class="modifier-option-list">
            <li v-for="o in group.options" :key="o.id">
              <span>{{ o.name }}</span>
              <span class="modifier-price">{{ o.price > 0 ? '+$' + o.price.toFixed(2) : 'Free' }}</span>
            </li>
          </ul>
          <p class="modifier-usage">
            {{ group.menu_item_ids.length ? 'Used by ' + group.menu_item_ids.length + (group.menu_item_ids.length === 1 ? ' item' : ' items') : 'Not attached to any items' }}
          </p>
        </div>
      </div>
    </section>

    <!-- Modifier Group Editor -->
    <div v-if="groupForm" class="modal-overlay" @click.self="groupForm = null">
      <div class="modal">
        <div class="modal-header">
          <h2 class="text-2xl font-bold">{{ groupForm.id ? 'Edit modifier group' : 'New modifier group' }}</h2>
          <button @click="groupForm = null" class="modal-close" aria-label="Close">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form @submit.prevent="saveGroup" class="modal-body">
          <div class="form-group">
            <label for="group-name">Group name *</label>
            <input id="group-name" v-model="groupForm.name" type="text" class="input-field" placeholder="e.g. Size, Toppings, Crust" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="group-min">Minimum picks</label>
              <input id="group-min" v-model.number="groupForm.minSelect" type="number" min="0" class="input-field" />
              <p class="field-help">0 = optional, 1 or more = required</p>
            </div>
            <div class="form-group">
              <label for="group-max">Maximum picks</label>
              <input id="group-max" v-model.number="groupForm.maxSelect" type="number" min="1" class="input-field" />
              <p class="field-help">1 = customer picks one</p>
            </div>
          </div>
          <div class="form-group">
            <label>Options *</label>
            <div v-for="(o, i) in groupForm.options" :key="i" class="option-row">
              <input v-model="o.name" type="text" class="input-field" :placeholder="'Option ' + (i + 1)" :aria-label="'Option ' + (i + 1) + ' name'" />
              <div class="price-input">
                <span>+$</span>
                <input v-model.number="o.price" type="number" step="0.01" min="0" class="input-field" :aria-label="'Option ' + (i + 1) + ' price'" />
              </div>
              <button type="button" class="action-icon-btn delete" :disabled="groupForm.options.length === 1" @click="groupForm.options.splice(i, 1)" aria-label="Remove option">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <button type="button" class="link-btn" @click="groupForm.options.push({ name: '', price: 0 })">+ Add option</button>
          </div>
          <div v-if="groupError" class="form-error" role="alert">{{ groupError }}</div>
          <div class="modal-actions">
            <button type="button" @click="groupForm = null" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">{{ groupForm.id ? 'Save group' : 'Create group' }}</button>
          </div>
        </form>
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
          <div class="form-group">
            <label>Modifier groups</label>
            <p v-if="modifierGroups.length === 0" class="field-help">
              No modifier groups yet. Create them in the Modifier groups section below the menu.
            </p>
            <div v-else class="group-checklist">
              <label v-for="g in modifierGroups" :key="g.id" class="group-check">
                <input type="checkbox" :value="g.id" v-model="itemForm.groupIds" />
                <span class="group-check-name">{{ g.name }}</span>
                <span class="group-check-rule">{{ ruleText(g) }}</span>
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>Recipe</label>
            <p class="field-help">Ingredients used for one of this item. They come out of inventory when it's sold.</p>
            <p v-if="inventoryItems.length === 0" class="field-help">Add items on the Inventory screen to build recipes.</p>
            <template v-else>
              <div v-for="(line, i) in itemForm.recipe" :key="i" class="option-row recipe-row">
                <select v-model.number="line.inventoryItemId" class="input-field" :aria-label="'Ingredient ' + (i + 1)">
                  <option :value="null" disabled>Choose ingredient</option>
                  <option v-for="inv in inventoryItems" :key="inv.id" :value="inv.id">{{ inv.name }}</option>
                </select>
                <div class="price-input">
                  <input v-model.number="line.quantity" type="number" step="0.001" min="0" class="input-field" :aria-label="'Amount of ingredient ' + (i + 1)" />
                  <span class="unit">{{ unitFor(line.inventoryItemId) }}</span>
                </div>
                <button type="button" class="action-icon-btn delete" @click="itemForm.recipe.splice(i, 1)" aria-label="Remove ingredient">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <button type="button" class="link-btn" @click="itemForm.recipe.push({ inventoryItemId: null, quantity: '' })">+ Add ingredient</button>
            </template>
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

    <!-- Owner Code Verification Modal -->
    <div v-if="showOwnerCodeModal" class="modal-overlay" @mousedown.prevent @click.self="showOwnerCodeModal = false">
      <div class="modal modal-small" @click.stop>
        <div class="modal-header">
          <h2 class="text-xl font-bold">Owner Verification Required</h2>
          <button @click="cancelOwnerVerification" class="modal-close">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="mb-4 text-gray-300">{{ ownerCodeMessage }}</p>
          <div class="form-group">
            <label>Owner Code *</label>
            <input 
              ref="ownerCodeInput"
              v-model="ownerCode" 
              type="password" 
              class="input-field" 
              placeholder="Enter 4-digit owner code"
              @keyup.enter="submitOwnerCode"
            />
          </div>
          <div v-if="ownerCodeError" class="text-red-500 text-sm mt-2">{{ ownerCodeError }}</div>
          <div class="modal-actions">
            <button type="button" @click="cancelOwnerVerification" class="btn-secondary">Cancel</button>
            <button type="button" @click="submitOwnerCode" class="btn-primary">Verify</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import Sidebar from '../components/Sidebar.vue';
import { useAutoRefresh } from '../composables/useAutoRefresh';

const loading = ref(false);
const menuItems = ref([]);
const categories = ref([]);
const selectedCategory = ref(null);
const showAddItemModal = ref(false);
const showCategoryModal = ref(false);
const editingItem = ref(null);

// Owner verification
const showOwnerCodeModal = ref(false);
const ownerCode = ref('');
const ownerCodeError = ref('');
const ownerCodeMessage = ref('');
const pendingAction = ref(null);
const ownerCodeInput = ref(null);

// Watch for modal open and focus input
watch(showOwnerCodeModal, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      ownerCodeInput.value?.focus();
    }, 100);
  }
});

const itemForm = ref({
  name: '',
  description: '',
  categoryId: null,
  price: 0,
  imageUrl: '',
  available: 1,
  groupIds: [],
  recipe: []
});

const categoryForm = ref({
  name: ''
});

// Recipes
const recipesByItem = ref({});
const inventoryItems = ref([]);
const unitFor = (inventoryItemId) => (inventoryItems.value.find((i) => i.id === inventoryItemId) || {}).unit || '';

// Modifier groups
const modifierGroups = ref([]);
const groupForm = ref(null);
const groupError = ref('');

const groupsForItem = (itemId) =>
  modifierGroups.value.filter((g) => g.menu_item_ids.includes(itemId));

const ruleText = (group) => {
  const min = group.min_select;
  const max = group.max_select;
  if (min === max) return min === 1 ? 'Required, pick 1' : `Required, pick ${min}`;
  if (min === 0) return max === 1 ? 'Optional, pick up to 1' : `Optional, pick up to ${max}`;
  return `Required, pick ${min} to ${max}`;
};

const openGroupEditor = (group = null) => {
  groupError.value = '';
  groupForm.value = group
    ? {
        id: group.id,
        name: group.name,
        minSelect: group.min_select,
        maxSelect: group.max_select,
        options: group.options.map((o) => ({ name: o.name, price: o.price }))
      }
    : { id: null, name: '', minSelect: 0, maxSelect: 1, options: [{ name: '', price: 0 }, { name: '', price: 0 }] };
};

// Managers act directly; other roles enter the owner code first (the backend
// enforces the same rule).
const withApproval = async (message, action) => {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (['owner', 'manager', 'admin'].includes(String(user.role || '').toLowerCase())) {
    await action();
    return;
  }
  ownerCodeMessage.value = message;
  pendingAction.value = { type: 'run', run: action };
  showOwnerCodeModal.value = true;
};

const saveGroup = () => withApproval('Enter owner code to save this modifier group:', performSaveGroup);

const performSaveGroup = async () => {
  groupError.value = '';
  const { ipcRenderer } = window.electron;
  const user = JSON.parse(localStorage.getItem('currentUser'));
  const form = groupForm.value;
  const groupData = {
    name: form.name,
    minSelect: form.minSelect,
    maxSelect: form.maxSelect,
    options: form.options.map((o) => ({ name: o.name, price: o.price || 0 }))
  };
  const result = form.id
    ? await ipcRenderer.invoke('modifiers:update-group', { businessId: user.businessId, groupId: form.id, groupData })
    : await ipcRenderer.invoke('modifiers:create-group', { businessId: user.businessId, groupData });
  if (!result.success) {
    groupError.value = result.error;
    return;
  }
  groupForm.value = null;
  await loadMenuData();
};

const deleteGroup = async (group) => {
  const used = group.menu_item_ids.length;
  const warning = used ? ` It is used by ${used} item${used === 1 ? '' : 's'}.` : '';
  if (!confirm(`Delete the "${group.name}" modifier group?${warning} Past orders are not affected.`)) return;
  await withApproval(`Enter owner code to delete "${group.name}":`, () => performDeleteGroup(group));
};

const performDeleteGroup = async (group) => {
  const { ipcRenderer } = window.electron;
  const user = JSON.parse(localStorage.getItem('currentUser'));
  const result = await ipcRenderer.invoke('modifiers:delete-group', { businessId: user.businessId, groupId: group.id });
  if (!result.success) {
    alert('Could not delete group: ' + result.error);
    return;
  }
  await loadMenuData();
};

const filteredItems = computed(() => {
  if (selectedCategory.value === null) {
    return menuItems.value;
  }
  return menuItems.value.filter(item => item.category_id === selectedCategory.value);
});

const loadMenuData = async () => {
  loading.value = true;
  try {
    const { ipcRenderer } = window.electron;
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    const [itemsResult, categoriesResult, groupsResult, recipesResult, inventoryResult] = await Promise.all([
      ipcRenderer.invoke('menu:get-all-items', user.businessId),
      ipcRenderer.invoke('menu:get-categories', user.businessId),
      ipcRenderer.invoke('modifiers:get-groups', user.businessId),
      ipcRenderer.invoke('recipes:get-by-item', user.businessId),
      ipcRenderer.invoke('inventory:get-all-items', user.businessId)
    ]);

    recipesByItem.value = recipesResult && recipesResult.success ? recipesResult.data : {};
    inventoryItems.value = Array.isArray(inventoryResult) ? inventoryResult : [];

    if (groupsResult && groupsResult.success) {
      modifierGroups.value = groupsResult.data;
    }

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
    available: item.available,
    groupIds: groupsForItem(item.id).map((g) => g.id),
    recipe: (recipesByItem.value[item.id] || []).map((r) => ({ inventoryItemId: r.inventoryItemId, quantity: r.quantity }))
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
    available: 1,
    groupIds: [],
    recipe: []
  };
};

const saveItem = async () => {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  
  // Check if owner verification is needed
  if (user.role !== 'owner' && user.role !== 'manager') {
    ownerCodeMessage.value = 'Enter owner code to save menu item:';
    pendingAction.value = { type: 'save' };
    showOwnerCodeModal.value = true;
    return;
  }
  
  // If owner/manager, proceed directly
  await performSaveItem();
};

const performSaveItem = async () => {
  try {
    const { ipcRenderer } = window.electron;
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
      const menuItemId = editingItem.value ? editingItem.value.id : result.itemId;
      const linkResult = await ipcRenderer.invoke('modifiers:set-item-groups', {
        businessId: user.businessId,
        menuItemId,
        groupIds: [...itemForm.value.groupIds]
      });
      if (!linkResult.success) {
        alert('Item saved, but modifier groups could not be attached: ' + linkResult.error);
      }
      const recipeResult = await ipcRenderer.invoke('recipes:set', {
        businessId: user.businessId,
        menuItemId,
        lines: itemForm.value.recipe
          .filter((l) => l.inventoryItemId)
          .map((l) => ({ inventoryItemId: l.inventoryItemId, quantity: Number(l.quantity) }))
      });
      if (!recipeResult.success) {
        alert('Item saved, but the recipe could not be saved: ' + recipeResult.error);
      }
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

  const user = JSON.parse(localStorage.getItem('currentUser'));
  
  // Check if owner verification is needed
  if (user.role !== 'owner' && user.role !== 'manager') {
    ownerCodeMessage.value = `Enter owner code to delete "${item.name}":`;
    pendingAction.value = { type: 'delete', item };
    showOwnerCodeModal.value = true;
    return;
  }
  
  // If owner/manager, proceed directly
  await performDeleteItem(item);
};

const performDeleteItem = async (item) => {
  try {
    const { ipcRenderer } = window.electron;
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

const saveCategory = () => withApproval('Enter owner code to add a category:', performSaveCategory);

const performSaveCategory = async () => {
  try {
    const { ipcRenderer } = window.electron;
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

// Owner verification functions
const submitOwnerCode = async () => {
  if (!ownerCode.value) {
    ownerCodeError.value = 'Please enter owner code';
    return;
  }
  
  try {
    const { ipcRenderer } = window.electron;
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    const verifyResult = await ipcRenderer.invoke('auth:verify-owner-code', {
      businessId: user.businessId,
      code: ownerCode.value
    });
    
    if (!verifyResult.success) {
      ownerCodeError.value = 'Invalid owner code';
      return;
    }
    
    // Code verified, proceed with pending action
    showOwnerCodeModal.value = false;
    ownerCode.value = '';
    ownerCodeError.value = '';
    
    if (pendingAction.value) {
      if (pendingAction.value.type === 'save') {
        await performSaveItem();
      } else if (pendingAction.value.type === 'delete') {
        await performDeleteItem(pendingAction.value.item);
      } else if (pendingAction.value.type === 'run') {
        await pendingAction.value.run();
      }
      pendingAction.value = null;
    }
  } catch (error) {
    console.error('Error verifying owner code:', error);
    ownerCodeError.value = 'Error verifying code';
  }
};

const cancelOwnerVerification = () => {
  showOwnerCodeModal.value = false;
  ownerCode.value = '';
  ownerCodeError.value = '';
  pendingAction.value = null;
};

// Auto-refresh menu data every 20 seconds to see changes from other accounts
const { isRefreshing, manualRefresh } = useAutoRefresh(loadMenuData, 20000);

onMounted(async () => {
  // Initial load handled by useAutoRefresh
});
</script>

<style scoped>
.menu-page {
  display: flex;
  min-height: 100vh;
  background-color: #0a0a0a;
  color: #f5f5f5;
}

.menu-page * {
  color: inherit;
}

.menu-view {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: var(--text);
}

.page-subtitle {
  color: #a3a3a3;
  font-size: 0.875rem;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #f97316;
  color: white !important;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(249, 115, 22, 0.3);
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
  color: #d4d4d4;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.category-chip:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.category-chip.active {
  background: rgba(249, 115, 22, 0.2);
  border-color: #f97316;
  color: #fb923c;
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
  color: #a3a3a3;
}

.empty-state {
  text-align: center;
  padding: 4rem;
  color: #a3a3a3;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  color: #3a3a3a;
}

.btn-secondary {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: #d4d4d4;
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
  background: linear-gradient(135deg, #111111 0%, #0a0a0a 100%);
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
  color: #f5f5f5;
  margin-bottom: 0.25rem;
}

.menu-item-category {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: rgba(249, 115, 22, 0.1);
  color: #fb923c;
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
  color: #a3a3a3;
  cursor: pointer;
  transition: all 0.2s;
}

.action-icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fb923c;
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
  color: #a3a3a3;
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
  background: #111111;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  pointer-events: auto;
  position: relative;
  z-index: 1001;
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
  color: #a3a3a3;
  cursor: pointer;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #f5f5f5;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  color: #d4d4d4;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.input-field,
.input-field:focus {
  background-color: #171717 !important;
  color: #f5f5f5 !important;
  border-color: #262626 !important;
}

.input-field::placeholder {
  color: #737373;
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
  background: #f97316;
  color: white !important;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
}

/* Modifier groups */
.item-group-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin: 0.5rem 0 0.75rem;
}
.item-group-chip {
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  color: var(--text-muted);
  background: var(--surface-hover);
  border: 1px solid var(--border);
}
.modifier-section {
  margin-top: 2.5rem;
}
.modifier-section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}
.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}
.section-subtitle {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-faint);
}
.modifier-empty {
  padding: 1.5rem;
  border: 1px dashed var(--border-strong);
  border-radius: 14px;
  color: var(--text-faint);
  font-size: 0.875rem;
  text-align: center;
}
.modifier-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}
.modifier-card {
  padding: 1.25rem;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
}
.modifier-card-header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.modifier-card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}
.modifier-rule {
  margin-top: 0.125rem;
  font-size: 0.8125rem;
  color: var(--accent);
}
.modifier-option-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}
.modifier-option-list li {
  display: flex;
  justify-content: space-between;
}
.modifier-price {
  color: var(--text-faint);
}
.modifier-usage {
  margin-top: 0.875rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
  font-size: 0.8125rem;
  color: var(--text-faint);
}
.field-help {
  margin-top: 0.375rem;
  font-size: 0.8125rem;
  color: var(--text-faint);
}
.option-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.option-row > .input-field {
  flex: 1;
}
.price-input {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: 120px;
  color: var(--text-faint);
  font-size: 0.875rem;
}
.option-row .action-icon-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.link-btn {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--accent);
}
.link-btn:hover {
  color: var(--accent-hover);
}
.form-error {
  margin-bottom: 1rem;
  padding: 0.75rem 0.875rem;
  font-size: 0.875rem;
  color: #f87171;
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 10px;
}
.group-checklist {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.group-check {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.75rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
}
.group-check:hover {
  border-color: var(--border-strong);
}
.group-check-name {
  color: var(--text);
  font-weight: 500;
}
.group-check-rule {
  margin-left: auto;
  font-size: 0.8125rem;
  color: var(--text-faint);
}

/* Recipes */
.item-recipe {
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  color: var(--text-faint);
}
.recipe-row select {
  flex: 1;
}
.recipe-row .price-input {
  width: 150px;
}
.recipe-row .unit {
  min-width: 2.5rem;
  font-size: 0.8125rem;
  color: var(--text-faint);
}
</style>
