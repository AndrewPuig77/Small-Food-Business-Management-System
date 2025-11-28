<template>
  <div class="inventory-page">
    <!-- Sidebar Navigation -->
    <Sidebar />

    <!-- Main Content -->
    <main class="main-content">
      <header class="page-header">
        <div>
          <h1 class="page-title">Inventory Management</h1>
          <p class="page-subtitle">Track stock levels and manage suppliers</p>
        </div>
        <div class="header-actions">
          <button @click="showSuppliersModal = true" class="btn-secondary">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Suppliers
          </button>
          <button @click="showCategoriesModal = true" class="btn-secondary">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Categories
          </button>
          <button @click="showBatchImportModal = true" class="btn-secondary">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Batch Import
          </button>
          <button @click="openItemModal()" class="btn-primary">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </button>
        </div>
      </header>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">Total Items</div>
            <div class="stat-value">{{ items.length }}</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon red">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">Low Stock Alerts</div>
            <div class="stat-value">{{ lowStockCount }}</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon green">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">Total Value</div>
            <div class="stat-value">${{ totalInventoryValue.toFixed(2) }}</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon yellow">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-label">Categories</div>
            <div class="stat-value">{{ categories.length }}</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <div class="search-box">
          <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search inventory..."
            class="search-input"
          />
        </div>
        
        <div class="filter-chips">
          <button 
            @click="selectedCategory = null" 
            :class="['filter-chip', { active: selectedCategory === null }]"
          >
            All Items
          </button>
          <button 
            @click="selectedCategory = 'low-stock'" 
            :class="['filter-chip', { active: selectedCategory === 'low-stock' }]"
          >
            Low Stock
          </button>
          <button 
            v-for="cat in categories" 
            :key="cat.id"
            @click="selectedCategory = cat.id" 
            :class="['filter-chip', { active: selectedCategory === cat.id }]"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>

      <!-- Inventory Table -->
      <div v-if="loading" class="loading">Loading inventory...</div>
      <div v-else-if="filteredItems.length === 0" class="empty-state">
        <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p>No inventory items found</p>
        <button @click="openItemModal()" class="btn-secondary">Add Your First Item</button>
      </div>
      <div v-else class="table-container">
        <table class="inventory-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Category</th>
              <th>SKU</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Unit Cost</th>
              <th>Total Value</th>
              <th>Supplier</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredItems" :key="item.id" :class="{ 'low-stock-row': item.is_low_stock }">
              <td class="item-name">
                <div>{{ item.name }}</div>
                <div v-if="item.description" class="item-desc">{{ item.description }}</div>
              </td>
              <td>
                <span v-if="item.category_name" class="category-badge">{{ item.category_name }}</span>
                <span v-else class="text-muted">—</span>
              </td>
              <td class="text-muted">{{ item.sku || '—' }}</td>
              <td :class="{ 'low-stock-text': item.is_low_stock }">
                <strong>{{ parseFloat(item.quantity).toFixed(2) }}</strong>
                <span v-if="item.min_quantity > 0" class="text-muted"> / {{ parseFloat(item.min_quantity).toFixed(2) }}</span>
              </td>
              <td>{{ item.unit }}</td>
              <td>${{ item.unit_cost ? parseFloat(item.unit_cost).toFixed(2) : '0.00' }}</td>
              <td class="total-value">${{ item.total_value ? parseFloat(item.total_value).toFixed(2) : '0.00' }}</td>
              <td class="text-muted">{{ item.supplier_name || '—' }}</td>
              <td class="text-muted">{{ item.location || '—' }}</td>
              <td>
                <span v-if="item.is_low_stock" class="status-badge low">Low Stock</span>
                <span v-else class="status-badge ok">In Stock</span>
              </td>
              <td>
                <div class="action-buttons">
                  <button @click="openStockModal(item)" class="action-icon-btn" title="Adjust Stock">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>
                  <button @click="editItem(item)" class="action-icon-btn" title="Edit">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button @click="deleteItem(item)" class="action-icon-btn delete" title="Delete">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- Add/Edit Item Modal -->
    <div v-if="showItemModal" class="modal-overlay" @click.self="closeItemModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>{{ editingItem ? 'Edit Item' : 'Add Inventory Item' }}</h2>
          <button @click="closeItemModal" class="modal-close">×</button>
        </div>
        <form @submit.prevent="saveItem" class="modal-content">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Item Name *</label>
              <input v-model="itemForm.name" type="text" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">SKU</label>
              <input v-model="itemForm.sku" type="text" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea v-model="itemForm.description" class="form-textarea" rows="2"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select v-model="itemForm.categoryId" class="form-input">
                <option :value="null">No Category</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Supplier</label>
              <select v-model="itemForm.supplierId" class="form-input">
                <option :value="null">No Supplier</option>
                <option v-for="sup in suppliers" :key="sup.id" :value="sup.id">{{ sup.name }}</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Quantity *</label>
              <input v-model.number="itemForm.quantity" type="number" step="0.01" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">Min Quantity (Reorder Level)</label>
              <input v-model.number="itemForm.minQuantity" type="number" step="0.01" class="form-input" />
              <p class="field-hint">Alert threshold for low stock</p>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input v-model="itemForm.enableLowStockAlert" type="checkbox" />
                <span>Enable Low Stock Alerts</span>
              </label>
              <p class="field-hint">Get notified when quantity falls below minimum</p>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Unit *</label>
              <select v-model="itemForm.unit" class="form-input" required>
                <option value="unit">Unit</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="lb">Pound (lb)</option>
                <option value="oz">Ounce (oz)</option>
                <option value="l">Liter (L)</option>
                <option value="ml">Milliliter (mL)</option>
                <option value="gal">Gallon</option>
                <option value="box">Box</option>
                <option value="bag">Bag</option>
                <option value="case">Case</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Unit Cost ($)</label>
              <input v-model.number="itemForm.unitCost" type="number" step="0.01" class="form-input" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Storage Location</label>
              <input v-model="itemForm.location" type="text" class="form-input" placeholder="e.g., Shelf A3, Freezer 2" />
            </div>
            <div class="form-group">
              <label class="form-label">Expiry Date</label>
              <input v-model="itemForm.expiryDate" type="date" class="form-input" />
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeItemModal" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">{{ editingItem ? 'Update' : 'Add' }} Item</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Stock Adjustment Modal -->
    <div v-if="showStockModal" class="modal-overlay" @click.self="showStockModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Adjust Stock - {{ stockItem?.name }}</h2>
          <button @click="showStockModal = false" class="modal-close">×</button>
        </div>
        <form @submit.prevent="saveStockAdjustment" class="modal-content">
          <div class="stock-current">
            <span class="stock-label">Current Stock:</span>
            <span class="stock-value">{{ stockItem?.quantity }} {{ stockItem?.unit }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Adjustment *</label>
            <input v-model.number="stockForm.adjustment" type="number" step="0.01" class="form-input" required placeholder="e.g., 10 (add) or -5 (remove)" />
            <p class="field-hint">Enter positive number to add stock, negative to remove</p>
          </div>

          <div class="form-group">
            <label class="form-label">Vendor (for purchases)</label>
            <input v-model="stockForm.vendor" type="text" class="form-input" placeholder="e.g., Sysco, US Foods" />
            <p class="field-hint">Required for purchases to track expenses</p>
          </div>

          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea v-model="stockForm.notes" class="form-textarea" rows="3" placeholder="Reason for adjustment (e.g., 'Purchase order #1234', 'Waste - expired', 'Spoilage')..."></textarea>
            <p class="field-hint">Include 'waste' or 'spoilage' in notes to track losses</p>
          </div>

          <div class="stock-preview">
            <span class="stock-label">New Stock Level:</span>
            <span class="stock-value">{{ (parseFloat(stockItem?.quantity || 0) + parseFloat(stockForm.adjustment || 0)).toFixed(2) }} {{ stockItem?.unit }}</span>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showStockModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Apply Adjustment</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Categories Modal -->
    <div v-if="showCategoriesModal" class="modal-overlay" @click.self="showCategoriesModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Inventory Categories</h2>
          <button @click="showCategoriesModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-content">
          <button @click="showAddCategoryForm = true" class="btn-primary full-width mb-3">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </button>

          <form v-if="showAddCategoryForm" @submit.prevent="saveCategory" class="category-form">
            <div class="form-group">
              <input v-model="categoryForm.name" type="text" class="form-input" placeholder="Category name" required />
            </div>
            <div class="form-group">
              <textarea v-model="categoryForm.description" class="form-textarea" rows="2" placeholder="Description (optional)"></textarea>
            </div>
            <div class="form-actions">
              <button type="button" @click="showAddCategoryForm = false" class="btn-secondary">Cancel</button>
              <button type="submit" class="btn-primary">Save</button>
            </div>
          </form>

          <div class="categories-list">
            <div v-for="cat in categories" :key="cat.id" class="category-item">
              <div>
                <div class="category-name">{{ cat.name }}</div>
                <div v-if="cat.description" class="category-desc">{{ cat.description }}</div>
              </div>
              <button @click="deleteCategory(cat.id)" class="btn-icon-delete">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Suppliers Modal -->
    <div v-if="showSuppliersModal" class="modal-overlay" @click.self="showSuppliersModal = false">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>Suppliers</h2>
          <button @click="showSuppliersModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-content">
          <button @click="showAddSupplierForm = true" class="btn-primary full-width mb-3">
            <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Supplier
          </button>

          <form v-if="showAddSupplierForm" @submit.prevent="saveSupplier" class="supplier-form">
            <div class="form-row">
              <div class="form-group">
                <input v-model="supplierForm.name" type="text" class="form-input" placeholder="Supplier name *" required />
              </div>
              <div class="form-group">
                <input v-model="supplierForm.contactPerson" type="text" class="form-input" placeholder="Contact person" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <input v-model="supplierForm.email" type="email" class="form-input" placeholder="Email" />
              </div>
              <div class="form-group">
                <input v-model="supplierForm.phone" type="tel" class="form-input" placeholder="Phone" />
              </div>
            </div>
            <div class="form-group">
              <input v-model="supplierForm.address" type="text" class="form-input" placeholder="Address" />
            </div>
            <div class="form-group">
              <textarea v-model="supplierForm.notes" class="form-textarea" rows="2" placeholder="Notes"></textarea>
            </div>
            <div class="form-actions">
              <button type="button" @click="showAddSupplierForm = false" class="btn-secondary">Cancel</button>
              <button type="submit" class="btn-primary">Save</button>
            </div>
          </form>

          <div class="suppliers-list">
            <div v-for="sup in suppliers" :key="sup.id" class="supplier-item">
              <div class="supplier-info">
                <div class="supplier-name">{{ sup.name }}</div>
                <div v-if="sup.contact_person" class="supplier-detail">Contact: {{ sup.contact_person }}</div>
                <div v-if="sup.email" class="supplier-detail">{{ sup.email }}</div>
                <div v-if="sup.phone" class="supplier-detail">{{ sup.phone }}</div>
              </div>
              <button @click="deleteSupplier(sup.id)" class="btn-icon-delete">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Batch Import Modal -->
    <div v-if="showBatchImportModal" class="modal-overlay" @click.self="closeBatchImportModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>Batch Import Items</h2>
          <button @click="closeBatchImportModal" class="modal-close">×</button>
        </div>
        <div class="modal-content">
          <div v-if="!batchImportResults" class="batch-import-section">
            <div class="batch-import-instructions">
              <h3>Import Multiple Items</h3>
              <p>Upload a CSV file with your inventory items. The file should include these columns:</p>
              <ul class="batch-columns-list">
                <li><strong>name</strong> - Item name (required)</li>
                <li><strong>description</strong> - Item description</li>
                <li><strong>sku</strong> - Stock Keeping Unit</li>
                <li><strong>categoryId</strong> - Category ID (must exist)</li>
                <li><strong>supplierId</strong> - Supplier ID (must exist)</li>
                <li><strong>quantity</strong> - Current quantity</li>
                <li><strong>minQuantity</strong> - Minimum stock level</li>
                <li><strong>unit</strong> - Unit of measurement (kg, unit, liter, etc.)</li>
                <li><strong>unitCost</strong> - Cost per unit</li>
                <li><strong>location</strong> - Storage location</li>
                <li><strong>expiryDate</strong> - Expiry date (YYYY-MM-DD)</li>
              </ul>
              <button @click="downloadTemplate" class="btn-secondary full-width mb-3">
                <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Template
              </button>
            </div>

            <div class="file-upload-section">
              <input 
                type="file" 
                accept=".csv" 
                @change="handleBatchFileUpload" 
                id="csvUpload"
                style="display: none"
              />
              <label for="csvUpload" class="file-upload-label">
                <svg class="file-upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span v-if="!batchImportFile">Click to upload CSV file</span>
                <span v-else>{{ batchImportFile.name }}</span>
              </label>
            </div>

            <div v-if="batchPreviewData.length > 0" class="batch-preview">
              <h3>Preview ({{ batchPreviewData.length }} items)</h3>
              <div class="batch-preview-table-container">
                <table class="batch-preview-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>SKU</th>
                      <th>Quantity</th>
                      <th>Unit</th>
                      <th>Cost</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in batchPreviewData" :key="index">
                      <td>{{ index + 1 }}</td>
                      <td>{{ item.name }}</td>
                      <td>{{ item.sku }}</td>
                      <td>{{ item.quantity }}</td>
                      <td>{{ item.unit }}</td>
                      <td>{{ item.unitCost ? '$' + item.unitCost.toFixed(2) : '-' }}</td>
                      <td>{{ item.location || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="modal-actions">
                <button @click="closeBatchImportModal" class="btn-secondary">Cancel</button>
                <button @click="processBatchImport" class="btn-primary">Import {{ batchPreviewData.length }} Items</button>
              </div>
            </div>
          </div>

          <div v-if="batchImportResults" class="batch-results">
            <div class="batch-results-summary">
              <div v-if="batchImportResults.success.length > 0" class="result-success">
                <svg class="result-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3>Successfully Imported: {{ batchImportResults.success.length }} items</h3>
              </div>
              
              <div v-if="batchImportResults.errors.length > 0" class="result-error">
                <svg class="result-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3>Failed: {{ batchImportResults.errors.length }} items</h3>
                <ul class="error-list">
                  <li v-for="error in batchImportResults.errors" :key="error.row">
                    Row {{ error.row }}: {{ error.name }} - {{ error.error }}
                  </li>
                </ul>
              </div>
            </div>
            <button @click="closeBatchImportModal" class="btn-primary full-width">Done</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Sidebar from '../components/Sidebar.vue';

const { ipcRenderer } = window.require('electron');

const items = ref([]);
const categories = ref([]);
const suppliers = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedCategory = ref(null);

const showItemModal = ref(false);
const showStockModal = ref(false);
const showCategoriesModal = ref(false);
const showSuppliersModal = ref(false);
const showAddCategoryForm = ref(false);
const showAddSupplierForm = ref(false);
const showBatchImportModal = ref(false);
const batchImportFile = ref(null);
const batchPreviewData = ref([]);
const batchImportResults = ref(null);

const editingItem = ref(null);
const stockItem = ref(null);

const itemForm = ref({
  name: '',
  description: '',
  sku: '',
  categoryId: null,
  supplierId: null,
  quantity: 0,
  minQuantity: 0,
  unit: 'unit',
  unitCost: null,
  location: '',
  expiryDate: '',
  enableLowStockAlert: true
});

const stockForm = ref({
  adjustment: 0,
  notes: '',
  vendor: ''
});

const categoryForm = ref({
  name: '',
  description: ''
});

const supplierForm = ref({
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  notes: ''
});

const filteredItems = computed(() => {
  let filtered = items.value;

  if (selectedCategory.value === 'low-stock') {
    filtered = filtered.filter(item => item.is_low_stock);
  } else if (selectedCategory.value !== null) {
    filtered = filtered.filter(item => item.category_id === selectedCategory.value);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.sku?.toLowerCase().includes(query)
    );
  }

  return filtered;
});

const lowStockCount = computed(() => {
  return items.value.filter(item => item.is_low_stock).length;
});

const totalInventoryValue = computed(() => {
  return items.value.reduce((sum, item) => {
    return sum + (parseFloat(item.total_value) || 0);
  }, 0);
});

const loadInventory = async () => {
  loading.value = true;
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    const [itemsData, categoriesData, suppliersData] = await Promise.all([
      ipcRenderer.invoke('inventory:get-all-items', currentUser.businessId),
      ipcRenderer.invoke('inventory:get-categories', currentUser.businessId),
      ipcRenderer.invoke('inventory:get-suppliers', currentUser.businessId)
    ]);

    items.value = itemsData;
    categories.value = categoriesData;
    suppliers.value = suppliersData;
  } catch (error) {
    console.error('Error loading inventory:', error);
  } finally {
    loading.value = false;
  }
};

const openItemModal = (item = null) => {
  if (item) {
    editingItem.value = item;
    itemForm.value = {
      name: item.name,
      description: item.description || '',
      sku: item.sku || '',
      categoryId: item.category_id,
      supplierId: item.supplier_id,
      quantity: item.quantity,
      minQuantity: item.min_quantity,
      unit: item.unit,
      unitCost: item.unit_cost,
      location: item.location || '',
      expiryDate: item.expiry_date || ''
    };
  } else {
    editingItem.value = null;
    itemForm.value = {
      name: '',
      description: '',
      sku: '',
      categoryId: null,
      supplierId: null,
      quantity: 0,
      minQuantity: 0,
      unit: 'unit',
      unitCost: null,
      location: '',
      expiryDate: ''
    };
  }
  showItemModal.value = true;
};

const closeItemModal = () => {
  showItemModal.value = false;
  editingItem.value = null;
};

const editItem = (item) => {
  openItemModal(item);
};

const saveItem = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // Clean the form data to ensure all values are serializable
    const cleanedData = {
      name: itemForm.value.name || '',
      description: itemForm.value.description || '',
      sku: itemForm.value.sku || '',
      categoryId: itemForm.value.categoryId || null,
      supplierId: itemForm.value.supplierId || null,
      quantity: Number(itemForm.value.quantity) || 0,
      minQuantity: Number(itemForm.value.minQuantity) || 0,
      unit: itemForm.value.unit || 'unit',
      unitCost: itemForm.value.unitCost ? Number(itemForm.value.unitCost) : 0,
      location: itemForm.value.location || '',
      expiryDate: itemForm.value.expiryDate || '',
      enableLowStockAlert: itemForm.value.enableLowStockAlert !== false
    };

    if (editingItem.value) {
      await ipcRenderer.invoke('inventory:update-item', {
        businessId: currentUser.businessId,
        itemId: editingItem.value.id,
        itemData: cleanedData
      });
    } else {
      await ipcRenderer.invoke('inventory:create-item', {
        businessId: currentUser.businessId,
        itemData: cleanedData
      });
    }

    closeItemModal();
    await loadInventory();
  } catch (error) {
    console.error('Error saving item:', error);
    alert('Failed to save item');
  }
};

