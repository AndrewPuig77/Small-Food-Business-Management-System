const { ipcMain } = require('electron');
const { isSetupComplete, init } = require('./database/database');
const AuthService = require('./services/authService');
const MenuService = require('./services/menuService');
const EmployeeService = require('./services/employeeService');
const ScheduleService = require('./services/scheduleService');
const InventoryService = require('./services/inventoryService');
const POSService = require('./services/posService');
const ExpenseService = require('./services/expenseService');
const TimeLogService = require('./services/timeLogService');

// Setup IPC handlers for communication between main and renderer processes
const setupIPC = async () => {
  // Initialize database
  await init();
  
  // Check if setup is complete
  ipcMain.handle('check-setup', async () => {
    return isSetupComplete();
  });

  // Complete setup
  ipcMain.handle('complete-setup', async (event, setupData) => {
    return AuthService.completeSetup(setupData);
  });

  // Login
  ipcMain.handle('login', async (event, { username, password }) => {
    return AuthService.login(username, password);
  });

  // Verify token
  ipcMain.handle('verify-token', async (event, token) => {
    return AuthService.verifyToken(token);
  });

  // Logout
  ipcMain.handle('logout', async (event, token) => {
    return AuthService.logout(token);
  });

  // Menu Items
  ipcMain.handle('menu:get-all-items', async (event, businessId) => {
    return MenuService.getAllItems(businessId);
  });

  ipcMain.handle('menu:get-item', async (event, itemId) => {
    return MenuService.getItemById(itemId);
  });

  ipcMain.handle('menu:create-item', async (event, { businessId, itemData }) => {
    return MenuService.createItem(businessId, itemData);
  });

  ipcMain.handle('menu:update-item', async (event, { itemId, itemData }) => {
    return MenuService.updateItem(itemId, itemData);
  });

  ipcMain.handle('menu:delete-item', async (event, itemId) => {
    return MenuService.deleteItem(itemId);
  });

  // Menu Categories
  ipcMain.handle('menu:get-categories', async (event, businessId) => {
    return MenuService.getCategories(businessId);
  });

  ipcMain.handle('menu:create-category', async (event, { businessId, categoryData }) => {
    return MenuService.createCategory(businessId, categoryData);
  });

  ipcMain.handle('menu:update-category', async (event, { categoryId, categoryData }) => {
    return MenuService.updateCategory(categoryId, categoryData);
  });

  ipcMain.handle('menu:delete-category', async (event, categoryId) => {
    return MenuService.deleteCategory(categoryId);
  });

  // Employees
  ipcMain.handle('employee:get-all', async (event, businessId) => {
    return EmployeeService.getAllEmployees(businessId);
  });

  ipcMain.handle('employee:get-by-id', async (event, { businessId, employeeId }) => {
    return EmployeeService.getEmployeeById(businessId, employeeId);
  });

  ipcMain.handle('employee:create', async (event, { businessId, employeeData }) => {
    return EmployeeService.createEmployee(businessId, employeeData);
  });

  ipcMain.handle('employee:update', async (event, { businessId, employeeId, employeeData }) => {
    return EmployeeService.updateEmployee(businessId, employeeId, employeeData);
  });

  ipcMain.handle('employee:delete', async (event, { businessId, employeeId }) => {
    return EmployeeService.deleteEmployee(businessId, employeeId);
  });

  ipcMain.handle('employee:update-status', async (event, { businessId, employeeId, status }) => {
    return EmployeeService.updateEmployeeStatus(businessId, employeeId, status);
  });

  // Employee Schedules
  ipcMain.handle('employee:get-schedules', async (event, employeeId) => {
    return EmployeeService.getEmployeeSchedules(employeeId);
  });

  ipcMain.handle('employee:save-schedule', async (event, { employeeId, scheduleData }) => {
    return EmployeeService.saveEmployeeSchedule(employeeId, scheduleData);
  });

  // Employee Notes
  ipcMain.handle('employee:get-notes', async (event, employeeId) => {
    return EmployeeService.getEmployeeNotes(employeeId);
  });

  ipcMain.handle('employee:add-note', async (event, { employeeId, noteData }) => {
    return EmployeeService.addEmployeeNote(employeeId, noteData);
  });

  // Emergency Contacts
  ipcMain.handle('employee:get-emergency-contacts', async (event, employeeId) => {
    return EmployeeService.getEmergencyContacts(employeeId);
  });

  ipcMain.handle('employee:save-emergency-contact', async (event, { employeeId, contactData }) => {
    return EmployeeService.saveEmergencyContact(employeeId, contactData);
  });

  ipcMain.handle('employee:delete-emergency-contact', async (event, contactId) => {
    return EmployeeService.deleteEmergencyContact(contactId);
  });

  // Employee Documents
  ipcMain.handle('employee:get-documents', async (event, employeeId) => {
    return EmployeeService.getEmployeeDocuments(employeeId);
  });

  ipcMain.handle('employee:get-document', async (event, documentId) => {
    return EmployeeService.getEmployeeDocument(documentId);
  });

  ipcMain.handle('employee:upload-document', async (event, { employeeId, documentData }) => {
    return EmployeeService.uploadEmployeeDocument(employeeId, documentData);
  });

  ipcMain.handle('employee:delete-document', async (event, documentId) => {
    return EmployeeService.deleteEmployeeDocument(documentId);
  });

  // Create user account for an existing employee
  ipcMain.handle('employee:create-account', async (event, { businessId, employeeId, accountData }) => {
    return EmployeeService.createUserAccountForEmployee(businessId, employeeId, accountData);
  });

  // Time Logs
  ipcMain.handle('employee:get-time-logs', async (event, { employeeId, startDate, endDate }) => {
    return EmployeeService.getTimeLogs(employeeId, startDate, endDate);
  });

  ipcMain.handle('employee:clock-in', async (event, employeeId) => {
    return EmployeeService.clockIn(employeeId);
  });

  ipcMain.handle('employee:clock-out', async (event, employeeId) => {
    return EmployeeService.clockOut(employeeId);
  });

  ipcMain.handle('employee:calculate-payroll', async (event, { employeeId, startDate, endDate }) => {
    return EmployeeService.calculatePayroll(employeeId, startDate, endDate);
  });

  // Schedule/Shifts
  ipcMain.handle('schedule:get-shifts', async (event, { businessId, startDate, endDate }) => {
    return ScheduleService.getShifts(businessId, startDate, endDate);
  });

  ipcMain.handle('schedule:create-shift', async (event, { businessId, shiftData }) => {
    return ScheduleService.createShift(businessId, shiftData);
  });

  ipcMain.handle('schedule:update-shift', async (event, { businessId, shiftId, shiftData }) => {
    return ScheduleService.updateShift(businessId, shiftId, shiftData);
  });

  ipcMain.handle('schedule:delete-shift', async (event, { businessId, shiftId }) => {
    return ScheduleService.deleteShift(businessId, shiftId);
  });

  // Inventory Items
  ipcMain.handle('inventory:get-all-items', async (event, businessId) => {
    return InventoryService.getAllItems(businessId);
  });

  ipcMain.handle('inventory:get-item', async (event, { businessId, itemId }) => {
    return InventoryService.getItemById(businessId, itemId);
  });

  ipcMain.handle('inventory:create-item', async (event, { businessId, itemData }) => {
    return InventoryService.createItem(businessId, itemData);
  });

  ipcMain.handle('inventory:create-items-batch', async (event, { businessId, itemsArray }) => {
    return InventoryService.createItemsBatch(businessId, itemsArray);
  });

  ipcMain.handle('inventory:update-item', async (event, { businessId, itemId, itemData }) => {
    return InventoryService.updateItem(businessId, itemId, itemData);
  });

  ipcMain.handle('inventory:delete-item', async (event, { businessId, itemId }) => {
    return InventoryService.deleteItem(businessId, itemId);
  });

  ipcMain.handle('inventory:adjust-stock', async (event, { businessId, itemId, adjustment, userId, notes, transactionType, vendor }) => {
    return InventoryService.adjustStock(businessId, itemId, adjustment, userId, notes, transactionType, vendor);
  });

  ipcMain.handle('inventory:get-low-stock', async (event, businessId) => {
    return InventoryService.getLowStockItems(businessId);
  });

  // Inventory Categories
  ipcMain.handle('inventory:get-categories', async (event, businessId) => {
    return InventoryService.getAllCategories(businessId);
  });

  ipcMain.handle('inventory:create-category', async (event, { businessId, categoryData }) => {
    return InventoryService.createCategory(businessId, categoryData);
  });

  ipcMain.handle('inventory:update-category', async (event, { businessId, categoryId, categoryData }) => {
    return InventoryService.updateCategory(businessId, categoryId, categoryData);
  });

  ipcMain.handle('inventory:delete-category', async (event, { businessId, categoryId }) => {
    return InventoryService.deleteCategory(businessId, categoryId);
  });

  // Suppliers
  ipcMain.handle('inventory:get-suppliers', async (event, businessId) => {
    return InventoryService.getAllSuppliers(businessId);
  });

  ipcMain.handle('inventory:create-supplier', async (event, { businessId, supplierData }) => {
    return InventoryService.createSupplier(businessId, supplierData);
  });

  ipcMain.handle('inventory:update-supplier', async (event, { businessId, supplierId, supplierData }) => {
    return InventoryService.updateSupplier(businessId, supplierId, supplierData);
  });

  ipcMain.handle('inventory:delete-supplier', async (event, { businessId, supplierId }) => {
    return InventoryService.deleteSupplier(businessId, supplierId);
  });

  // Inventory Transactions
  ipcMain.handle('inventory:get-item-transactions', async (event, { businessId, itemId, limit }) => {
    return InventoryService.getItemTransactions(businessId, itemId, limit);
  });

  ipcMain.handle('inventory:get-all-transactions', async (event, { businessId, limit }) => {
    return InventoryService.getAllTransactions(businessId, limit);
  });

  // POS - Customers
  ipcMain.handle('pos:search-customers', async (event, { businessId, searchTerm }) => {
    return POSService.searchCustomers(businessId, searchTerm);
  });

  ipcMain.handle('pos:get-customer', async (event, { businessId, customerId }) => {
    return POSService.getCustomerById(businessId, customerId);
  });

  ipcMain.handle('pos:create-customer', async (event, { businessId, customerData }) => {
    return POSService.createCustomer(businessId, customerData);
  });

  // POS - Transactions
  ipcMain.handle('pos:create-transaction', async (event, { businessId, transactionData }) => {
    return POSService.createTransaction(businessId, transactionData);
  });

  ipcMain.handle('pos:get-transaction', async (event, { businessId, transactionId }) => {
    return POSService.getTransactionById(businessId, transactionId);
  });

  ipcMain.handle('pos:get-recent-transactions', async (event, { businessId, limit }) => {
    return POSService.getRecentTransactions(businessId, limit);
  });

  ipcMain.handle('pos:get-transactions-by-date', async (event, { businessId, startDate, endDate }) => {
    return POSService.getTransactionsByDateRange(businessId, startDate, endDate);
  });

  ipcMain.handle('pos:get-daily-summary', async (event, { businessId, date }) => {
    return POSService.getDailySalesSummary(businessId, date);
  });

  ipcMain.handle('pos:get-payment-methods', async (event, { businessId, startDate, endDate }) => {
    return POSService.getPaymentMethodsByDateRange(businessId, startDate, endDate);
  });

  ipcMain.handle('pos:void-transaction', async (event, { businessId, transactionId, voidReason, voidedBy }) => {
    return POSService.voidTransaction(businessId, transactionId, voidReason, voidedBy);
  });

  ipcMain.handle('pos:validate-manager-pin', async (event, { businessId, userId, pin }) => {
    return POSService.validateManagerPin(businessId, userId, pin);
  });

  // User - Change PIN
  ipcMain.handle('user:change-pin', async (event, { businessId, userId, currentPin, newPin }) => {
    return AuthService.changePin(businessId, userId, currentPin, newPin);
  });

  // User - Reset PIN
  ipcMain.handle('user:reset-pin', async (event, { businessId, userId, password, newPin }) => {
    return AuthService.resetPin(businessId, userId, password, newPin);
  });

  // Auth - Verify identity for password reset
  ipcMain.handle('auth:verify-identity', async (event, { username, email }) => {
    return AuthService.verifyIdentity(username, email);
  });

  // Auth - Reset password
  ipcMain.handle('auth:reset-password', async (event, { userId, businessId, newPassword }) => {
    return AuthService.resetPassword(userId, businessId, newPassword);
  });

  // POS - Update customer
  ipcMain.handle('pos:update-customer', async (event, { businessId, customerId, customerData }) => {
    return POSService.updateCustomer(businessId, customerId, customerData);
  });

  // POS - Update customer points
  ipcMain.handle('pos:update-customer-points', async (event, { businessId, customerId, pointsChange, totalSpent }) => {
    return POSService.updateCustomerPoints(businessId, customerId, pointsChange, totalSpent);
  });

  // POS - Delete customer
  ipcMain.handle('pos:delete-customer', async (event, { businessId, customerId }) => {
    return POSService.deleteCustomer(businessId, customerId);
  });

  // ==================== EXPENSES ====================
  
  // Get all expenses
  ipcMain.handle('expense:get-all', async (event, businessId) => {
    return ExpenseService.getAllExpenses(businessId);
  });

  // Get expenses by date range
  ipcMain.handle('expense:get-by-date', async (event, { businessId, startDate, endDate }) => {
    return ExpenseService.getExpensesByDateRange(businessId, startDate, endDate);
  });

  // Get expenses by category
  ipcMain.handle('expense:get-by-category', async (event, { businessId, startDate, endDate }) => {
    return ExpenseService.getExpensesByCategory(businessId, startDate, endDate);
  });

  // Create expense
  ipcMain.handle('expense:create', async (event, { businessId, expenseData }) => {
    return ExpenseService.createExpense(businessId, expenseData);
  });

  // Update expense
  ipcMain.handle('expense:update', async (event, { expenseId, expenseData }) => {
    return ExpenseService.updateExpense(expenseId, expenseData);
  });

  // Delete expense
  ipcMain.handle('expense:delete', async (event, expenseId) => {
    return ExpenseService.deleteExpense(expenseId);
  });

  // Get total expenses
  ipcMain.handle('expense:get-total', async (event, { businessId, startDate, endDate }) => {
    return ExpenseService.getTotalExpenses(businessId, startDate, endDate);
  });

  // Recurring expenses
  ipcMain.handle('expense:create-recurring', async (event, { businessId, recurringData }) => {
    return ExpenseService.createRecurringExpense(businessId, recurringData);
  });

  ipcMain.handle('expense:get-recurring', async (event, businessId) => {
    return ExpenseService.getRecurringExpenses(businessId);
  });

  ipcMain.handle('expense:process-recurring', async (event, businessId) => {
    return ExpenseService.processRecurringExpenses(businessId);
  });

  ipcMain.handle('expense:update-recurring', async (event, { recurringId, data }) => {
    return ExpenseService.updateRecurringExpense(recurringId, data);
  });

  ipcMain.handle('expense:delete-recurring', async (event, recurringId) => {
    return ExpenseService.deleteRecurringExpense(recurringId);
  });

  // ==================== TIME LOGS / CLOCK IN-OUT ====================
  
  // Clock in
  ipcMain.handle('timelog:clock-in', async (event, { employeeId, notes }) => {
    return TimeLogService.clockIn(employeeId, notes);
  });

  // Clock out
  ipcMain.handle('timelog:clock-out', async (event, { employeeId, notes }) => {
    return TimeLogService.clockOut(employeeId, notes);
  });

  // Get time logs
  ipcMain.handle('timelog:get-all', async (event, { businessId, startDate, endDate }) => {
    return TimeLogService.getTimeLogs(businessId, startDate, endDate);
  });

  // Get employee time logs
  ipcMain.handle('timelog:get-employee', async (event, { employeeId, startDate, endDate }) => {
    return TimeLogService.getEmployeeTimeLogs(employeeId, startDate, endDate);
  });

  // Check if employee is clocked in
  ipcMain.handle('timelog:is-clocked-in', async (event, employeeId) => {
    return TimeLogService.isEmployeeClockedIn(employeeId);
  });

  // Get currently clocked in employees
  ipcMain.handle('timelog:get-clocked-in', async (event, businessId) => {
    return TimeLogService.getClockedInEmployees(businessId);
  });

  // Update time log
  ipcMain.handle('timelog:update', async (event, { logId, updates }) => {
    return TimeLogService.updateTimeLog(logId, updates);
  });

  // Delete time log
  ipcMain.handle('timelog:delete', async (event, logId) => {
    return TimeLogService.deleteTimeLog(logId);
  });

  // Get payroll data
  ipcMain.handle('timelog:get-payroll', async (event, { businessId, startDate, endDate }) => {
    return TimeLogService.getPayrollData(businessId, startDate, endDate);
  });

  // Get payroll summary
  ipcMain.handle('timelog:get-payroll-summary', async (event, { businessId, startDate, endDate }) => {
    return TimeLogService.getPayrollSummary(businessId, startDate, endDate);
  });

  // Debug: Get all time logs (no filters)
  ipcMain.handle('timelog:debug-all', async (event) => {
    const { getDb } = require('./database/database');
    const db = getDb();
    const result = db.exec('SELECT * FROM time_logs');
    console.log('DEBUG: All time logs:', result);
    return result;
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
