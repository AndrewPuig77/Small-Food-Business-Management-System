const { getDb, saveDatabase } = require('../database/database');

// ==================== EXPENSES ====================

// Get all expenses for a business
const getAllExpenses = (businessId) => {
  const db = getDb();
  const query = `
    SELECT e.*, u.username as created_by_name
    FROM expenses e
    LEFT JOIN users u ON e.created_by = u.id
    WHERE e.business_id = ?
    ORDER BY e.expense_date DESC, e.created_at DESC
  `;
  
  const results = db.exec(query, [businessId]);
  
  if (!results || results.length === 0) {
    return [];
  }
  
  const columns = results[0].columns;
  const values = results[0].values;
  
  return values.map(row => {
    const obj = {};
    columns.forEach((col, index) => {
      obj[col] = row[index];
    });
    return obj;
  });
};

// Get expenses by date range
const getExpensesByDateRange = (businessId, startDate, endDate) => {
  const db = getDb();
  const query = `
    SELECT e.*, u.username as created_by_name
    FROM expenses e
    LEFT JOIN users u ON e.created_by = u.id
    WHERE e.business_id = ?
      AND DATE(e.expense_date) BETWEEN DATE(?) AND DATE(?)
    ORDER BY e.expense_date DESC, e.created_at DESC
  `;
  
  const results = db.exec(query, [businessId, startDate, endDate]);
  
  if (!results || results.length === 0) {
    return [];
  }
  
  const columns = results[0].columns;
  const values = results[0].values;
  
  return values.map(row => {
    const obj = {};
    columns.forEach((col, index) => {
      obj[col] = row[index];
    });
    return obj;
  });
};

// Get expenses by category
const getExpensesByCategory = (businessId, startDate, endDate) => {
  const db = getDb();
  const query = `
    SELECT 
      category,
      SUM(amount) as total_amount,
      COUNT(*) as count
    FROM expenses
    WHERE business_id = ${businessId}
      AND DATE(expense_date) BETWEEN DATE(${escape(startDate)}) AND DATE(${escape(endDate)})
    GROUP BY category
    ORDER BY total_amount DESC
  `;
  
  const results = db.exec(query);
  
  if (!results || results.length === 0) {
    return [];
  }
  
  const columns = results[0].columns;
  const values = results[0].values;
  
  return values.map(row => {
    const obj = {};
    columns.forEach((col, index) => {
      obj[col] = row[index];
    });
    return obj;
  });
};

