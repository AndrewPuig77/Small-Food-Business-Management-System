const { getDb, saveDatabase } = require('../database/database');

// Helper function to escape SQL strings
const escape = (str) => {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
};

// ==================== CUSTOMERS ====================

// Search customers by name or phone
const searchCustomers = (businessId, searchTerm) => {
  const db = getDb();
  const term = `%${searchTerm}%`;
  const query = `
    SELECT * FROM customers 
    WHERE business_id = ${businessId} 
      AND (name LIKE ${escape(term)} OR phone LIKE ${escape(term)} OR email LIKE ${escape(term)})
    ORDER BY name
    LIMIT 20
  `;
  
  const result = db.exec(query);
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const customer = {};
    columns.forEach((col, idx) => {
      customer[col] = row[idx];
    });
    return customer;
  });
};

// Get customer by ID
const getCustomerById = (businessId, customerId) => {
  const db = getDb();
  const query = `
    SELECT * FROM customers 
    WHERE business_id = ${businessId} AND id = ${customerId}
  `;
  
  const result = db.exec(query);
  if (result.length === 0) return null;
  
  const columns = result[0].columns;
  const values = result[0].values[0];
  
  const customer = {};
  columns.forEach((col, idx) => {
    customer[col] = values[idx];
  });
  
  return customer;
};

// Create new customer
const createCustomer = (businessId, customerData) => {
  const db = getDb();
  
  const query = `
    INSERT INTO customers (business_id, name, email, phone, loyalty_points)
    VALUES (
      ${businessId},
      ${escape(customerData.name)},
      ${escape(customerData.email)},
      ${escape(customerData.phone)},
      ${customerData.loyaltyPoints || 0}
    )
  `;
  
  db.run(query);
  saveDatabase();
  
  const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
  const customerId = lastIdResult[0].values[0][0];
  
  return getCustomerById(businessId, customerId);
};

