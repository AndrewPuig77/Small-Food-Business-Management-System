const { getDb, saveDatabase } = require('../database/database');

// Helper function to escape SQL strings
const escape = (str) => {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
};

// ==================== INVENTORY ITEMS ====================

// Get all inventory items
const getAllItems = (businessId) => {
  const db = getDb();
  const query = `
    SELECT 
      i.*,
      c.name as category_name,
      s.name as supplier_name,
      CASE 
        WHEN i.quantity <= i.min_quantity THEN 1 
        ELSE 0 
      END as is_low_stock
    FROM inventory_items i
    LEFT JOIN inventory_categories c ON i.category_id = c.id
    LEFT JOIN suppliers s ON i.supplier_id = s.id
    WHERE i.business_id = ${businessId}
    ORDER BY i.name
  `;
  
  const result = db.exec(query);
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const item = {};
    columns.forEach((col, idx) => {
      item[col] = row[idx];
    });
    return item;
  });
};

// Get single item by ID
const getItemById = (businessId, itemId) => {
  const db = getDb();
  const query = `
    SELECT 
      i.*,
      c.name as category_name,
      s.name as supplier_name
    FROM inventory_items i
    LEFT JOIN inventory_categories c ON i.category_id = c.id
    LEFT JOIN suppliers s ON i.supplier_id = s.id
    WHERE i.business_id = ${businessId} AND i.id = ${itemId}
  `;
  
  const result = db.exec(query);
  if (result.length === 0) return null;
  
  const columns = result[0].columns;
  const values = result[0].values[0];
  
  const item = {};
  columns.forEach((col, idx) => {
    item[col] = values[idx];
  });
  
  return item;
};

// Create inventory item
const createItem = (businessId, itemData) => {
  const db = getDb();
  
  const totalValue = itemData.unitCost && itemData.quantity 
    ? itemData.unitCost * itemData.quantity 
    : null;
  
  const query = `
    INSERT INTO inventory_items (
      business_id, category_id, supplier_id, name, description, sku,
      unit, quantity, min_quantity, unit_cost, total_value, location, expiry_date
    ) VALUES (
      ${businessId},
      ${itemData.categoryId || 'NULL'},
      ${itemData.supplierId || 'NULL'},
      ${escape(itemData.name)},
      ${escape(itemData.description)},
      ${escape(itemData.sku)},
      ${escape(itemData.unit)},
      ${itemData.quantity || 0},
      ${itemData.minQuantity || 0},
      ${itemData.unitCost || 'NULL'},
      ${totalValue || 'NULL'},
      ${escape(itemData.location)},
      ${escape(itemData.expiryDate)}
    )
  `;
  
  db.run(query);
  saveDatabase();
  
  const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
  const itemId = lastIdResult[0].values[0][0];
  
  return getItemById(businessId, itemId);
};

// Create multiple inventory items in batch
const createItemsBatch = (businessId, itemsArray) => {
  const db = getDb();
  const results = {
    success: [],
    errors: []
  };
  
  itemsArray.forEach((itemData, index) => {
    try {
      // Validate required fields
      if (!itemData.name || itemData.name.trim() === '') {
        throw new Error('Name is required');
      }
      
      const totalValue = itemData.unitCost && itemData.quantity 
        ? itemData.unitCost * itemData.quantity 
        : null;
      
      const query = `
        INSERT INTO inventory_items (
          business_id, category_id, supplier_id, name, description, sku,
          unit, quantity, min_quantity, unit_cost, total_value, location, expiry_date
        ) VALUES (
          ${businessId},
          ${itemData.categoryId || 'NULL'},
          ${itemData.supplierId || 'NULL'},
          ${escape(itemData.name)},
          ${escape(itemData.description)},
          ${escape(itemData.sku)},
          ${escape(itemData.unit)},
          ${itemData.quantity || 0},
          ${itemData.minQuantity || 0},
          ${itemData.unitCost || 'NULL'},
          ${totalValue || 'NULL'},
          ${escape(itemData.location)},
          ${escape(itemData.expiryDate)}
        )
      `;
      
      db.run(query);
      results.success.push({ row: index + 1, name: itemData.name });
    } catch (error) {
      results.errors.push({ 
        row: index + 1, 
        name: itemData.name || 'Unknown', 
        error: error.message 
      });
    }
  });
  
  saveDatabase();
  
  return results;
};

