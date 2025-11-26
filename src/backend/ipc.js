const { ipcMain } = require('electron');
const { isSetupComplete, init } = require('./database/database');
const AuthService = require('./services/authService');
const MenuService = require('./services/menuService');
const EmployeeService = require('./services/employeeService');
const ScheduleService = require('./services/scheduleService');

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

  console.log('IPC handlers registered');
};

// Cleanup expired sessions every hour
setInterval(() => {
  AuthService.cleanupExpiredSessions();
}, 60 * 60 * 1000);

module.exports = { setupIPC };