const deleteItem = async (item) => {
  if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;

  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    await ipcRenderer.invoke('inventory:delete-item', {
      businessId: currentUser.businessId,
      itemId: item.id
    });
    await loadInventory();
  } catch (error) {
    console.error('Error deleting item:', error);
    alert('Failed to delete item');
  }
};

const openStockModal = (item) => {
  stockItem.value = item;
  stockForm.value = {
    adjustment: 0,
    notes: '',
    vendor: ''
  };
  showStockModal.value = true;
};

const saveStockAdjustment = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Determine transaction type based on adjustment
    let transactionType = stockForm.value.adjustment > 0 ? 'purchase' : 'stock_out';
    if (stockForm.value.notes && stockForm.value.notes.toLowerCase().includes('waste')) {
      transactionType = 'waste';
    } else if (stockForm.value.notes && stockForm.value.notes.toLowerCase().includes('spoil')) {
      transactionType = 'spoilage';
    }
    
    await ipcRenderer.invoke('inventory:adjust-stock', {
      businessId: currentUser.businessId,
      itemId: stockItem.value.id,
      adjustment: stockForm.value.adjustment,
      userId: currentUser.userId,
      notes: stockForm.value.notes,
      transactionType: transactionType,
      vendor: stockForm.value.vendor || null
    });

    showStockModal.value = false;
    await loadInventory();
  } catch (error) {
    console.error('Error adjusting stock:', error);
    alert('Failed to adjust stock');
  }
};