// Update inventory item
const updateItem = (businessId, itemId, itemData) => {
  const db = getDb();
  
  const totalValue = itemData.unitCost && itemData.quantity 
    ? itemData.unitCost * itemData.quantity 
    : null;
  
  const query = `
    UPDATE inventory_items SET
      category_id = ${itemData.categoryId || 'NULL'},
      supplier_id = ${itemData.supplierId || 'NULL'},
      name = ${escape(itemData.name)},
      description = ${escape(itemData.description)},
      sku = ${escape(itemData.sku)},
      unit = ${escape(itemData.unit)},
      quantity = ${itemData.quantity || 0},
      min_quantity = ${itemData.minQuantity || 0},
      unit_cost = ${itemData.unitCost || 'NULL'},
      total_value = ${totalValue || 'NULL'},
      location = ${escape(itemData.location)},
      expiry_date = ${escape(itemData.expiryDate)},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${itemId} AND business_id = ${businessId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return getItemById(businessId, itemId);
};

// Delete inventory item
const deleteItem = (businessId, itemId) => {
  const db = getDb();
  
  const query = `
    DELETE FROM inventory_items 
    WHERE id = ${itemId} AND business_id = ${businessId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return { success: true };
};

// Adjust stock quantity
const adjustStock = (businessId, itemId, adjustment, userId, notes) => {
  const db = getDb();
  
  // Get current item
  const item = getItemById(businessId, itemId);
  if (!item) throw new Error('Item not found');
  
  const newQuantity = parseFloat(item.quantity) + parseFloat(adjustment);
  
  // Update item quantity
  db.run(`
    UPDATE inventory_items 
    SET quantity = ${newQuantity},
        total_value = CASE 
          WHEN unit_cost IS NOT NULL THEN ${newQuantity} * unit_cost 
          ELSE total_value 
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${itemId} AND business_id = ${businessId}
  `);
  
  // Record transaction
  const transactionType = adjustment > 0 ? 'stock_in' : 'stock_out';
  const quantity = Math.abs(adjustment);
  const unitCost = item.unit_cost || 0;
  const totalCost = quantity * unitCost;
  
  db.run(`
    INSERT INTO inventory_transactions (
      business_id, item_id, transaction_type, quantity, 
      unit_cost, total_cost, notes, created_by
    ) VALUES (
      ${businessId}, ${itemId}, ${escape(transactionType)}, ${quantity},
      ${unitCost}, ${totalCost}, ${escape(notes)}, ${userId || 'NULL'}
    )
  `);
  
  saveDatabase();
  
  return getItemById(businessId, itemId);
};

// Get low stock items
const getLowStockItems = (businessId) => {
  const db = getDb();
  const query = `
    SELECT 
      i.*,
      c.name as category_name,
      s.name as supplier_name
    FROM inventory_items i
    LEFT JOIN inventory_categories c ON i.category_id = c.id
    LEFT JOIN suppliers s ON i.supplier_id = s.id
    WHERE i.business_id = ${businessId} AND i.quantity <= i.min_quantity
    ORDER BY i.name
  `;
  
  const result = db.exec(query);
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const item = {};
    columns.forEach((col, idx) => {
      item[col] = row[idx];
    });
    return item;
  });
};

// ==================== CATEGORIES ====================

// Get all categories
const getAllCategories = (businessId) => {
  const db = getDb();
  const query = `
    SELECT * FROM inventory_categories 
    WHERE business_id = ${businessId}
    ORDER BY name
  `;
  
  const result = db.exec(query);
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const category = {};
    columns.forEach((col, idx) => {
      category[col] = row[idx];
    });
    return category;
  });
};

// Create category
const createCategory = (businessId, categoryData) => {
  const db = getDb();
  
  const query = `
    INSERT INTO inventory_categories (business_id, name, description)
    VALUES (${businessId}, ${escape(categoryData.name)}, ${escape(categoryData.description)})
  `;
  
  db.run(query);
  saveDatabase();
  
  const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
  const categoryId = lastIdResult[0].values[0][0];
  
  return { id: categoryId, ...categoryData };
};