// Create new expense
const createExpense = (businessId, expenseData) => {
  const db = getDb();
  
  const { category, vendor, amount, description, expense_date, created_by } = expenseData;
  
  const query = `
    INSERT INTO expenses (business_id, category, vendor, amount, description, expense_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [businessId, category, vendor || null, amount, description || null, expense_date, created_by || null]);
  saveDatabase();
  
  // Get the inserted expense
  const result = db.exec('SELECT last_insert_rowid() as id');
  const expenseId = result[0].values[0][0];
  
  return getExpenseById(expenseId);
};

// Get expense by ID
const getExpenseById = (expenseId) => {
  const db = getDb();
  const query = `
    SELECT e.*, u.username as created_by_name
    FROM expenses e
    LEFT JOIN users u ON e.created_by = u.id
    WHERE e.id = ?
  `;
  
  const results = db.exec(query, [expenseId]);
  
  if (!results || results.length === 0 || results[0].values.length === 0) {
    return null;
  }
  
  const columns = results[0].columns;
  const values = results[0].values[0];
  
  const expense = {};
  columns.forEach((col, index) => {
    expense[col] = values[index];
  });
  
  return expense;
};

// Update expense
const updateExpense = (expenseId, expenseData) => {
  const db = getDb();
  
  const { category, vendor, amount, description, expense_date } = expenseData;
  
  const query = `
    UPDATE expenses
    SET category = ?,
        vendor = ?,
        amount = ?,
        description = ?,
        expense_date = ?
    WHERE id = ?
  `;
  
  db.run(query, [category, vendor || null, amount, description || null, expense_date, expenseId]);
  saveDatabase();
  
  return getExpenseById(expenseId);
};

// Delete expense
const deleteExpense = (expenseId) => {
  const db = getDb();
  db.run('DELETE FROM expenses WHERE id = ?', [expenseId]);
  saveDatabase();
  return { success: true };
};

// Get total expenses for a date range
const getTotalExpenses = (businessId, startDate, endDate) => {
  const db = getDb();
  
  // Validate parameters
  if (!businessId || !startDate || !endDate) {
    console.error('getTotalExpenses: Missing required parameters', { businessId, startDate, endDate });
    return 0;
  }
  
  const query = `
    SELECT COALESCE(SUM(amount), 0) as total
    FROM expenses
    WHERE business_id = ?
      AND DATE(expense_date) BETWEEN DATE(?) AND DATE(?)
  `;
  
  try {
    const results = db.exec(query, [businessId, startDate, endDate]);
    
    if (!results || results.length === 0) {
      return 0;
    }
    
    return results[0].values[0][0] || 0;
  } catch (error) {
    console.error('Error in getTotalExpenses:', error);
    return 0;
  }
};

// ==================== AUTOMATIC EXPENSES ====================

// Create expense from inventory purchase
const createInventoryExpense = (businessId, inventoryTransaction, createdBy) => {
  const db = getDb();
  
  console.log('Creating inventory expense with data:', inventoryTransaction);
  
  // Get inventory item details
  const itemQuery = `SELECT name FROM inventory_items WHERE id = ${inventoryTransaction.item_id}`;
  const itemResult = db.exec(itemQuery);
  
  if (!itemResult || itemResult.length === 0) {
    console.error('Inventory item not found for id:', inventoryTransaction.item_id);
    return null;
  }
  
  const itemName = itemResult[0].values[0][0];
  console.log('Found item name:', itemName);
  
  const description = `${inventoryTransaction.transaction_type}: ${itemName} (${inventoryTransaction.quantity} ${inventoryTransaction.notes || 'units'})`;
  const category = inventoryTransaction.transaction_type === 'waste' || inventoryTransaction.transaction_type === 'spoilage' 
    ? 'Food/Ingredients' 
    : 'Food/Ingredients';
  const vendor = inventoryTransaction.vendor || 'Inventory';
  const amount = inventoryTransaction.total_cost || 0;
  const expenseDate = new Date().toISOString().split('T')[0];
  
  const query = `
    INSERT INTO expenses (
      business_id, category, vendor, amount, description, 
      expense_date, created_by, is_automatic, linked_inventory_id
    )
    VALUES (
      ${businessId},
      ${escape(category)},
      ${escape(vendor)},
      ${amount},
      ${escape(description)},
      ${escape(expenseDate)},
      ${createdBy || 'NULL'},
      1,
      ${inventoryTransaction.item_id}
    )
  `;
  
  console.log('Executing expense query...');
  db.run(query);
  saveDatabase();
  
  const result = db.exec('SELECT last_insert_rowid() as id');
  const expenseId = result[0].values[0][0];
  
  console.log('Expense created with id:', expenseId);
  return getExpenseById(expenseId);
};

// ==================== RECURRING EXPENSES ====================

// Create recurring expense template
const createRecurringExpense = (businessId, recurringData) => {
  const db = getDb();
  
  const { category, vendor, amount, description, frequency, day_of_month, day_of_week } = recurringData;
  
  // Calculate next due date based on frequency
  let nextDueDate = new Date();
  if (frequency === 'monthly' && day_of_month) {
    nextDueDate.setDate(day_of_month);
    if (nextDueDate < new Date()) {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    }
  } else if (frequency === 'weekly' && day_of_week !== undefined) {
    const today = nextDueDate.getDay();
    const daysUntil = (day_of_week - today + 7) % 7;
    nextDueDate.setDate(nextDueDate.getDate() + (daysUntil || 7));
  } else if (frequency === 'daily') {
    nextDueDate.setDate(nextDueDate.getDate() + 1);
  }
  
  const query = `
    INSERT INTO recurring_expenses (
      business_id, category, vendor, amount, description,
      frequency, day_of_month, day_of_week, next_due_date
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [
    businessId, category, vendor || null, amount, description || null,
    frequency, day_of_month || null, day_of_week || null, nextDueDate.toISOString().split('T')[0]
  ]);
  
  saveDatabase();
  
  const result = db.exec('SELECT last_insert_rowid() as id');
  return result[0].values[0][0];
};