const saveCategory = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    await ipcRenderer.invoke('inventory:create-category', {
      businessId: currentUser.businessId,
      categoryData: categoryForm.value
    });

    categoryForm.value = { name: '', description: '' };
    showAddCategoryForm.value = false;
    await loadInventory();
  } catch (error) {
    console.error('Error saving category:', error);
    alert('Failed to save category');
  }
};

const deleteCategory = async (categoryId) => {
  if (!confirm('Delete this category? Items in this category will not be deleted.')) return;

  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    await ipcRenderer.invoke('inventory:delete-category', {
      businessId: currentUser.businessId,
      categoryId
    });
    await loadInventory();
  } catch (error) {
    console.error('Error deleting category:', error);
    alert('Failed to delete category');
  }
};

const saveSupplier = async () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Convert reactive object to plain object for IPC
    const plainSupplierData = {
      name: supplierForm.value.name,
      contactPerson: supplierForm.value.contactPerson,
      email: supplierForm.value.email,
      phone: supplierForm.value.phone,
      address: supplierForm.value.address,
      notes: supplierForm.value.notes
    };
    
    await ipcRenderer.invoke('inventory:create-supplier', {
      businessId: currentUser.businessId,
      supplierData: plainSupplierData
    });

    supplierForm.value = {
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      notes: ''
    };
    showAddSupplierForm.value = false;
    await loadInventory();
  } catch (error) {
    console.error('Error saving supplier:', error);
    alert('Failed to save supplier');
  }
};

