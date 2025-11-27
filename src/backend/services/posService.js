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
  
  const pointsEarned = transactionData.pointsEarned || 0;
  const pointsRedeemed = transactionData.pointsRedeemed || 0;
  
  const query = `
    INSERT INTO transactions (
      business_id, cashier_id, customer_id, subtotal, tax, discount, tip_amount, total, 
      points_earned, points_redeemed, status, notes
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
      ${escape(transactionData.notes)}
    )
  `;
  
  db.run(query);
  saveDatabase();
  
  const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
  const transactionId = lastIdResult[0].values[0][0];
  
  // Add transaction items
  if (transactionData.items && transactionData.items.length > 0) {
    transactionData.items.forEach(item => {
      const modifiersJson = item.modifiers ? JSON.stringify(item.modifiers) : null;
      db.run(`
        INSERT INTO transaction_items (
          transaction_id, menu_item_id, quantity, unit_price, total_price, notes, modifiers
        ) VALUES (
          ${transactionId},
          ${item.menuItemId},
          ${item.quantity},
          ${item.unitPrice},
          ${item.totalPrice},
          ${escape(item.notes)},
          ${escape(modifiersJson)}
        )
      `);
    });
    saveDatabase();
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
  validateManagerPin
};