// Update customer loyalty points
const updateCustomerPoints = (businessId, customerId, pointsChange, totalSpent) => {
  const db = getDb();
  
  const query = `
    UPDATE customers 
    SET loyalty_points = loyalty_points + ${pointsChange},
        total_spent = total_spent + ${totalSpent || 0},
        visit_count = visit_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${customerId} AND business_id = ${businessId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return getCustomerById(businessId, customerId);
};

// ==================== TRANSACTIONS ====================

// Create new transaction
const createTransaction = (businessId, transactionData) => {
  const db = getDb();
  ensureKitchenColumns(db);
  
  const pointsEarned = transactionData.pointsEarned || 0;
  const pointsRedeemed = transactionData.pointsRedeemed || 0;

  // Determine next daily_order_number for this business (resets each day)
  let nextDailyOrderNumber = 1;
  try {
    const maxRes = db.exec(`SELECT COALESCE(MAX(daily_order_number), 0) as maxnum FROM transactions WHERE business_id = ${businessId} AND DATE(created_at) = DATE('now')`);
    if (maxRes.length && maxRes[0].values && maxRes[0].values.length) {
      const maxnum = maxRes[0].values[0][0];
      nextDailyOrderNumber = (Number(maxnum) || 0) + 1;
    }
  } catch (e) {
    // ignore, default to 1
  }

  const query = `
    INSERT INTO transactions (
      business_id, cashier_id, customer_id, subtotal, tax, discount, tip_amount, total, 
      points_earned, points_redeemed, status, notes, kitchen_status, daily_order_number
    ) VALUES (
      ${businessId},
      ${transactionData.cashierId},
      ${transactionData.customerId || 'NULL'},
      ${transactionData.subtotal},
      ${transactionData.tax || 0},
      ${transactionData.discount || 0},
      ${transactionData.tipAmount || 0},
      ${transactionData.total},
      ${pointsEarned},
      ${pointsRedeemed},
      ${escape(transactionData.status || 'completed')},
      ${escape(transactionData.notes)},
      ${escape(transactionData.kitchenStatus || 'pending')},
      ${nextDailyOrderNumber}
    )
  `;
  
  db.run(query);
  saveDatabase();

  try {
    console.log('[POS] createTransaction inserted (businessId=' + businessId + ') kitchen_status=' + (transactionData.kitchenStatus || 'pending') + ' items=' + (transactionData.items ? transactionData.items.length : 0));
  } catch(e) {}
  
  const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
  let transactionId = 0;
  try {
    transactionId = lastIdResult && lastIdResult[0] && lastIdResult[0].values && lastIdResult[0].values[0] ? lastIdResult[0].values[0][0] : 0;
  } catch (e) {
    transactionId = 0;
  }
  // Fallback if last_insert_rowid failed or returned 0
  if (!transactionId) {
    try {
      const fallback = db.exec(`SELECT id FROM transactions WHERE business_id = ${businessId} ORDER BY id DESC LIMIT 1`);
      if (fallback && fallback.length && fallback[0].values && fallback[0].values[0]) {
        transactionId = fallback[0].values[0][0];
        try { console.warn('[POS] last_insert_rowid returned 0 — using fallback id=' + transactionId); } catch(e) {}
      }
    } catch (e) {
      try { console.error('[POS] Failed to determine transactionId after insert', e); } catch(e) {}
    }
  }
  try { console.log('[POS] createTransaction determined transactionId=' + transactionId); } catch(e) {}
  
  // Add transaction items
  if (transactionData.items && transactionData.items.length > 0) {
    try {
      console.log('[POS] createTransaction - items to insert for transactionId=' + transactionId + ':', JSON.stringify(transactionData.items));
    } catch (e) {}

    transactionData.items.forEach(item => {
      // Defensive checks
      if (!item.menuItemId && (item.menu_item_id === undefined || item.menu_item_id === null)) {
        try { console.warn('[POS] createTransaction - missing menuItemId for item', JSON.stringify(item)); } catch (e) {}
      }
      const modifiersJson = item.modifiers ? JSON.stringify(item.modifiers) : null;
      db.run(`
        INSERT INTO transaction_items (
          transaction_id, menu_item_id, quantity, unit_price, total_price, notes, modifiers
        ) VALUES (
          ${transactionId},
          ${item.menuItemId || item.menu_item_id || 'NULL'},
          ${item.quantity || 1},
          ${item.unitPrice || item.unit_price || 0},
          ${item.totalPrice || item.total_price || 0},
          ${escape(item.notes)},
          ${escape(modifiersJson)}
        )
      `);
    });
    saveDatabase();
    try {
      const verify = db.exec(`SELECT * FROM transaction_items WHERE transaction_id = ${transactionId}`);
      const count = verify.length && verify[0].values ? verify[0].values.length : 0;
      console.log('[POS] createTransaction items persisted for transactionId=' + transactionId + ', rows=' + count);
      if (count > 0) {
        try { console.log('[POS] inserted rows:', JSON.stringify(verify[0])); } catch (e) {}
      }
    } catch(e) {
      console.warn('[POS] createTransaction - verify query failed', e);
    }
  }
  
  // Add payment methods
  if (transactionData.payments && transactionData.payments.length > 0) {
    transactionData.payments.forEach(payment => {
      db.run(`
        INSERT INTO payment_methods (
          transaction_id, method_type, amount, reference_number
        ) VALUES (
          ${transactionId},
          ${escape(payment.methodType)},
          ${payment.amount},
          ${escape(payment.referenceNumber)}
        )
      `);
    });
    saveDatabase();
  }
  
  // Update customer points if customer is attached
  if (transactionData.customerId) {
    const netPoints = pointsEarned - pointsRedeemed;
    updateCustomerPoints(businessId, transactionData.customerId, netPoints, transactionData.total);
  }
  
  return getTransactionById(businessId, transactionId);
};

// Get transaction by ID with full details
const getTransactionById = (businessId, transactionId) => {
  const db = getDb();
  
  // Get transaction
  const transQuery = `
    SELECT 
      t.*,
      u.full_name as cashier_name,
      c.name as customer_name
    FROM transactions t
    LEFT JOIN users u ON t.cashier_id = u.id
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.business_id = ${businessId} AND t.id = ${transactionId}
  `;
  
  const transResult = db.exec(transQuery);
  if (transResult.length === 0) return null;
  
  const transColumns = transResult[0].columns;
  const transValues = transResult[0].values[0];
  
  const transaction = {};
  transColumns.forEach((col, idx) => {
    transaction[col] = transValues[idx];
  });
  
  // Get transaction items
  const itemsQuery = `
    SELECT 
      ti.*,
      m.name as item_name
    FROM transaction_items ti
    LEFT JOIN menu_items m ON ti.menu_item_id = m.id
    WHERE ti.transaction_id = ${transactionId}
  `;
  
  const itemsResult = db.exec(itemsQuery);
  transaction.items = [];
  
  if (itemsResult.length > 0) {
    const itemColumns = itemsResult[0].columns;
    const itemValues = itemsResult[0].values;
    
    transaction.items = itemValues.map(row => {
      const item = {};
      itemColumns.forEach((col, idx) => {
        item[col] = row[idx];
      });
      return item;
    });
  }
  
  // Get payment methods
  const paymentQuery = `
    SELECT * FROM payment_methods 
    WHERE transaction_id = ${transactionId}
  `;
  
  const paymentResult = db.exec(paymentQuery);
  transaction.payments = [];
  
  if (paymentResult.length > 0) {
    const paymentColumns = paymentResult[0].columns;
    const paymentValues = paymentResult[0].values;
    
    transaction.payments = paymentValues.map(row => {
      const payment = {};
      paymentColumns.forEach((col, idx) => {
        payment[col] = row[idx];
      });
      return payment;
    });
  }
  
  return transaction;
};

// Get recent transactions
const getRecentTransactions = (businessId, limit = 50) => {
  const db = getDb();
  const query = `
    SELECT 
      t.*,
      u.full_name as cashier_name,
      c.name as customer_name
    FROM transactions t
    LEFT JOIN users u ON t.cashier_id = u.id
    LEFT JOIN customers c ON t.customer_id = c.id
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

// Get transactions by date range
const getTransactionsByDateRange = (businessId, startDate, endDate) => {
  const db = getDb();
  const query = `
    SELECT 
      t.*,
      u.full_name as cashier_name,
      c.name as customer_name
    FROM transactions t
    LEFT JOIN users u ON t.cashier_id = u.id
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.business_id = ${businessId}
      AND DATE(t.created_at) BETWEEN ${escape(startDate)} AND ${escape(endDate)}
    ORDER BY t.created_at DESC
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

// Get daily sales summary
const getDailySalesSummary = (businessId, date) => {
  const db = getDb();
  const query = `
    SELECT 
      COUNT(*) as transaction_count,
      SUM(subtotal) as total_subtotal,
      SUM(tax) as total_tax,
      SUM(discount) as total_discount,
      SUM(total) as total_sales
    FROM transactions
    WHERE business_id = ${businessId}
      AND DATE(created_at) = ${escape(date)}
      AND status = 'completed'
  `;
  
  const result = db.exec(query);
  if (result.length === 0) return null;
  
  const columns = result[0].columns;
  const values = result[0].values[0];
  
  const summary = {};
  columns.forEach((col, idx) => {
    summary[col] = values[idx] || 0;
  });
  
  return summary;
};

// Void/refund a transaction
const voidTransaction = (businessId, transactionId, voidReason, voidedBy) => {
  const db = getDb();
  
  // Get the transaction first
  const transaction = getTransactionById(businessId, transactionId);
  if (!transaction) {
    throw new Error('Transaction not found');
  }
  
  if (transaction.status === 'voided') {
    throw new Error('Transaction is already voided');
  }
  
  // Update transaction status
  db.run(`
    UPDATE transactions 
    SET status = 'voided', void_reason = ${escape(voidReason)}
    WHERE id = ${transactionId} AND business_id = ${businessId}
  `);
  saveDatabase();
  
  // Reverse customer points if customer was attached
  if (transaction.customer_id) {
    const pointsToReverse = -(transaction.points_earned - transaction.points_redeemed);
    const amountToReverse = -transaction.total;
    updateCustomerPoints(businessId, transaction.customer_id, pointsToReverse, amountToReverse);
  }
  
  return getTransactionById(businessId, transactionId);
};

// Validate manager PIN
const validateManagerPin = (businessId, userId, pin) => {
  const db = getDb();
  const query = `
    SELECT id, role FROM users 
    WHERE business_id = ${businessId} 
      AND id = ${userId} 
      AND pin = ${escape(pin)}
      AND role IN ('owner', 'manager')
  `;
  
  const result = db.exec(query);
  return result.length > 0 && result[0].values.length > 0;
};

// Update customer
const updateCustomer = (businessId, customerId, customerData) => {
  const db = getDb();
  
  db.run(`
    UPDATE customers 
    SET name = ${escape(customerData.name)},
        email = ${escape(customerData.email)},
        phone = ${escape(customerData.phone)},
        updated_at = CURRENT_TIMESTAMP
    WHERE business_id = ${businessId} AND id = ${customerId}
  `);
  saveDatabase();
  
  return getCustomerById(businessId, customerId);
};

// Delete customer
const deleteCustomer = (businessId, customerId) => {
  const db = getDb();
  
  db.run(`
    DELETE FROM customers 
    WHERE business_id = ${businessId} AND id = ${customerId}
  `);
  saveDatabase();
  
  return { success: true };
};

// Get payment methods breakdown for a date range
const getPaymentMethodsByDateRange = (businessId, startDate, endDate) => {
  const db = getDb();
  
  const query = `
    SELECT 
      pm.method_type,
      COUNT(DISTINCT pm.transaction_id) as transaction_count,
      SUM(pm.amount) as total_amount
    FROM payment_methods pm
    INNER JOIN transactions t ON pm.transaction_id = t.id
    WHERE t.business_id = ?
      AND DATE(t.created_at) BETWEEN DATE(?) AND DATE(?)
      AND t.status = 'completed'
    GROUP BY pm.method_type
    ORDER BY total_amount DESC
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

// ==================== KITCHEN DISPLAY SYSTEM ====================

// Get all orders (transactions) for kitchen display
const getOrders = (businessId) => {
  const db = getDb();
  ensureKitchenColumns(db);
  
  const query = `
    SELECT * FROM transactions 
    WHERE business_id = ${businessId}
      AND kitchen_status IS NOT NULL
      AND kitchen_status != 'completed'
    ORDER BY created_at DESC
  `;
  
  console.log('Kitchen getOrders query:', query);
  
  const result = db.exec(query);
  console.log('Kitchen getOrders result:', result);
  
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  const orders = values.map(row => {
    const order = {};
    columns.forEach((col, idx) => {
      order[col] = row[idx];
    });
    
    // Get items for this order
    const itemsQuery = `
      SELECT 
        ti.*,
        m.name as name,
        m.price
      FROM transaction_items ti
      LEFT JOIN menu_items m ON ti.menu_item_id = m.id
      WHERE ti.transaction_id = ${order.id}
    `;
    
    const itemsResult = db.exec(itemsQuery);
    if (itemsResult.length > 0) {
      const itemColumns = itemsResult[0].columns;
      const itemValues = itemsResult[0].values;
      
      const mappedItems = itemValues.map(itemRow => {
        const item = {};
        itemColumns.forEach((col, idx) => {
          item[col] = itemRow[idx];
        });
        // Parse modifiers if they exist
        if (item.modifiers) {
          try {
            item.modifiers = JSON.parse(item.modifiers);
          } catch (e) {
            item.modifiers = [];
          }
        }
        return item;
      });
      order.items = mappedItems;
      try { console.log('[Kitchen] Loaded ' + itemValues.length + ' items for orderId=' + order.id); } catch(e) {}
    } else {
      order.items = [];
      try { console.log('[Kitchen] No items found for orderId=' + order.id); } catch(e) {}
    }
    
    return order;
  });
  
  console.log('Kitchen getOrders returning:', orders);
  return orders;
};

// Update kitchen status for an order (robust to missing updated_at column)
const updateOrderKitchenStatus = (businessId, orderId, kitchenStatus) => {
  const db = getDb();
  ensureKitchenColumns(db);

  // Detect columns
  let hasUpdatedAt = false;
  try {
    const pragma = db.exec("PRAGMA table_info(transactions)");
    if (pragma.length && pragma[0].values) {
      hasUpdatedAt = pragma[0].values.some(row => row[1] === 'updated_at');
    }
  } catch (e) {
    // ignore
  }

  // If updated_at missing, attempt to add it once
  if (!hasUpdatedAt) {
    try {
      db.run("ALTER TABLE transactions ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
      hasUpdatedAt = true;
    } catch (e) {
      // Column add failed (maybe no permissions) proceed without it
    }
  }

  const setClause = hasUpdatedAt
    ? `kitchen_status = ${escape(kitchenStatus)}, updated_at = CURRENT_TIMESTAMP`
    : `kitchen_status = ${escape(kitchenStatus)}`;

  // Handle kitchen_started_at and kitchen_completed_at when available
  try {
    const pragma = db.exec("PRAGMA table_info(transactions)");
    const cols = pragma.length && pragma[0].values ? pragma[0].values.map(r => r[1]) : [];
    const hasStarted = cols.includes('kitchen_started_at');
    const hasCompleted = cols.includes('kitchen_completed_at');

    if (kitchenStatus === 'preparing' && hasStarted) {
      // Set kitchen_started_at only if not already set
      try {
        db.run(`UPDATE transactions SET kitchen_status = ${escape(kitchenStatus)}, kitchen_started_at = COALESCE(kitchen_started_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP WHERE id = ${orderId} AND business_id = ${businessId}`);
        saveDatabase();
        return { success: true, orderId, kitchenStatus };
      } catch (e) {
        // fall through to general update below
      }
    }

    // Treat both 'ready' and 'completed' as completion events for timing purposes
    if ((kitchenStatus === 'completed' || kitchenStatus === 'ready') && hasCompleted) {
      try {
        db.run(`UPDATE transactions SET kitchen_status = ${escape(kitchenStatus)}, kitchen_completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ${orderId} AND business_id = ${businessId}`);
        saveDatabase();
        return { success: true, orderId, kitchenStatus };
      } catch (e) {
        // fall through
      }
    }
  } catch (e) {
    // ignore and proceed with default update
  }

  let query = `UPDATE transactions SET ${setClause} WHERE id = ${orderId} AND business_id = ${businessId}`;
  try {
    db.run(query);
  } catch (e) {
    // Fallback without updated_at if still failing
    if (hasUpdatedAt) {
      try {
        query = `UPDATE transactions SET kitchen_status = ${escape(kitchenStatus)} WHERE id = ${orderId} AND business_id = ${businessId}`;
        db.run(query);
      } catch (err2) {
        console.error('[POS] updateOrderKitchenStatus failed:', err2);
        return { success: false, error: 'Failed to update order status' };
      }
    } else {
      console.error('[POS] updateOrderKitchenStatus failed:', e);
      return { success: false, error: 'Failed to update order status' };
    }
  }
  saveDatabase();

  // As a safe fallback: if we intended this update to mark the order finished
  // but `kitchen_completed_at` is still NULL (e.g., earlier branch failed),
  // set it now so frontend can display finished time and stop timers.
  try {
    const pragma2 = db.exec("PRAGMA table_info(transactions)");
    const cols2 = pragma2.length && pragma2[0].values ? pragma2[0].values.map(r => r[1]) : [];
    const hasCompleted2 = cols2.includes('kitchen_completed_at');
    if (hasCompleted2 && (kitchenStatus === 'ready' || kitchenStatus === 'completed')) {
      try {
        db.run(`UPDATE transactions SET kitchen_completed_at = COALESCE(kitchen_completed_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP WHERE id = ${orderId} AND business_id = ${businessId}`);
        saveDatabase();
        try { console.log('[POS] updateOrderKitchenStatus - ensured kitchen_completed_at for orderId=' + orderId); } catch(e) {}
      } catch (e) {
        try { console.warn('[POS] updateOrderKitchenStatus - fallback set kitchen_completed_at failed for orderId=' + orderId, e); } catch(e) {}
      }
    }
  } catch (e) {
    // ignore
  }

  return { success: true, orderId, kitchenStatus };
};

// Delete a transaction (used by Kitchen Display to remove erroneous orders)
const deleteTransaction = (businessId, transactionId) => {
  const db = getDb();
  db.run(`DELETE FROM transactions WHERE id = ${transactionId} AND business_id = ${businessId}`);
  saveDatabase();
  return { success: true, transactionId };
};

// Reset transaction auto-increment sequence (only if no transactions exist for business)
const resetOrderSequence = (businessId) => {
  const db = getDb();
  try {
    const countResult = db.exec(`SELECT COUNT(*) as cnt FROM transactions WHERE business_id = ${businessId}`);
    const existingCount = countResult.length ? countResult[0].values[0][0] : 0;
    if (existingCount > 0) {
      return { success: false, error: 'Cannot reset while transactions exist. Delete them first.' };
    }
    // Remove sqlite_sequence entry to reset next id to 1
    try { db.run(`DELETE FROM sqlite_sequence WHERE name='transactions'`); } catch(e) { /* might not exist */ }
    saveDatabase();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Purge all transactions for a business (including items and payments) then reset sequence
const purgeTransactionsForBusiness = (businessId) => {
  const db = getDb();
  try {
    // Find all transaction IDs for business
    const res = db.exec(`SELECT id FROM transactions WHERE business_id = ${businessId}`);
    const ids = res.length ? res[0].values.map(r => r[0]) : [];
    ids.forEach(id => {
      try { db.run(`DELETE FROM transaction_items WHERE transaction_id = ${id}`); } catch(e) {}
      try { db.run(`DELETE FROM payment_methods WHERE transaction_id = ${id}`); } catch(e) {}
    });
    // Delete transactions
    db.run(`DELETE FROM transactions WHERE business_id = ${businessId}`);
    // Reset sequence
    try { db.run(`DELETE FROM sqlite_sequence WHERE name='transactions'`); } catch(e) {}
    saveDatabase();
    return { success: true, deleted: ids.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Ensure kitchen-related columns exist
function ensureKitchenColumns(db) {
  try {
    const pragma = db.exec("PRAGMA table_info(transactions)");
    if (!pragma.length) return;
    const existing = pragma[0].values.map(r => r[1]);
    const additions = [];
    if (!existing.includes('kitchen_status')) additions.push("ALTER TABLE transactions ADD COLUMN kitchen_status TEXT DEFAULT 'pending'");
    if (!existing.includes('updated_at')) additions.push("ALTER TABLE transactions ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
    // We keep order_type/table_number optional
    if (!existing.includes('order_type')) additions.push("ALTER TABLE transactions ADD COLUMN order_type TEXT");
    if (!existing.includes('table_number')) additions.push("ALTER TABLE transactions ADD COLUMN table_number TEXT");
    if (!existing.includes('daily_order_number')) additions.push("ALTER TABLE transactions ADD COLUMN daily_order_number INTEGER");
    if (!existing.includes('kitchen_started_at')) additions.push("ALTER TABLE transactions ADD COLUMN kitchen_started_at DATETIME");
    if (!existing.includes('kitchen_completed_at')) additions.push("ALTER TABLE transactions ADD COLUMN kitchen_completed_at DATETIME");
    additions.forEach(stmt => {
      try { db.run(stmt); } catch(e) { /* ignore */ }
    });
    if (additions.length) saveDatabase();
  } catch (e) {
    // silent
  }
}

module.exports = {
  // Customers
  searchCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  updateCustomerPoints,
  deleteCustomer,
  
  // Transactions
  createTransaction,
  getTransactionById,
  getRecentTransactions,
  getTransactionsByDateRange,
  getDailySalesSummary,
  voidTransaction,
  validateManagerPin,
  getPaymentMethodsByDateRange,
  
  // Kitchen Display System
  getOrders,
  updateOrderKitchenStatus,
  deleteTransaction,
  resetOrderSequence,
  purgeTransactionsForBusiness
};