// Get all recurring expenses
const getRecurringExpenses = (businessId) => {
  const db = getDb();
  const query = `
    SELECT * FROM recurring_expenses
    WHERE business_id = ? AND is_active = 1
    ORDER BY next_due_date ASC
  `;
  
  const results = db.exec(query, [businessId]);
  
  if (!results || results.length === 0) {
    return [];
  }
  
  const columns = results[0].columns;
  const values = results[0].values;
  
  return values.map(row => {
    const obj = {};
    columns.forEach((col, index) => {
      obj[col] = row[index];
    });
    return obj;
  });
};

// Process due recurring expenses
const processRecurringExpenses = (businessId) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  
  // Find all due recurring expenses
  const query = `
    SELECT * FROM recurring_expenses
    WHERE business_id = ?
      AND is_active = 1
      AND DATE(next_due_date) <= DATE(?)
  `;
  
  const results = db.exec(query, [businessId, today]);
  
  if (!results || results.length === 0) {
    return [];
  }
  
  const columns = results[0].columns;
  const values = results[0].values;
  
  const dueExpenses = values.map(row => {
    const obj = {};
    columns.forEach((col, index) => {
      obj[col] = row[index];
    });
    return obj;
  });
  
  const createdExpenses = [];
  
  // Create expense entries for each due recurring expense
  dueExpenses.forEach(recurring => {
    // Create the expense
    const expenseData = {
      category: recurring.category,
      vendor: recurring.vendor,
      amount: recurring.amount,
      expense_date: today,
      description: `${recurring.description || recurring.category} (Recurring - ${recurring.frequency})`,
      created_by: null
    };
    
    const expense = createExpense(businessId, expenseData);
    createdExpenses.push(expense);
    
    // Update next due date
    let nextDueDate = new Date(recurring.next_due_date);
    
    if (recurring.frequency === 'monthly') {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    } else if (recurring.frequency === 'weekly') {
      nextDueDate.setDate(nextDueDate.getDate() + 7);
    } else if (recurring.frequency === 'daily') {
      nextDueDate.setDate(nextDueDate.getDate() + 1);
    }
    
    const updateQuery = `
      UPDATE recurring_expenses
      SET last_generated = ?,
          next_due_date = ?
      WHERE id = ?
    `;
    
    db.run(updateQuery, [today, nextDueDate.toISOString().split('T')[0], recurring.id]);
  });
  
  saveDatabase();
  return createdExpenses;
};

// Update recurring expense
const updateRecurringExpense = (recurringId, data) => {
  const db = getDb();
  
  const query = `
    UPDATE recurring_expenses
    SET category = ?,
        vendor = ?,
        amount = ?,
        description = ?,
        frequency = ?,
        day_of_month = ?,
        day_of_week = ?,
        is_active = ?
    WHERE id = ?
  `;
  
  db.run(query, [
    data.category,
    data.vendor || null,
    data.amount,
    data.description || null,
    data.frequency,
    data.day_of_month || null,
    data.day_of_week || null,
    data.is_active !== undefined ? data.is_active : 1,
    recurringId
  ]);
  
  saveDatabase();
  return { success: true };
};

// Delete recurring expense
const deleteRecurringExpense = (recurringId) => {
  const db = getDb();
  db.run('DELETE FROM recurring_expenses WHERE id = ?', [recurringId]);
  saveDatabase();
  return { success: true };
};

module.exports = {
  getAllExpenses,
  getExpensesByDateRange,
  getExpensesByCategory,
  createExpense,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getTotalExpenses,
  createInventoryExpense,
  createRecurringExpense,
  getRecurringExpenses,
  processRecurringExpenses,
  updateRecurringExpense,
  deleteRecurringExpense
};