const deleteSupplier = async (supplierId) => {
  if (!confirm('Delete this supplier? Items linked to this supplier will not be deleted.')) return;

  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    await ipcRenderer.invoke('inventory:delete-supplier', {
      businessId: currentUser.businessId,
      supplierId
    });
    await loadInventory();
  } catch (error) {
    console.error('Error deleting supplier:', error);
    alert('Failed to delete supplier');
  }
};

// Batch Import Functions
const parseCSV = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }
  
  return data;
};

const handleBatchFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  batchImportFile.value = file;
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const csvData = parseCSV(e.target.result);
      
      // Map CSV columns to item properties
      batchPreviewData.value = csvData.map(row => ({
        name: row.name || row.Name || '',
        description: row.description || row.Description || '',
        sku: row.sku || row.SKU || '',
        categoryId: row.categoryId || row.category_id || null,
        supplierId: row.supplierId || row.supplier_id || null,
        quantity: parseFloat(row.quantity || row.Quantity || 0),
        minQuantity: parseFloat(row.minQuantity || row.min_quantity || row['Min Quantity'] || 0),
        unit: row.unit || row.Unit || 'unit',
        unitCost: row.unitCost || row.unit_cost || row['Unit Cost'] ? parseFloat(row.unitCost || row.unit_cost || row['Unit Cost']) : null,
        location: row.location || row.Location || '',
        expiryDate: row.expiryDate || row.expiry_date || row['Expiry Date'] || ''
      }));
      
      batchImportResults.value = null;
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Failed to parse CSV file. Please check the format.');
    }
  };
  
  reader.readAsText(file);
};