// Update category
const updateCategory = (businessId, categoryId, categoryData) => {
  const db = getDb();
  
  const query = `
    UPDATE inventory_categories SET
      name = ${escape(categoryData.name)},
      description = ${escape(categoryData.description)}
    WHERE id = ${categoryId} AND business_id = ${businessId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return { id: categoryId, ...categoryData };
};

// Delete category
const deleteCategory = (businessId, categoryId) => {
  const db = getDb();
  
  const query = `
    DELETE FROM inventory_categories 
    WHERE id = ${categoryId} AND business_id = ${businessId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return { success: true };
};

// ==================== SUPPLIERS ====================

// Get all suppliers
const getAllSuppliers = (businessId) => {
  const db = getDb();
  const query = `
    SELECT * FROM suppliers 
    WHERE business_id = ${businessId}
    ORDER BY name
  `;
  
  const result = db.exec(query);
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const supplier = {};
    columns.forEach((col, idx) => {
      supplier[col] = row[idx];
    });
    return supplier;
  });
};

// Create supplier
const createSupplier = (businessId, supplierData) => {
  const db = getDb();
  
  const query = `
    INSERT INTO suppliers (
      business_id, name, contact_person, email, phone, address, notes
    ) VALUES (
      ${businessId},
      ${escape(supplierData.name)},
      ${escape(supplierData.contactPerson)},
      ${escape(supplierData.email)},
      ${escape(supplierData.phone)},
      ${escape(supplierData.address)},
      ${escape(supplierData.notes)}
    )
  `;
  
  db.run(query);
  saveDatabase();
  
  const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
  const supplierId = lastIdResult[0].values[0][0];
  
  return { id: supplierId, ...supplierData };
};

// Update supplier
const updateSupplier = (businessId, supplierId, supplierData) => {
  const db = getDb();
  
  const query = `
    UPDATE suppliers SET
      name = ${escape(supplierData.name)},
      contact_person = ${escape(supplierData.contactPerson)},
      email = ${escape(supplierData.email)},
      phone = ${escape(supplierData.phone)},
      address = ${escape(supplierData.address)},
      notes = ${escape(supplierData.notes)},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${supplierId} AND business_id = ${businessId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return { id: supplierId, ...supplierData };
};

// Delete supplier
const deleteSupplier = (businessId, supplierId) => {
  const db = getDb();
  
  const query = `
    DELETE FROM suppliers 
    WHERE id = ${supplierId} AND business_id = ${businessId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return { success: true };
};

// ==================== TRANSACTIONS ====================

// Get item transaction history
const getItemTransactions = (businessId, itemId, limit = 50) => {
  const db = getDb();
  const query = `
    SELECT 
      t.*,
      u.full_name as created_by_name
    FROM inventory_transactions t
    LEFT JOIN users u ON t.created_by = u.id
    WHERE t.business_id = ${businessId} AND t.item_id = ${itemId}
    ORDER BY t.created_at DESC
    LIMIT ${limit}
  `;
  
  const result = db.exec(query);
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const transaction = {};
    columns.forEach((col, idx) => {
      transaction[col] = row[idx];
    });
    return transaction;
  });
};

// Get all transactions
const getAllTransactions = (businessId, limit = 100) => {
  const db = getDb();
  const query = `
    SELECT 
      t.*,
      i.name as item_name,
      u.full_name as created_by_name
    FROM inventory_transactions t
    LEFT JOIN inventory_items i ON t.item_id = i.id
    LEFT JOIN users u ON t.created_by = u.id
    WHERE t.business_id = ${businessId}
    ORDER BY t.created_at DESC
    LIMIT ${limit}
  `;
  
  const result = db.exec(query);
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const transaction = {};
    columns.forEach((col, idx) => {
      transaction[col] = row[idx];
    });
    return transaction;
  });
};

module.exports = {
  // Items
  getAllItems,
  getItemById,
  createItem,
  createItemsBatch,
  updateItem,
  deleteItem,
  adjustStock,
  getLowStockItems,
  
  // Categories
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  
  // Suppliers
  getAllSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  
  // Transactions
  getItemTransactions,
  getAllTransactions
};
