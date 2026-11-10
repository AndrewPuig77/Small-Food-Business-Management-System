const { ipcMain, dialog, BrowserWindow } = require('electron');
const { isSetupComplete, init } = require('./database/database');
const { sql } = require('./database/sql');
const AuthService = require('./services/authService');
const MenuService = require('./services/menuService');
const EmployeeService = require('./services/employeeService');
const ScheduleService = require('./services/scheduleService');
const InventoryService = require('./services/inventoryService');
const POSService = require('./services/posService');
const ExpenseService = require('./services/expenseService');
const TimeLogService = require('./services/timeLogService');
const ReservationService = require('./services/reservationService');
const TimeOffService = require('./services/timeOffService');
const TaskService = require('./services/taskService');
const AnnouncementService = require('./services/announcementService');
const ShiftSwapService = require('./services/shiftSwapService');
const AnalyticsService = require('./services/analyticsService');
const DashboardService = require('./services/dashboardService');
const ModifierService = require('./services/modifierService');
const CashDrawerService = require('./services/cashDrawerService');
const RefundService = require('./services/refundService');
const BackupService = require('./services/backupService');
const RecipeService = require('./services/recipeService');
const AuditService = require('./services/auditService');
const AuditHooks = require('./security/auditHooks');
const { createAccessControl, AccessDenied } = require('./security/accessControl');