const downloadTemplate = () => {
  const template = 'name,description,sku,categoryId,supplierId,quantity,minQuantity,unit,unitCost,location,expiryDate\n' +
                   'Sample Item,Description here,SKU001,1,1,100,10,kg,5.50,Warehouse A,2025-12-31\n' +
                   'Another Item,Another description,SKU002,2,1,50,5,unit,12.00,Warehouse B,';
  
  const blob = new Blob([template], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inventory_template.csv';
  a.click();
  URL.revokeObjectURL(url);
};

const processBatchImport = async () => {
  if (batchPreviewData.value.length === 0) {
    alert('No data to import');
    return;
  }
  
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Convert reactive array to plain array of plain objects for IPC
    const plainItemsArray = batchPreviewData.value.map(item => ({
      name: item.name,
      description: item.description,
      sku: item.sku,
      categoryId: item.categoryId,
      supplierId: item.supplierId,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      unit: item.unit,
      unitCost: item.unitCost,
      location: item.location,
      expiryDate: item.expiryDate
    }));
    
    const results = await ipcRenderer.invoke('inventory:create-items-batch', {
      businessId: currentUser.businessId,
      itemsArray: plainItemsArray
    });
    
    batchImportResults.value = results;
    
    if (results.success.length > 0) {
      await loadInventory();
    }
  } catch (error) {
    console.error('Error importing batch:', error);
    alert('Failed to import items');
  }
};

