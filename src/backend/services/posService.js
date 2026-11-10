const { getDb, saveDatabase } = require('../database/database');
const { sql } = require('../database/sql');
const ModifierService = require('./modifierService');

const ORDER_TYPES = ['dine-in', 'takeout', 'delivery'];

// The cash drawer session open right now, if any
const openDrawerSessionId = (businessId) => {
  const r = getDb().exec(sql`SELECT id FROM cash_drawer_sessions WHERE business_id = ${businessId} AND status = 'open' ORDER BY id DESC LIMIT 1`);
  return r.length && r[0].values.length ? r[0].values[0][0] : null;
};

const round2 = (n) => Math.round(((Number(n) || 0) + Number.EPSILON) * 100) / 100;
const isCash = (methodType) => String(methodType || '').toLowerCase() === 'cash';

// Record what each payment actually covered. When payments add up to more
// than the total, the difference is change handed back, so it comes off the
// cash payments (latest first). Card/mobile amounts are left as entered.
const normalizePayments = (payments, total) => {
  const list = (payments || []).map((p) => ({ ...p, amount: round2(p.amount) }));
  let overage = round2(list.reduce((sum, p) => sum + p.amount, 0) - round2(total));
  for (let i = list.length - 1; i >= 0 && overage > 0; i--) {
    if (!isCash(list[i].methodType)) continue;
    const reduce = Math.min(list[i].amount, overage);
    list[i].amount = round2(list[i].amount - reduce);
    overage = round2(overage - reduce);
  }
  return list.filter((p) => p.amount > 0);
};


// ==================== CUSTOMERS ====================