// Setup IPC handlers for communication between main and renderer processes
const setupIPC = async () => {
  // Initialize database
  await init();

  // Automatic backups: one at startup if the last is a day old, then checked
  // hourly while the app runs.
  const runAutoBackup = () => {
    try {
      BackupService.autoBackupIfDue();
    } catch (error) {
      console.error('Automatic backup failed:', error);
    }
  };
  runAutoBackup();
  setInterval(runAutoBackup, 60 * 60 * 1000).unref?.();
  
  // ---- Access control and audit for every channel (see security/accessControl.js)
  // Employee permission flags for a signed-in user (from their employee record)
  const permissionsFor = (user) => {
    try {
      const { getDb } = require('./database/database');
      const r = getDb().exec(sql`SELECT permissions FROM employees WHERE user_id = ${user.userId} LIMIT 1`);
      const raw = r.length && r[0].values.length ? r[0].values[0][0] : null;
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  };
  const access = createAccessControl({ permissionsFor });
  const isDeniedLevel = (channel) => access.levelFor(channel) !== 'signedIn';

  // Register a handler that is checked before it runs and audited after.
  function handle(channel, fn) {
    ipcMain.handle(channel, async (event, ...args) => {
      const senderId = event.sender.id;
      let user;
      try {
        user = access.authorize(channel, senderId, args);
      } catch (error) {
        if (!(error instanceof AccessDenied)) throw error;
        const who = access.userFor(senderId);
        if (who) AuditService.record(who.businessId, who.userId, 'access.denied', { channel, reason: error.message });
        // Mutations report errors as { success: false }; reads simply fail
        if (isDeniedLevel(channel)) return { success: false, error: error.message, denied: true };
        throw error;
      }
      const ctx = AuditHooks.before(channel, args);
      const result = await fn(event, ...args);
      try {
        AuditHooks.after(channel, args, result, ctx, user || access.userFor(senderId));
      } catch (error) {
        console.error('Audit log error:', error);
      }
      return result;
    });
  }

  const sessionUser = (decoded) => ({
    userId: decoded.userId,
    role: decoded.role,
    businessId: decoded.businessId,
    username: decoded.username
  });

  handle('audit:list', async (event, { businessId, filters }) => {
    try {
      return { success: true, data: AuditService.list(businessId, filters || {}), actions: AuditService.ACTIONS };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Check if setup is complete
  handle('check-setup', async () => {
    return isSetupComplete();
  });

  // Complete setup
  handle('complete-setup', async (event, setupData) => {
    // Setup can only run once: afterwards new owners can't be created this way
    if (isSetupComplete()) {
      return { success: false, error: 'Setup has already been completed' };
    }
    return AuthService.completeSetup(setupData);
  });

  // Login
  handle('login', async (event, payload) => {
    const result = AuthService.login(payload.username, payload.password, payload.remember);
    if (result.success) {
      const u = result.user;
      access.bind(event.sender.id, { userId: u.userId, role: u.role, businessId: u.businessId, username: u.username });
      AuditService.record(u.businessId, u.userId, 'login.success', {});
    } else {
      AuditService.record(1, null, 'login.failed', { username: String(payload.username || '').slice(0, 60) });
    }
    return result;
  });

  // Verify token
  handle('verify-token', async (event, token) => {
    const result = AuthService.verifyToken(token);
    if (result.valid) access.bind(event.sender.id, sessionUser(result.user));
    else access.unbind(event.sender.id);
    return result;
  });

  // Logout
  handle('logout', async (event, token) => {
    access.unbind(event.sender.id);
    return AuthService.logout(token);
  });

  // Verify owner code
  handle('auth:verify-owner-code', async (event, { businessId, code }) => {
    try {
      const { getDb } = require('./database/database');
      const db = getDb();
      const result = db.exec(sql`
        SELECT owner_code FROM businesses WHERE id = ${businessId}
      `);

      if (result.length > 0 && result[0].values.length > 0) {
        const ownerCode = result[0].values[0][0];
        if (ownerCode && ownerCode === code) {
          access.grantApproval(event.sender.id);
          const who = access.userFor(event.sender.id);
          if (who) AuditService.record(who.businessId, who.userId, 'owner_code.approved', {});
          return { success: true };
        }
      }
      const who = access.userFor(event.sender.id);
      if (who) AuditService.record(who.businessId, who.userId, 'owner_code.rejected', {});
      return { success: false };
    } catch (error) {
      console.error('Error verifying owner code:', error);
      return { success: false, error: error.message };
    }
  });

  // Get business settings
  handle('get-business', async (event, businessId) => {
    try {
      const { getDb } = require('./database/database');
      const db = getDb();
      const result = db.exec(sql`SELECT * FROM businesses WHERE id = ${businessId}`);
      if (result.length > 0 && result[0].values.length > 0) {
        const columns = result[0].columns;
        const values = result[0].values[0];
        const business = {};
        columns.forEach((col, index) => {
          business[col] = values[index];
        });
        return business;
      }
      return null;
    } catch (error) {
      console.error('Error getting business:', error);
      return null;
    }
  });

  // Update owner code
  handle('business:update-owner-code', async (event, { businessId, ownerCode }) => {
    try {
      const { getDb, saveDatabase } = require('./database/database');
      const db = getDb();
      db.run(sql`UPDATE businesses SET owner_code = ${ownerCode} WHERE id = ${businessId}`);
      saveDatabase();
      console.log(`[IPC] Owner code updated for business ${businessId}`);
      return { success: true };
    } catch (error) {
      console.error('Error updating owner code:', error);
      return { success: false, error: error.message };
    }
  });

  // Get user by ID
  handle('user:get-by-id', async (event, { businessId, userId }) => {
    try {
      const { getDb } = require('./database/database');
      const db = getDb();
      const result = db.exec(sql`
        SELECT id, username, full_name, email, role, active
        FROM users
        WHERE id = ${userId} AND business_id = ${businessId}
      `);
      
      if (result.length > 0 && result[0].values.length > 0) {
        const columns = result[0].columns;
        const values = result[0].values[0];
        const user = {};
        columns.forEach((col, idx) => {
          user[col] = values[idx];
        });
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  });

  // Menu Items
  handle('menu:get-all-items', async (event, businessId) => {
    return MenuService.getAllItems(businessId);
  });

  handle('menu:get-item', async (event, itemId) => {
    return MenuService.getItemById(itemId);
  });

  handle('menu:create-item', async (event, { businessId, itemData }) => {
    return MenuService.createItem(businessId, itemData);
  });

  handle('menu:update-item', async (event, { itemId, itemData }) => {
    return MenuService.updateItem(itemId, itemData);
  });

  handle('menu:delete-item', async (event, itemId) => {
    return MenuService.deleteItem(itemId);
  });

  // Modifier groups. Errors (e.g. validation) are returned, not thrown, so
  // the UI can show the message.
  const modifierCall = (fn) => {
    try {
      return { success: true, data: fn() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  handle('modifiers:get-groups', async (event, businessId) =>
    modifierCall(() => ModifierService.getGroups(businessId)));

  handle('modifiers:get-by-item', async (event, businessId) =>
    modifierCall(() => ModifierService.getModifiersByItem(businessId)));

  handle('modifiers:create-group', async (event, { businessId, groupData }) =>
    modifierCall(() => ModifierService.createGroup(businessId, groupData)));

  handle('modifiers:update-group', async (event, { businessId, groupId, groupData }) =>
    modifierCall(() => ModifierService.updateGroup(businessId, groupId, groupData)));

  handle('modifiers:delete-group', async (event, { businessId, groupId }) =>
    modifierCall(() => ModifierService.deleteGroup(businessId, groupId)));

  handle('modifiers:set-item-groups', async (event, { businessId, menuItemId, groupIds }) =>
    modifierCall(() => ModifierService.setItemGroups(businessId, menuItemId, groupIds)));

  // Menu Categories
  handle('menu:get-categories', async (event, businessId) => {
    return MenuService.getCategories(businessId);
  });

  handle('menu:create-category', async (event, { businessId, categoryData }) => {
    return MenuService.createCategory(businessId, categoryData);
  });

  handle('menu:update-category', async (event, { categoryId, categoryData }) => {
    return MenuService.updateCategory(categoryId, categoryData);
  });

  handle('menu:delete-category', async (event, categoryId) => {
    return MenuService.deleteCategory(categoryId);
  });

  // Employees
  handle('employee:get-all', async (event, businessId) => {
    return EmployeeService.getAllEmployees(businessId);
  });

  handle('employee:get-by-id', async (event, { businessId, employeeId }) => {
    return EmployeeService.getEmployeeById(businessId, employeeId);
  });

  handle('employee:create', async (event, { businessId, employeeData }) => {
    return EmployeeService.createEmployee(businessId, employeeData);
  });

  handle('employee:update', async (event, { businessId, employeeId, employeeData }) => {
    return EmployeeService.updateEmployee(businessId, employeeId, employeeData);
  });

  handle('employee:delete', async (event, { businessId, employeeId }) => {
    return EmployeeService.deleteEmployee(businessId, employeeId);
  });

  handle('employee:update-status', async (event, { businessId, employeeId, status }) => {
    return EmployeeService.updateEmployeeStatus(businessId, employeeId, status);
  });

  // Employee Schedules
  handle('employee:get-schedules', async (event, employeeId) => {
    return EmployeeService.getEmployeeSchedules(employeeId);
  });

  handle('employee:save-schedule', async (event, { employeeId, scheduleData }) => {
    return EmployeeService.saveEmployeeSchedule(employeeId, scheduleData);
  });

  // Employee Notes
  handle('employee:get-notes', async (event, employeeId) => {
    return EmployeeService.getEmployeeNotes(employeeId);
  });

  handle('employee:add-note', async (event, { employeeId, noteData }) => {
    return EmployeeService.addEmployeeNote(employeeId, noteData);
  });

  // Emergency Contacts
  handle('employee:get-emergency-contacts', async (event, employeeId) => {
    return EmployeeService.getEmergencyContacts(employeeId);
  });

  handle('employee:save-emergency-contact', async (event, { employeeId, contactData }) => {
    return EmployeeService.saveEmergencyContact(employeeId, contactData);
  });

  handle('employee:delete-emergency-contact', async (event, contactId) => {
    return EmployeeService.deleteEmergencyContact(contactId);
  });

  // Employee Documents
  handle('employee:get-documents', async (event, employeeId) => {
    return EmployeeService.getEmployeeDocuments(employeeId);
  });

  handle('employee:get-document', async (event, documentId) => {
    return EmployeeService.getEmployeeDocument(documentId);
  });

  handle('employee:upload-document', async (event, { employeeId, documentData }) => {
    return EmployeeService.uploadEmployeeDocument(employeeId, documentData);
  });

  handle('employee:delete-document', async (event, documentId) => {
    return EmployeeService.deleteEmployeeDocument(documentId);
  });

  // Create user account for an existing employee
  handle('employee:create-account', async (event, { businessId, employeeId, accountData }) => {
    return EmployeeService.createUserAccountForEmployee(businessId, employeeId, accountData);
  });

  // Time Logs
  handle('employee:get-time-logs', async (event, { employeeId, startDate, endDate }) => {
    return EmployeeService.getTimeLogs(employeeId, startDate, endDate);
  });

  handle('employee:clock-in', async (event, employeeId) => {
    return EmployeeService.clockIn(employeeId);
  });

  handle('employee:clock-out', async (event, employeeId) => {
    return EmployeeService.clockOut(employeeId);
  });

  handle('employee:calculate-payroll', async (event, { employeeId, startDate, endDate }) => {
    return EmployeeService.calculatePayroll(employeeId, startDate, endDate);
  });

  // Schedule/Shifts
  handle('schedule:get-shifts', async (event, { businessId, startDate, endDate }) => {
    console.log('[IPC] schedule:get-shifts called with:', { businessId, startDate, endDate });
    const result = ScheduleService.getShifts(businessId, startDate, endDate);
    console.log('[IPC] schedule:get-shifts returning', result.length, 'shifts');
    return result;
  });

  handle('schedule:create-shift', async (event, { businessId, shiftData }) => {
    console.log('[IPC] schedule:create-shift called with:', { businessId, shiftData });
    const result = ScheduleService.createShift(businessId, shiftData);
    console.log('[IPC] schedule:create-shift created shift:', result);
    return result;
  });

  handle('schedule:update-shift', async (event, { businessId, shiftId, shiftData }) => {
    return ScheduleService.updateShift(businessId, shiftId, shiftData);
  });

  handle('schedule:delete-shift', async (event, { businessId, shiftId }) => {
    return ScheduleService.deleteShift(businessId, shiftId);
  });

  // Inventory Items
  handle('inventory:get-all-items', async (event, businessId) => {
    return InventoryService.getAllItems(businessId);
  });

  handle('inventory:get-item', async (event, { businessId, itemId }) => {
    return InventoryService.getItemById(businessId, itemId);
  });

  handle('inventory:create-item', async (event, { businessId, itemData }) => {
    return InventoryService.createItem(businessId, itemData);
  });

  handle('inventory:create-items-batch', async (event, { businessId, itemsArray }) => {
    return InventoryService.createItemsBatch(businessId, itemsArray);
  });

  handle('inventory:update-item', async (event, { businessId, itemId, itemData }) => {
    return InventoryService.updateItem(businessId, itemId, itemData);
  });

  handle('inventory:delete-item', async (event, { businessId, itemId }) => {
    return InventoryService.deleteItem(businessId, itemId);
  });

  handle('inventory:adjust-stock', async (event, { businessId, itemId, adjustment, userId, notes, transactionType, vendor }) => {
    return InventoryService.adjustStock(businessId, itemId, adjustment, userId, notes, transactionType, vendor);
  });

  handle('inventory:get-low-stock', async (event, businessId) => {
    return InventoryService.getLowStockItems(businessId);
  });

  // Inventory Categories
  handle('inventory:get-categories', async (event, businessId) => {
    return InventoryService.getAllCategories(businessId);
  });

  handle('inventory:create-category', async (event, { businessId, categoryData }) => {
    return InventoryService.createCategory(businessId, categoryData);
  });

  handle('inventory:update-category', async (event, { businessId, categoryId, categoryData }) => {
    return InventoryService.updateCategory(businessId, categoryId, categoryData);
  });

  handle('inventory:delete-category', async (event, { businessId, categoryId }) => {
    return InventoryService.deleteCategory(businessId, categoryId);
  });

  // Suppliers
  handle('inventory:get-suppliers', async (event, businessId) => {
    return InventoryService.getAllSuppliers(businessId);
  });

  handle('inventory:create-supplier', async (event, { businessId, supplierData }) => {
    return InventoryService.createSupplier(businessId, supplierData);
  });

  handle('inventory:update-supplier', async (event, { businessId, supplierId, supplierData }) => {
    return InventoryService.updateSupplier(businessId, supplierId, supplierData);
  });

  handle('inventory:delete-supplier', async (event, { businessId, supplierId }) => {
    return InventoryService.deleteSupplier(businessId, supplierId);
  });

  // Inventory Transactions
  handle('inventory:get-item-transactions', async (event, { businessId, itemId, limit }) => {
    return InventoryService.getItemTransactions(businessId, itemId, limit);
  });

  handle('inventory:get-all-transactions', async (event, { businessId, limit }) => {
    return InventoryService.getAllTransactions(businessId, limit);
  });

  // POS - Customers
  handle('pos:search-customers', async (event, { businessId, searchTerm }) => {
    return POSService.searchCustomers(businessId, searchTerm);
  });

  handle('pos:get-customer', async (event, { businessId, customerId }) => {
    return POSService.getCustomerById(businessId, customerId);
  });

  handle('pos:create-customer', async (event, { businessId, customerData }) => {
    return POSService.createCustomer(businessId, customerData);
  });

  // POS - Transactions
  // Cash drawer. Errors are returned so the UI can show the message.
  const drawerCall = (fn) => {
    try {
      return { success: true, data: fn() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  handle('drawer:get-current', async (event, businessId) =>
    drawerCall(() => CashDrawerService.getCurrentSession(businessId)));

  handle('drawer:open', async (event, { businessId, userId, openingFloat }) =>
    drawerCall(() => CashDrawerService.openSession(businessId, userId, openingFloat)));

  handle('drawer:add-movement', async (event, { businessId, userId, type, amount, reason }) =>
    drawerCall(() => CashDrawerService.addMovement(businessId, userId, type, amount, reason)));

  handle('drawer:close', async (event, { businessId, userId, countedCash, notes }) =>
    drawerCall(() => CashDrawerService.closeSession(businessId, userId, countedCash, notes)));

  handle('drawer:get-sessions', async (event, { businessId, limit }) =>
    drawerCall(() => CashDrawerService.getSessions(businessId, limit)));

  handle('drawer:get-session-report', async (event, { businessId, sessionId }) =>
    drawerCall(() => CashDrawerService.getSessionReport(businessId, sessionId)));

  handle('drawer:get-daily-report', async (event, { businessId, date }) =>
    drawerCall(() => CashDrawerService.getDailyReport(businessId, date)));

  // Backups
  const backupCall = async (fn) => {
    try {
      return { success: true, data: await fn() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  const windowFor = (event) => BrowserWindow.fromWebContents(event.sender);
  // The file picked in the "restore from file" dialog. Kept here so the
  // renderer never passes a file path to restore.
  let chosenRestoreFile = null;

  handle('backup:list', async () => backupCall(() => ({
    backups: BackupService.listBackups(),
    folder: BackupService.backupsDir(),
    keepAuto: BackupService.KEEP_AUTO
  })));

  handle('backup:create', async () => backupCall(() => BackupService.createBackup('manual')));

  handle('backup:export', async (event) => backupCall(async () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    const result = await dialog.showSaveDialog(windowFor(event), {
      title: 'Export backup',
      defaultPath: `food-business-backup-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.db`,
      filters: [{ name: 'Backup', extensions: ['db'] }]
    });
    if (result.canceled || !result.filePath) return null;
    return BackupService.exportBackup(result.filePath);
  }));

  handle('backup:restore', async (event, { file }) => backupCall(() => BackupService.restoreBackup(file)));

  handle('backup:choose-file', async (event) => backupCall(async () => {
    const result = await dialog.showOpenDialog(windowFor(event), {
      title: 'Restore from a backup file',
      properties: ['openFile'],
      filters: [{ name: 'Backup', extensions: ['db'] }]
    });
    if (result.canceled || !result.filePaths.length) return null;
    const summary = BackupService.inspectFile(result.filePaths[0]);
    chosenRestoreFile = result.filePaths[0];
    return { fileName: require('path').basename(chosenRestoreFile), ...summary };
  }));

  handle('backup:restore-chosen', async () => backupCall(() => {
    if (!chosenRestoreFile) throw new Error('Choose a backup file first');
    const result = BackupService.restoreFromFile(chosenRestoreFile);
    chosenRestoreFile = null;
    return result;
  }));

  // Recipes
  const recipeCall = (fn) => {
    try {
      return { success: true, data: fn() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  handle('recipes:get-by-item', async (event, businessId) => recipeCall(() => RecipeService.getRecipesByItem(businessId)));
  handle('recipes:set', async (event, { businessId, menuItemId, lines }) => recipeCall(() => RecipeService.setRecipe(businessId, menuItemId, lines)));

  // Open tabs
  const tabCall = (fn) => {
    try {
      return { success: true, data: fn() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  handle('tabs:get-open', async (event, businessId) => tabCall(() => POSService.getOpenTabs(businessId)));
  handle('tabs:open', async (event, { businessId, userId, tab }) => tabCall(() => POSService.openTab(businessId, userId, tab)));
  handle('tabs:update', async (event, { businessId, tabId, tab }) => tabCall(() => POSService.updateTab(businessId, tabId, tab)));
  handle('tabs:close', async (event, { businessId, tabId, transactionData }) => tabCall(() => POSService.closeTab(businessId, tabId, transactionData)));
  handle('tabs:cancel', async (event, { businessId, tabId, reason }) => tabCall(() => POSService.cancelTab(businessId, tabId, reason)));

  // Refunds
  handle('refunds:get-refundable', async (event, { businessId, transactionId }) => {
    try {
      return { success: true, data: RefundService.getRefundable(businessId, transactionId) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  handle('refunds:create', async (event, { businessId, transactionId, userId, refund }) => {
    try {
      return { success: true, data: RefundService.createRefund(businessId, transactionId, userId, refund) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  handle('business:get-tax-rate', async (event, businessId) => {
    try {
      return { success: true, taxRate: POSService.getTaxRate(businessId) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  handle('business:update-tax-rate', async (event, { businessId, taxRate }) => {
    try {
      return { success: true, taxRate: POSService.updateTaxRate(businessId, taxRate) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  handle('pos:create-transaction', async (event, { businessId, transactionData }) => {
    return POSService.createTransaction(businessId, transactionData);
  });

  handle('pos:get-transaction', async (event, { businessId, transactionId }) => {
    return POSService.getTransactionById(businessId, transactionId);
  });

  handle('pos:get-recent-transactions', async (event, { businessId, limit }) => {
    return POSService.getRecentTransactions(businessId, limit);
  });

  handle('pos:get-transactions-by-date', async (event, { businessId, startDate, endDate }) => {
    return POSService.getTransactionsByDateRange(businessId, startDate, endDate);
  });

  handle('pos:get-daily-summary', async (event, { businessId, date }) => {
    return POSService.getDailySalesSummary(businessId, date);
  });

  handle('pos:get-payment-methods', async (event, { businessId, startDate, endDate }) => {
    return POSService.getPaymentMethodsByDateRange(businessId, startDate, endDate);
  });

  // Debug: return raw transaction rows from DB for an expanded UTC window
  handle('debug:get-raw-transactions', async (event, { businessId, startDate, endDate }) => {
    try {
      const dbModule = require('./database/database');
      const db = dbModule.getDb();
      // Interpret startDate/endDate as local dates, but query an expanded UTC window for visibility
      const startLocal = new Date(startDate + 'T00:00:00');
      const endLocal = new Date(endDate + 'T23:59:59');
      const minUtc = new Date(startLocal.getTime() - (24 * 60 * 60 * 1000));
      const maxUtc = new Date(endLocal.getTime() + (24 * 60 * 60 * 1000));

      const fmt = (d) => {
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        const hh = String(d.getUTCHours()).padStart(2, '0');
        const mm = String(d.getUTCMinutes()).padStart(2, '0');
        const ss = String(d.getUTCSeconds()).padStart(2, '0');
        return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
      };

      const q = sql`
        SELECT t.*, u.full_name as cashier_name, c.name as customer_name
        FROM transactions t
        LEFT JOIN users u ON t.cashier_id = u.id
        LEFT JOIN customers c ON t.customer_id = c.id
        WHERE t.business_id = ${businessId}
          AND t.created_at BETWEEN ${fmt(minUtc)} AND ${fmt(maxUtc)}
        ORDER BY t.created_at DESC
      `;

      const res = db.exec(q);
      if (!res || res.length === 0) return [];
      const cols = res[0].columns;
      const vals = res[0].values;
      return vals.map(row => {
        const obj = {};
        cols.forEach((c, i) => { obj[c] = row[i]; });
        return obj;
      });
    } catch (e) {
      console.error('[IPC] debug:get-raw-transactions failed', e);
      return { error: String(e && e.message ? e.message : e) };
    }
  });

  handle('pos:void-transaction', async (event, { businessId, transactionId, voidReason, voidedBy }) => {
    try {
      return { success: true, data: POSService.voidTransaction(businessId, transactionId, voidReason, voidedBy) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // POS - Kitchen Display System
  handle('pos:get-orders', async (event, { businessId }) => {
    return POSService.getOrders(businessId);
  });

  handle('pos:update-order-kitchen-status', async (event, { businessId, orderId, kitchenStatus }) => {
    return POSService.updateOrderKitchenStatus(businessId, orderId, kitchenStatus);
  });

  handle('pos:delete-transaction', async (event, { businessId, orderId }) => {
    return POSService.deleteTransaction(businessId, orderId);
  });

  handle('pos:reset-order-sequence', async (event, { businessId }) => {
    return POSService.resetOrderSequence(businessId);
  });

  handle('pos:purge-transactions', async (event, { businessId }) => {
    return POSService.purgeTransactionsForBusiness(businessId);
  });

  handle('pos:validate-manager-pin', async (event, { businessId, userId, pin }) => {
    return POSService.validateManagerPin(businessId, userId, pin);
  });

  // User - Change PIN
  handle('user:change-pin', async (event, { businessId, userId, currentPin, newPin }) => {
    return AuthService.changePin(businessId, userId, currentPin, newPin);
  });

  // User - Reset PIN
  handle('user:reset-pin', async (event, { businessId, userId, password, newPin }) => {
    return AuthService.resetPin(businessId, userId, password, newPin);
  });

  // Auth - Verify identity for password reset
  handle('auth:verify-identity', async (event, { username, email }) => {
    const result = AuthService.verifyIdentity(username, email);
    // Only a successful identity check allows a password reset, for that user
    if (result.success) access.grantResetTicket(event.sender.id, result.userId);
    return result;
  });

  // Auth - Reset password
  handle('auth:reset-password', async (event, { userId, businessId, newPassword }) => {
    const result = AuthService.resetPassword(userId, businessId, newPassword);
    if (result && result.success) AuditService.record(businessId, userId, 'password.reset', {});
    return result;
  });

  // POS - Update customer
  handle('pos:update-customer', async (event, { businessId, customerId, customerData }) => {
    return POSService.updateCustomer(businessId, customerId, customerData);
  });

  // POS - Update customer points
  handle('pos:update-customer-points', async (event, { businessId, customerId, pointsChange, totalSpent }) => {
    return POSService.updateCustomerPoints(businessId, customerId, pointsChange, totalSpent);
  });

  // POS - Delete customer
  handle('pos:delete-customer', async (event, { businessId, customerId }) => {
    return POSService.deleteCustomer(businessId, customerId);
  });

  // ==================== EXPENSES ====================
  
  // Get all expenses
  handle('expense:get-all', async (event, businessId) => {
    return ExpenseService.getAllExpenses(businessId);
  });

  // Get expenses by date range
  handle('expense:get-by-date', async (event, { businessId, startDate, endDate }) => {
    return ExpenseService.getExpensesByDateRange(businessId, startDate, endDate);
  });

  // Get expenses by category
  handle('expense:get-by-category', async (event, { businessId, startDate, endDate }) => {
    return ExpenseService.getExpensesByCategory(businessId, startDate, endDate);
  });

  // Create expense
  handle('expense:create', async (event, { businessId, expenseData }) => {
    return ExpenseService.createExpense(businessId, expenseData);
  });

  // Update expense
  handle('expense:update', async (event, { expenseId, expenseData }) => {
    return ExpenseService.updateExpense(expenseId, expenseData);
  });

  // Delete expense
  handle('expense:delete', async (event, expenseId) => {
    return ExpenseService.deleteExpense(expenseId);
  });

  // Get total expenses
  handle('expense:get-total', async (event, { businessId, startDate, endDate }) => {
    return ExpenseService.getTotalExpenses(businessId, startDate, endDate);
  });

  // Recurring expenses
  handle('expense:create-recurring', async (event, { businessId, recurringData }) => {
    return ExpenseService.createRecurringExpense(businessId, recurringData);
  });

  handle('expense:get-recurring', async (event, businessId) => {
    return ExpenseService.getRecurringExpenses(businessId);
  });

  handle('expense:process-recurring', async (event, businessId) => {
    return ExpenseService.processRecurringExpenses(businessId);
  });

  handle('expense:update-recurring', async (event, { recurringId, data }) => {
    return ExpenseService.updateRecurringExpense(recurringId, data);
  });

  handle('expense:delete-recurring', async (event, recurringId) => {
    return ExpenseService.deleteRecurringExpense(recurringId);
  });

  // ==================== TIME LOGS / CLOCK IN-OUT ====================
  
  // Clock in
  handle('timelog:clock-in', async (event, { employeeId, notes }) => {
    return TimeLogService.clockIn(employeeId, notes);
  });

  // Clock out
  handle('timelog:clock-out', async (event, { employeeId, notes }) => {
    return TimeLogService.clockOut(employeeId, notes);
  });

  // Get time logs
  handle('timelog:get-all', async (event, { businessId, startDate, endDate }) => {
    return TimeLogService.getTimeLogs(businessId, startDate, endDate);
  });

  // Get employee time logs
  handle('timelog:get-employee', async (event, { employeeId, startDate, endDate }) => {
    return TimeLogService.getEmployeeTimeLogs(employeeId, startDate, endDate);
  });

  // Check if employee is clocked in
  handle('timelog:is-clocked-in', async (event, employeeId) => {
    console.log('[IPC] timelog:is-clocked-in called for employee:', employeeId);
    const result = TimeLogService.isEmployeeClockedIn(employeeId);
    console.log('[IPC] timelog:is-clocked-in result:', result);
    return result;
  });

  // Get currently clocked in employees
  handle('timelog:get-clocked-in', async (event, businessId) => {
    return TimeLogService.getClockedInEmployees(businessId);
  });

  // Update time log
  handle('timelog:update', async (event, { logId, updates }) => {
    return TimeLogService.updateTimeLog(logId, updates);
  });

  // Delete time log
  handle('timelog:delete', async (event, logId) => {
    return TimeLogService.deleteTimeLog(logId);
  });

  // Get payroll data
  handle('timelog:get-payroll', async (event, { businessId, startDate, endDate }) => {
    return TimeLogService.getPayrollData(businessId, startDate, endDate);
  });
  
    // Admin: Cleanup negative hours and optionally set hourly rates for employees
    handle('admin:fix-payroll-employees', async (event, { businessId, employees }) => {
      try {
        return TimeLogService.cleanupAndFixEmployees(businessId, employees || []);
      } catch (e) {
        console.error('[IPC] admin:fix-payroll-employees failed', e);
        return { error: String(e && e.message ? e.message : e) };
      }
    });

  // Get payroll summary
  handle('timelog:get-payroll-summary', async (event, { businessId, startDate, endDate }) => {
    return TimeLogService.getPayrollSummary(businessId, startDate, endDate);
  });

  // Debug: Get all time logs (no filters)
  handle('timelog:debug-all', async (event) => {
    const { getDb } = require('./database/database');
    const db = getDb();
    const result = db.exec('SELECT * FROM time_logs');
    console.log('DEBUG: All time logs:', result);
    return result;
  });

  // Reservations - Settings
  handle('reservation:get-settings', async (event, businessId) => {
    const settings = ReservationService.getReservationSettings(businessId);
    return { success: true, settings };
  });

  handle('reservation:update-settings', async (event, { businessId, settings }) => {
    try {
      console.log('IPC handler reservation:update-settings called with:', { businessId, settings });
      const result = ReservationService.updateReservationSettings(businessId, settings);
      console.log('IPC handler returning:', result);
      return result;
    } catch (error) {
      console.error('Error in reservation:update-settings handler:', error);
      return { success: false, message: error.message || 'Unknown error' };
    }
  });

  handle('reservation:set-enabled', async (event, { businessId, enabled }) => {
    return ReservationService.setReservationEnabled(businessId, enabled);
  });

  // Reservations - CRUD
  handle('reservation:get-all', async (event, { businessId, startDate, endDate }) => {
    return ReservationService.getAllReservations(businessId, startDate, endDate);
  });

  handle('reservation:get-by-date', async (event, { businessId, date }) => {
    console.log('IPC: reservation:get-by-date called with businessId:', businessId, 'date:', date);
    const reservations = ReservationService.getReservationsByDate(businessId, date);
    console.log('IPC: Returning reservations:', reservations);
    return { success: true, reservations };
  });

  handle('reservation:create', async (event, { businessId, reservationData }) => {
    return ReservationService.createReservation(businessId, reservationData);
  });

  handle('reservation:update', async (event, { businessId, reservationId, reservationData }) => {
    return ReservationService.updateReservation(businessId, reservationId, reservationData);
  });

  handle('reservation:update-status', async (event, { businessId, reservationId, status }) => {
    return ReservationService.updateReservationStatus(businessId, reservationId, status);
  });

  handle('reservation:delete', async (event, { businessId, reservationId }) => {
    return ReservationService.deleteReservation(businessId, reservationId);
  });

  handle('reservation:get-available-slots', async (event, { businessId, date, partySize }) => {
    return ReservationService.getAvailableTimeSlots(businessId, date, partySize);
  });

  // Time Off Requests
  handle('timeoff:get-all', async (event, { businessId, filters }) => {
    return TimeOffService.getAllTimeOffRequests(businessId, filters);
  });

  handle('timeoff:get-employee', async (event, employeeId) => {
    return TimeOffService.getEmployeeTimeOffRequests(employeeId);
  });

  handle('timeoff:create', async (event, requestData) => {
    return TimeOffService.createTimeOffRequest(requestData);
  });

  handle('timeoff:review', async (event, { requestId, reviewData }) => {
    return TimeOffService.reviewTimeOffRequest(requestId, reviewData);
  });

  handle('timeoff:delete', async (event, requestId) => {
    return TimeOffService.deleteTimeOffRequest(requestId);
  });

  // Employee Availability
  handle('availability:get', async (event, employeeId) => {
    return TimeOffService.getEmployeeAvailability(employeeId);
  });

  handle('availability:update', async (event, { employeeId, availabilityData }) => {
    return TimeOffService.updateEmployeeAvailability(employeeId, availabilityData);
  });

  // Tasks
  handle('tasks:get-all', async (event, { businessId, filters }) => {
    return TaskService.getAllTasks(businessId, filters);
  });

  handle('tasks:get-employee', async (event, { employeeId, status }) => {
    return TaskService.getEmployeeTasks(employeeId, status);
  });

  handle('tasks:create', async (event, taskData) => {
    return TaskService.createTask(taskData);
  });

  handle('tasks:update', async (event, { taskId, taskData }) => {
    return TaskService.updateTask(taskId, taskData);
  });

  handle('tasks:complete', async (event, { taskId, completedBy }) => {
    return TaskService.completeTask(taskId, completedBy);
  });

  handle('tasks:delete', async (event, taskId) => {
    return TaskService.deleteTask(taskId);
  });

  // Announcements
  handle('announcements:get-all', async (event, { businessId, filters }) => {
    return AnnouncementService.getAllAnnouncements(businessId, filters);
  });

  handle('announcements:get-for-role', async (event, { businessId, role }) => {
    console.log('[IPC] announcements:get-for-role called with:', { businessId, role });
    const result = AnnouncementService.getAnnouncementsForRole(businessId, role);
    console.log('[IPC] announcements:get-for-role returning', result.length, 'announcements');
    return result;
  });

  handle('announcements:create', async (event, announcementData) => {
    console.log('[IPC] announcements:create called with:', announcementData);
    const result = AnnouncementService.createAnnouncement(announcementData);
    console.log('[IPC] announcements:create created:', result);
    return result;
  });

  handle('announcements:update', async (event, { announcementId, announcementData }) => {
    return AnnouncementService.updateAnnouncement(announcementId, announcementData);
  });

  handle('announcements:delete', async (event, announcementId) => {
    return AnnouncementService.deleteAnnouncement(announcementId);
  });

  // Shift Swap Requests
  handle('shiftswap:get-all', async (event, { businessId, filters }) => {
    return ShiftSwapService.getAllShiftSwapRequests(businessId, filters);
  });

  handle('shiftswap:get-employee', async (event, employeeId) => {
    return ShiftSwapService.getEmployeeShiftSwapRequests(employeeId);
  });

  handle('shiftswap:create', async (event, requestData) => {
    return ShiftSwapService.createShiftSwapRequest(requestData);
  });

  handle('shiftswap:review', async (event, { requestId, reviewData }) => {
    return ShiftSwapService.reviewShiftSwapRequest(requestId, reviewData);
  });

  handle('shiftswap:cancel', async (event, { requestId, employeeId }) => {
    return ShiftSwapService.cancelShiftSwapRequest(requestId, employeeId);
  });

  handle('shiftswap:delete', async (event, requestId) => {
    return ShiftSwapService.deleteShiftSwapRequest(requestId);
  });

  // ==================== ANALYTICS HANDLERS ====================
  
  handle('analytics:sales', async (event, { businessId, startDate, endDate, groupBy }) => {
    return AnalyticsService.getSalesAnalytics(businessId, startDate, endDate, groupBy);
  });

  handle('analytics:sales-trends', async (event, { businessId, currentStart, currentEnd, previousStart, previousEnd }) => {
    return AnalyticsService.getSalesTrends(businessId, currentStart, currentEnd, previousStart, previousEnd);
  });

  handle('analytics:top-bottom-performers', async (event, { businessId, startDate, endDate, limit }) => {
    return AnalyticsService.getTopBottomPerformers(businessId, startDate, endDate, limit);
  });

  handle('analytics:inventory', async (event, businessId) => {
    return AnalyticsService.getInventoryAnalytics(businessId);
  });

  handle('analytics:waste', async (event, { businessId, startDate, endDate }) => {
    return AnalyticsService.getWasteAnalytics(businessId, startDate, endDate);
  });

  handle('analytics:cost-analysis', async (event, { businessId, startDate, endDate }) => {
    return AnalyticsService.getCostAnalysis(businessId, startDate, endDate);
  });

  handle('analytics:employee-performance', async (event, { businessId, startDate, endDate }) => {
    return AnalyticsService.getEmployeePerformance(businessId, startDate, endDate);
  });

  handle('analytics:peak-hours', async (event, { businessId, startDate, endDate }) => {
    return AnalyticsService.getPeakHoursAnalysis(businessId, startDate, endDate);
  });

  handle('analytics:customer-insights', async (event, { businessId, startDate, endDate }) => {
    return AnalyticsService.getCustomerInsights(businessId, startDate, endDate);
  });

  handle('analytics:financial-summary', async (event, { businessId, startDate, endDate }) => {
    return AnalyticsService.getFinancialSummary(businessId, startDate, endDate);
  });

  handle('analytics:forecast', async (event, businessId) => {
    const data = AnalyticsService.getForecastData(businessId);
    const forecast = AnalyticsService.calculateForecast(data);
    return { historical: data, forecast };
  });

  // ============================================
  // DASHBOARD IPC HANDLERS
  // ============================================

  handle('dashboard:get-overview', async (event, businessId) => {
    return DashboardService.getDashboardOverview(businessId);
  });

  handle('dashboard:get-sales-trend', async (event, { businessId, period }) => {
    return DashboardService.getSalesTrend(businessId, period);
  });

  handle('dashboard:get-top-performers', async (event, { businessId, period }) => {
    return DashboardService.getTopPerformers(businessId, period);
  });

  handle('dashboard:get-inventory-status', async (event, businessId) => {
    return DashboardService.getInventoryStatus(businessId);
  });

  handle('dashboard:get-financial-summary', async (event, { businessId, period }) => {
    return DashboardService.getFinancialSummary(businessId, period);
  });

  handle('dashboard:get-upcoming-items', async (event, businessId) => {
    return DashboardService.getUpcomingItems(businessId);
  });

  handle('dashboard:get-activity-feed', async (event, { businessId, limit }) => {
    return DashboardService.getActivityFeed(businessId, limit);
  });

  handle('dashboard:get-alerts', async (event, businessId) => {
    return DashboardService.getAlerts(businessId);
  });

  handle('dashboard:get-live-orders', async (event, businessId) => {
    return DashboardService.getLiveOrders(businessId);
  });

  handle('dashboard:get-profit-pulse', async (event, businessId) => {
    return DashboardService.getProfitPulse(businessId);
  });

  handle('dashboard:get-goal-tracking', async (event, businessId) => {
    return DashboardService.getGoalTracking(businessId);
  });

  handle('dashboard:get-complete', async (event, { businessId, userRole }) => {
    return DashboardService.getCompleteDashboard(businessId, userRole);
  });

  console.log('IPC handlers registered');
};

// Cleanup expired sessions every hour
setInterval(() => {
  AuthService.cleanupExpiredSessions();
}, 60 * 60 * 1000);

// Process recurring expenses daily at midnight
setInterval(() => {
  // This would need to iterate through all businesses in a real app
  // For now, we'll trigger it manually or through a dashboard action
  console.log('Daily recurring expense check scheduled');
}, 24 * 60 * 60 * 1000);

module.exports = { setupIPC };