const closeBatchImportModal = () => {
  showBatchImportModal.value = false;
  batchImportFile.value = null;
  batchPreviewData.value = [];
  batchImportResults.value = null;
};

onMounted(() => {
  loadInventory();
});
</script>

<style scoped>
.inventory-page {
  display: flex;
  height: 100vh;
  background: #0f1419;
  color: #d1d5db;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  color: #9ca3af;
  font-size: 0.875rem;
}

.btn-primary, .btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #d1d5db;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-icon.blue {
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
}

.stat-icon.red {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

.stat-icon.green {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.stat-icon.yellow {
  background: rgba(245, 158, 11, 0.1);
  color: #fbbf24;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #9ca3af;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #f3f4f6;
}

.filter-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 300px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #6b7280;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  background: #1f2937;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #f3f4f6;
  font-size: 0.875rem;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.filter-chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.filter-chip:hover {
  background: rgba(255, 255, 255, 0.1);
}

.filter-chip.active {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  color: #60a5fa;
}

.loading, .empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  opacity: 0.5;
}

.table-container {
  background: linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  overflow-x: auto;
}

.inventory-table {
  width: 100%;
  border-collapse: collapse;
}

.inventory-table thead {
  background: rgba(0, 0, 0, 0.3);
}

.inventory-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #9ca3af;
  font-size: 0.75rem;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  white-space: nowrap;
}

