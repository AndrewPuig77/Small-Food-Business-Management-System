const { ipcMain } = require('electron');
const { isSetupComplete, init } = require('./models/database');
const AuthService = require('./services/authService');
const MenuService = require('./services/menuService');
const EmployeeService = require('./services/employeeService');

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

  console.log('IPC handlers registered');
};

// Cleanup expired sessions every hour
setInterval(() => {
  AuthService.cleanupExpiredSessions();
}, 60 * 60 * 1000);

module.exports = { setupIPC };