// Search customers by name or phone
const searchCustomers = (businessId, searchTerm) => {
  const db = getDb();
  const term = `%${searchTerm}%`;
  const query = sql`
    SELECT * FROM customers 
    WHERE business_id = ${businessId} 
      AND (name LIKE ${term} OR phone LIKE ${term} OR email LIKE ${term})
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
  const query = sql`
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
  
  const query = sql`
    INSERT INTO customers (business_id, name, email, phone, loyalty_points)
    VALUES (
      ${businessId},
      ${customerData.name},
      ${customerData.email},
      ${customerData.phone},
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
  
  const query = sql`
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

// ==================== BUSINESS SETTINGS ====================

// Sales tax rate (percent) stored on the business. Single source of truth
// for every till; previously it lived only in each browser's localStorage.
const getTaxRate = (businessId) => {
  const result = getDb().exec(sql`SELECT tax_rate FROM businesses WHERE id = ${businessId}`);
  if (!result.length || !result[0].values.length) throw new Error('Business not found');
  const rate = result[0].values[0][0];
  return rate === null || rate === undefined ? 7.5 : Number(rate);
};

const updateTaxRate = (businessId, taxRate) => {
  const rate = Number(taxRate);
  if (taxRate === '' || taxRate === null || !Number.isFinite(rate) || rate < 0 || rate > 100) {
    throw new Error('Tax rate must be a number between 0 and 100');
  }
  getTaxRate(businessId); // throws if the business doesn't exist
  getDb().run(sql`UPDATE businesses SET tax_rate = ${rate} WHERE id = ${businessId}`);
  saveDatabase();
  return rate;
};

// ==================== TRANSACTIONS ====================

// Create new transaction
const createTransaction = (businessId, transactionData) => {
  const db = getDb();
  ensureKitchenColumns(db);
  
  const pointsEarned = transactionData.pointsEarned || 0;
  const pointsRedeemed = transactionData.pointsRedeemed || 0;

  // Order type and table. Table numbers only apply to dine-in orders.
  const orderType = transactionData.orderType || 'dine-in';
  if (!ORDER_TYPES.includes(orderType)) {
    throw new Error(`Invalid order type: ${orderType}`);
  }
  const rawTable = transactionData.tableNumber == null ? '' : String(transactionData.tableNumber).trim();
  if (rawTable.length > 20) {
    throw new Error('Table number is too long');
  }
  const tableNumber = orderType === 'dine-in' && rawTable ? rawTable : null;

  // Check modifier selections before writing anything, so an invalid order
  // is rejected as a whole. Items send `modifierOptionIds`; the stored
  // modifiers (names and prices) come from the database, not the client.
  const itemModifiers = (transactionData.items || []).map((item) => {
    const menuItemId = item.menuItemId || item.menu_item_id;
    const optionIds = Array.isArray(item.modifierOptionIds) ? item.modifierOptionIds : [];
    const check = ModifierService.validateSelection(businessId, menuItemId, optionIds);
    if (!check.valid) {
      throw new Error(`Invalid options for ${item.name || 'item #' + menuItemId}: ${check.errors.join('; ')}`);
    }
    return check.modifiers.length ? check.modifiers : null;
  });

  // Generate local datetime string for created_at
  const now = new Date();
  const localDateTime = now.getFullYear() + '-' + 
    String(now.getMonth() + 1).padStart(2, '0') + '-' + 
    String(now.getDate()).padStart(2, '0') + ' ' + 
    String(now.getHours()).padStart(2, '0') + ':' + 
    String(now.getMinutes()).padStart(2, '0') + ':' + 
    String(now.getSeconds()).padStart(2, '0');
  
  console.log('[POS] Local datetime generated:', localDateTime);

  // Determine next daily_order_number for this business (resets each day)
  let nextDailyOrderNumber = 1;
  try {
    const todayStr = now.getFullYear() + '-' + 
      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
      String(now.getDate()).padStart(2, '0');
    const maxRes = db.exec(sql`SELECT COALESCE(MAX(daily_order_number), 0) as maxnum FROM transactions WHERE business_id = ${businessId} AND DATE(created_at) = ${todayStr}`);
    if (maxRes.length && maxRes[0].values && maxRes[0].values.length) {
      const maxnum = maxRes[0].values[0][0];
      nextDailyOrderNumber = (Number(maxnum) || 0) + 1;
    }
  } catch (e) {
    // ignore, default to 1
  }

  const query = sql`
    INSERT INTO transactions (
      business_id, cashier_id, customer_id, subtotal, tax, discount, tip_amount, total, 
      points_earned, points_redeemed, status, notes, kitchen_status, daily_order_number, created_at,
      order_type, table_number, drawer_session_id
    ) VALUES (
      ${businessId},
      ${transactionData.cashierId},
      ${transactionData.customerId || null},
      ${round2(transactionData.subtotal)},
      ${round2(transactionData.tax)},
      ${round2(transactionData.discount)},
      ${round2(transactionData.tipAmount)},
      ${round2(transactionData.total)},
      ${pointsEarned},
      ${pointsRedeemed},
      'completed',
      ${transactionData.notes},
      ${transactionData.kitchenStatus || 'pending'},
      ${nextDailyOrderNumber},
      ${localDateTime},
      ${orderType},
      ${tableNumber},
      ${openDrawerSessionId(businessId)}
    )
  `;
  
  console.log('[POS] About to execute query with localDateTime:', localDateTime);
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
      const fallback = db.exec(sql`SELECT id FROM transactions WHERE business_id = ${businessId} ORDER BY id DESC LIMIT 1`);
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

    transactionData.items.forEach((item, index) => {
      // Defensive checks
      if (!item.menuItemId && (item.menu_item_id === undefined || item.menu_item_id === null)) {
        try { console.warn('[POS] createTransaction - missing menuItemId for item', JSON.stringify(item)); } catch (e) {}
      }
      const modifiersJson = itemModifiers[index] ? JSON.stringify(itemModifiers[index]) : null;
      db.run(sql`
        INSERT INTO transaction_items (
          transaction_id, menu_item_id, quantity, unit_price, total_price, notes, modifiers
        ) VALUES (
          ${transactionId},
          ${item.menuItemId || item.menu_item_id || null},
          ${item.quantity || 1},
          ${round2(item.unitPrice || item.unit_price || 0)},
          ${round2(item.totalPrice || item.total_price || 0)},
          ${item.notes},
          ${modifiersJson}
        )
      `);
    });
    saveDatabase();
    try {
      const verify = db.exec(sql`SELECT * FROM transaction_items WHERE transaction_id = ${transactionId}`);
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
  const payments = normalizePayments(transactionData.payments, transactionData.total);
  if (payments.length > 0) {
    payments.forEach(payment => {
      db.run(sql`
        INSERT INTO payment_methods (
          transaction_id, method_type, amount, reference_number
        ) VALUES (
          ${transactionId},
          ${payment.methodType},
          ${payment.amount},
          ${payment.referenceNumber}
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

  // Take the items' ingredients out of inventory
  require('./recipeService').deductForSale(businessId, transactionId, transactionData.cashierId);

  return getTransactionById(businessId, transactionId);
};

// Get transaction by ID with full details
const getTransactionById = (businessId, transactionId) => {
  const db = getDb();
  
  // Get transaction
  const transQuery = sql`
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
  const itemsQuery = sql`
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
  const paymentQuery = sql`
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

  // Refunds against this sale (shown on reprinted receipts)
  transaction.refunds = require('./refundService').getRefunds(businessId, transactionId);
  transaction.refunded_amount = round2(transaction.refunds.reduce((sum, r) => sum + r.amount, 0));

  return transaction;
};

// Get recent transactions
const getRecentTransactions = (businessId, limit = 50) => {
  const db = getDb();
  const query = sql`
    SELECT 
      t.*,
      u.full_name as cashier_name,
      c.name as customer_name,
      (SELECT COALESCE(SUM(r.amount), 0) FROM refunds r WHERE r.transaction_id = t.id) as refunded_amount
    FROM transactions t
    LEFT JOIN users u ON t.cashier_id = u.id
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.business_id = ${businessId}
    ORDER BY t.created_at DESC, t.id DESC
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
  try {
    const db = getDb();
    console.log('[POSService] getTransactionsByDateRange params:', { businessId, startDate, endDate });

    const startDateTime = `${startDate} 00:00:00`;
    const endDateTime = `${endDate} 23:59:59`;
    const query = sql`
      SELECT 
        t.*,
        u.full_name as cashier_name,
        c.name as customer_name
      FROM transactions t
      LEFT JOIN users u ON t.cashier_id = u.id
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.business_id = ${businessId}
        AND t.created_at >= ${startDateTime}
        AND t.created_at <= ${endDateTime}
      ORDER BY t.created_at DESC
    `;

    const result = db.exec(query);
    const rowCount = result?.[0]?.values?.length || 0;
    console.log('[POSService] primary query result count:', rowCount);
    if (rowCount === 0) {
      return [];
    }

    const columns = result[0].columns;
    return result[0].values.map(row => {
      const transaction = {};
      columns.forEach((col, idx) => {
        transaction[col] = row[idx];
      });
      return transaction;
    });
  } catch (error) {
    console.error('[POSService] getTransactionsByDateRange failed:', error);
    return [];
  }
};

// Get daily sales summary
const getDailySalesSummary = (businessId, date) => {
  const db = getDb();
  const query = sql`
    SELECT 
      COUNT(*) as transaction_count,
      SUM(subtotal) as total_subtotal,
      SUM(tax) as total_tax,
      SUM(discount) as total_discount,
      SUM(total) as total_sales
    FROM transactions
    WHERE business_id = ${businessId}
      AND DATE(created_at, 'localtime') = ${date}
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

  // A sale with refunds has already returned money; refund the rest instead
  if (transaction.refunds && transaction.refunds.length) {
    throw new Error('This sale has refunds. Refund the remaining amount instead of voiding.');
  }
  
  // Put the sale's ingredients back into inventory
  require('./recipeService').restoreForVoid(businessId, transactionId, voidedBy);

  // Update transaction status
  db.run(sql`
    UPDATE transactions 
    SET status = 'voided', void_reason = ${voidReason}
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
  const query = sql`
    SELECT id, role FROM users 
    WHERE business_id = ${businessId} 
      AND id = ${userId} 
      AND pin = ${pin}
      AND role IN ('owner', 'manager')
  `;
  
  const result = db.exec(query);
  return result.length > 0 && result[0].values.length > 0;
};

// Update customer
const updateCustomer = (businessId, customerId, customerData) => {
  const db = getDb();
  
  db.run(sql`
    UPDATE customers 
    SET name = ${customerData.name},
        email = ${customerData.email},
        phone = ${customerData.phone},
        updated_at = CURRENT_TIMESTAMP
    WHERE business_id = ${businessId} AND id = ${customerId}
  `);
  saveDatabase();
  
  return getCustomerById(businessId, customerId);
};

// Delete customer
const deleteCustomer = (businessId, customerId) => {
  const db = getDb();
  
  db.run(sql`
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
      AND DATE(t.created_at, 'localtime') BETWEEN DATE(?) AND DATE(?)
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
  
  const query = sql`
    SELECT * FROM transactions 
    WHERE business_id = ${businessId}
      AND kitchen_status IS NOT NULL
      AND kitchen_status != 'completed'
      AND status NOT IN ('voided', 'cancelled')
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
    const itemsQuery = sql`
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
    ? sql`kitchen_status = ${kitchenStatus}, updated_at = CURRENT_TIMESTAMP`
    : sql`kitchen_status = ${kitchenStatus}`;

  // Handle kitchen_started_at and kitchen_completed_at when available
  try {
    const pragma = db.exec("PRAGMA table_info(transactions)");
    const cols = pragma.length && pragma[0].values ? pragma[0].values.map(r => r[1]) : [];
    const hasStarted = cols.includes('kitchen_started_at');
    const hasCompleted = cols.includes('kitchen_completed_at');

    if (kitchenStatus === 'preparing' && hasStarted) {
      // Set kitchen_started_at only if not already set
      try {
        db.run(sql`UPDATE transactions SET kitchen_status = ${kitchenStatus}, kitchen_started_at = COALESCE(kitchen_started_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP WHERE id = ${orderId} AND business_id = ${businessId}`);
        saveDatabase();
        return { success: true, orderId, kitchenStatus };
      } catch (e) {
        // fall through to general update below
      }
    }

    // Treat both 'ready' and 'completed' as completion events for timing purposes
    if ((kitchenStatus === 'completed' || kitchenStatus === 'ready') && hasCompleted) {
      try {
        db.run(sql`UPDATE transactions SET kitchen_status = ${kitchenStatus}, kitchen_completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ${orderId} AND business_id = ${businessId}`);
        saveDatabase();
        return { success: true, orderId, kitchenStatus };
      } catch (e) {
        // fall through
      }
    }
  } catch (e) {
    // ignore and proceed with default update
  }

  let query = sql`UPDATE transactions SET ${setClause} WHERE id = ${orderId} AND business_id = ${businessId}`;
  try {
    db.run(query);
  } catch (e) {
    // Fallback without updated_at if still failing
    if (hasUpdatedAt) {
      try {
        query = sql`UPDATE transactions SET kitchen_status = ${kitchenStatus} WHERE id = ${orderId} AND business_id = ${businessId}`;
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
        db.run(sql`UPDATE transactions SET kitchen_completed_at = COALESCE(kitchen_completed_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP WHERE id = ${orderId} AND business_id = ${businessId}`);
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
  db.run(sql`DELETE FROM transactions WHERE id = ${transactionId} AND business_id = ${businessId}`);
  saveDatabase();
  return { success: true, transactionId };
};

// Reset transaction auto-increment sequence (only if no transactions exist for business)
const resetOrderSequence = (businessId) => {
  const db = getDb();
  try {
    const countResult = db.exec(sql`SELECT COUNT(*) as cnt FROM transactions WHERE business_id = ${businessId}`);
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
    const res = db.exec(sql`SELECT id FROM transactions WHERE business_id = ${businessId}`);
    const ids = res.length ? res[0].values.map(r => r[0]) : [];
    ids.forEach(id => {
      try { db.run(sql`DELETE FROM transaction_items WHERE transaction_id = ${id}`); } catch(e) {}
      try { db.run(sql`DELETE FROM payment_methods WHERE transaction_id = ${id}`); } catch(e) {}
    });
    // Delete transactions
    db.run(sql`DELETE FROM transactions WHERE business_id = ${businessId}`);
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

// ==================== OPEN TABS ====================
//
// A tab is a sale saved with status 'open': it appears on the kitchen display
// straight away and is paid later. Its items can be changed until it is
// closed. Closing completes it like a normal sale (time of sale = when it was
// paid, so reports and the cash drawer count it then). Open tabs carry no
// totals, so they never show up in sales figures.

const localNowString = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

const tabOrderMeta = (data) => {
  const orderType = data.orderType || 'dine-in';
  if (!ORDER_TYPES.includes(orderType)) throw new Error(`Invalid order type: ${orderType}`);
  const rawTable = data.tableNumber == null ? '' : String(data.tableNumber).trim();
  if (rawTable.length > 20) throw new Error('Table number is too long');
  return { orderType, tableNumber: orderType === 'dine-in' && rawTable ? rawTable : null };
};

const tabName = (name) => {
  const text = String(name || '').trim();
  if (!text) throw new Error('Give the tab a name');
  if (text.length > 40) throw new Error('Tab name is too long');
  return text;
};

// Validate items and their modifiers; returns rows ready to insert.
const tabItems = (businessId, items) => {
  if (!Array.isArray(items) || items.length === 0) throw new Error('A tab needs at least one item');
  return items.map((item) => {
    const menuItemId = item.menuItemId || item.menu_item_id;
    const quantity = Number.parseInt(item.quantity, 10);
    if (!menuItemId) throw new Error('Item is missing');
    if (!quantity || quantity < 1) throw new Error('Quantities must be at least 1');
    const optionIds = Array.isArray(item.modifierOptionIds) ? item.modifierOptionIds : [];
    const check = ModifierService.validateSelection(businessId, menuItemId, optionIds);
    if (!check.valid) throw new Error(`Invalid options for ${item.name || 'item #' + menuItemId}: ${check.errors.join('; ')}`);
    const unitPrice = round2(item.unitPrice || item.unit_price || 0);
    return {
      menuItemId,
      quantity,
      unitPrice,
      totalPrice: round2(unitPrice * quantity),
      notes: item.notes || null,
      modifiers: check.modifiers.length ? JSON.stringify(check.modifiers) : null
    };
  });
};

const replaceTabItems = (db, tabId, rowsToInsert) => {
  db.run(sql`DELETE FROM transaction_items WHERE transaction_id = ${tabId}`);
  rowsToInsert.forEach((r) => {
    db.run(sql`
      INSERT INTO transaction_items (transaction_id, menu_item_id, quantity, unit_price, total_price, notes, modifiers)
      VALUES (${tabId}, ${r.menuItemId}, ${r.quantity}, ${r.unitPrice}, ${r.totalPrice}, ${r.notes}, ${r.modifiers})
    `);
  });
};

const itemSignature = (rowsList) =>
  rowsList.map((r) => `${r.menu_item_id || r.menuItemId}:${r.quantity}:${r.modifiers || ''}:${r.notes || ''}`).sort().join('|');

const getTabRow = (businessId, tabId) => {
  const r = getDb().exec(sql`SELECT * FROM transactions WHERE id = ${tabId} AND business_id = ${businessId}`);
  if (!r.length || !r[0].values.length) return null;
  return Object.fromEntries(r[0].columns.map((c, i) => [c, r[0].values[0][i]]));
};

const requireOpenTab = (businessId, tabId) => {
  const tab = getTabRow(businessId, tabId);
  if (!tab) throw new Error('Tab not found');
  if (tab.status !== 'open') throw new Error('This tab is no longer open');
  return tab;
};

const openTab = (businessId, userId, data) => {
  const db = getDb();
  ensureKitchenColumns(db);
  const name = tabName(data.name);
  const { orderType, tableNumber } = tabOrderMeta(data);
  const items = tabItems(businessId, data.items);
  const now = localNowString();

  const maxRes = db.exec(sql`SELECT COALESCE(MAX(daily_order_number), 0) FROM transactions WHERE business_id = ${businessId} AND DATE(created_at) = ${now.slice(0, 10)}`);
  const dailyNumber = (Number(maxRes.length ? maxRes[0].values[0][0] : 0) || 0) + 1;
  const subtotal = round2(items.reduce((s, i) => s + i.totalPrice, 0));

  db.run(sql`
    INSERT INTO transactions (
      business_id, cashier_id, customer_id, subtotal, tax, discount, tip_amount, total,
      points_earned, points_redeemed, status, kitchen_status, daily_order_number, created_at,
      order_type, table_number, tab_name, tab_opened_at
    ) VALUES (
      ${businessId}, ${userId}, ${data.customerId || null}, ${subtotal}, 0, 0, 0, 0,
      0, 0, 'open', 'pending', ${dailyNumber}, ${now},
      ${orderType}, ${tableNumber}, ${name}, ${now}
    )
  `);
  const tabId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
  replaceTabItems(db, tabId, items);
  saveDatabase();
  return getTransactionById(businessId, tabId);
};

// Replace a tab's items (and optionally its name, order type, table or
// customer). If the items changed, the kitchen sees the order again.
const updateTab = (businessId, tabId, data) => {
  const db = getDb();
  const tab = requireOpenTab(businessId, tabId);
  const name = data.name === undefined ? tab.tab_name : tabName(data.name);
  const meta = tabOrderMeta({
    orderType: data.orderType === undefined ? tab.order_type : data.orderType,
    tableNumber: data.tableNumber === undefined ? tab.table_number : data.tableNumber
  });
  const items = tabItems(businessId, data.items);

  const before = getTransactionById(businessId, tabId).items;
  const changed = itemSignature(before) !== itemSignature(items);
  const subtotal = round2(items.reduce((s, i) => s + i.totalPrice, 0));

  replaceTabItems(db, tabId, items);
  db.run(sql`
    UPDATE transactions
    SET tab_name = ${name}, order_type = ${meta.orderType}, table_number = ${meta.tableNumber},
        customer_id = ${data.customerId === undefined ? tab.customer_id : data.customerId || null},
        subtotal = ${subtotal},
        kitchen_status = ${changed ? 'pending' : tab.kitchen_status}
    WHERE id = ${tabId}
  `);
  saveDatabase();
  return getTransactionById(businessId, tabId);
};

const getOpenTabs = (businessId) => {
  const ids = getDb().exec(sql`
    SELECT id FROM transactions
    WHERE business_id = ${businessId} AND status = 'open'
    ORDER BY tab_opened_at, id
  `);
  if (!ids.length) return [];
  return ids[0].values.map(([id]) => {
    const tab = getTransactionById(businessId, id);
    tab.items = tab.items.map((i) => ({ ...i, modifiers: i.modifiers ? JSON.parse(i.modifiers) : [] }));
    return tab;
  });
};

// Pay a tab: same data as createTransaction (final items, totals, payments).
const closeTab = (businessId, tabId, transactionData) => {
  const db = getDb();
  const tab = requireOpenTab(businessId, tabId);
  const meta = tabOrderMeta({
    orderType: transactionData.orderType || tab.order_type,
    tableNumber: transactionData.tableNumber === undefined ? tab.table_number : transactionData.tableNumber
  });
  const items = tabItems(businessId, transactionData.items);

  const before = getTransactionById(businessId, tabId).items;
  const changed = itemSignature(before) !== itemSignature(items);
  replaceTabItems(db, tabId, items);

  const customerId = transactionData.customerId || tab.customer_id || null;
  const pointsEarned = transactionData.pointsEarned || 0;
  const pointsRedeemed = transactionData.pointsRedeemed || 0;
  db.run(sql`
    UPDATE transactions
    SET status = 'completed',
        cashier_id = ${transactionData.cashierId || tab.cashier_id},
        customer_id = ${customerId},
        subtotal = ${round2(transactionData.subtotal)},
        tax = ${round2(transactionData.tax)},
        discount = ${round2(transactionData.discount)},
        tip_amount = ${round2(transactionData.tipAmount)},
        total = ${round2(transactionData.total)},
        points_earned = ${pointsEarned},
        points_redeemed = ${pointsRedeemed},
        notes = ${transactionData.notes || tab.notes || null},
        order_type = ${meta.orderType},
        table_number = ${meta.tableNumber},
        kitchen_status = ${changed ? 'pending' : tab.kitchen_status},
        created_at = ${localNowString()},
        drawer_session_id = ${openDrawerSessionId(businessId)}
    WHERE id = ${tabId}
  `);

  normalizePayments(transactionData.payments, transactionData.total).forEach((payment) => {
    db.run(sql`
      INSERT INTO payment_methods (transaction_id, method_type, amount, reference_number)
      VALUES (${tabId}, ${payment.methodType}, ${payment.amount}, ${payment.referenceNumber})
    `);
  });
  saveDatabase();

  if (customerId) {
    updateCustomerPoints(businessId, customerId, pointsEarned - pointsRedeemed, transactionData.total);
  }
  require('./recipeService').deductForSale(businessId, tabId, transactionData.cashierId || tab.cashier_id);
  return getTransactionById(businessId, tabId);
};

// Cancel a tab that won't be paid (e.g. walked out, opened by mistake).
const cancelTab = (businessId, tabId, reason) => {
  requireOpenTab(businessId, tabId);
  const text = String(reason || '').trim();
  if (!text) throw new Error('A reason is required');
  getDb().run(sql`
    UPDATE transactions
    SET status = 'cancelled', void_reason = ${text}, kitchen_status = 'completed'
    WHERE id = ${tabId} AND business_id = ${businessId}
  `);
  saveDatabase();
  return { success: true };
};

module.exports = {
  openTab,
  updateTab,
  getOpenTabs,
  closeTab,
  cancelTab,
  normalizePayments,
  getTaxRate,
  updateTaxRate,
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