.inventory-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #d1d5db;
}

.inventory-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.low-stock-row {
  background: rgba(239, 68, 68, 0.05);
}

.item-name {
  font-weight: 500;
  color: #f3f4f6;
}

.item-desc {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.category-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.text-muted {
  color: #6b7280;
}

.low-stock-text {
  color: #f87171;
  font-weight: 600;
}

.total-value {
  font-weight: 600;
  color: #10b981;
}

.status-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.ok {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-badge.low {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

.action-buttons {
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
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-large {
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f3f4f6;
}

.modal-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 2rem;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
}

.modal-close:hover {
  color: #f3f4f6;
}

.modal-content {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #d1d5db;
  margin-bottom: 0.5rem;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 0.75rem;
  background: #1f2937;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #f3f4f6;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.stock-current, .stock-preview {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stock-label {
  color: #9ca3af;
  font-size: 0.875rem;
}

.stock-value {
  color: #f3f4f6;
  font-size: 1.25rem;
  font-weight: 700;
}

.field-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.full-width {
  width: 100%;
}

.mb-3 {
  margin-bottom: 1rem;
}

.category-form, .supplier-form {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.categories-list, .suppliers-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
}

.category-item, .supplier-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
}

.category-name, .supplier-name {
  font-weight: 600;
  color: #f3f4f6;
  margin-bottom: 0.25rem;
}

.category-desc, .supplier-detail {
  font-size: 0.875rem;
  color: #9ca3af;
}

.supplier-info {
  flex: 1;
}

.btn-icon-delete {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #f87171;
  padding: 0.375rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon-delete:hover {
  background: rgba(239, 68, 68, 0.2);
}

.btn-icon-delete svg {
  width: 16px;
  height: 16px;
  display: block;
}

/* Batch Import Styles */
.batch-import-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.batch-import-instructions h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #f3f4f6;
  margin-bottom: 0.75rem;
}

.batch-import-instructions p {
  color: #9ca3af;
  margin-bottom: 0.75rem;
}

.batch-columns-list {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.batch-columns-list li {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #d1d5db;
}

.batch-columns-list strong {
  color: #60a5fa;
}

.file-upload-section {
  margin: 1.5rem 0;
}

.file-upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  border: 2px dashed rgba(96, 165, 250, 0.3);
  border-radius: 0.5rem;
  background: rgba(59, 130, 246, 0.05);
  cursor: pointer;
  transition: all 0.2s;
}

.file-upload-label:hover {
  border-color: rgba(96, 165, 250, 0.5);
  background: rgba(59, 130, 246, 0.08);
}

.file-upload-icon {
  width: 48px;
  height: 48px;
  color: #60a5fa;
  margin-bottom: 1rem;
}

.file-upload-label span {
  font-size: 1rem;
  color: #d1d5db;
}

.batch-preview {
  margin-top: 1.5rem;
}

.batch-preview h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #f3f4f6;
  margin-bottom: 1rem;
}

.batch-preview-table-container {
  max-height: 400px;
  overflow: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.batch-preview-table {
  width: 100%;
  border-collapse: collapse;
}

.batch-preview-table thead {
  position: sticky;
  top: 0;
  background: #1a1f2e;
  z-index: 1;
}

.batch-preview-table th {
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #f3f4f6;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.875rem;
}

.batch-preview-table td {
  padding: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #d1d5db;
  font-size: 0.875rem;
}

.batch-preview-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

.batch-results {
  padding: 1rem;
}

.batch-results-summary {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.result-success, .result-error {
  padding: 1.5rem;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.result-success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.result-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.result-icon {
  width: 48px;
  height: 48px;
}

.result-success .result-icon {
  color: #22c55e;
}

.result-error .result-icon {
  color: #f87171;
}

.result-success h3 {
  color: #22c55e;
  font-size: 1.25rem;
  font-weight: 600;
}

.result-error h3 {
  color: #f87171;
  font-size: 1.25rem;
  font-weight: 600;
}

.error-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 300px;
  overflow-y: auto;
}

/* Checkbox Group */
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  color: #e2e8f0;
  font-weight: 500;
}

.checkbox-label input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
  accent-color: #3b82f6;
}

.error-list li {
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
  color: #fca5a5;
  font-size: 0.875rem;
}
</style>
