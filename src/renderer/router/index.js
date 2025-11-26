import { createRouter, createWebHashHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import SetupView from '../views/SetupView.vue';
import DashboardView from '../views/DashboardView.vue';
import MenuView from '../views/MenuView.vue';
import EmployeesView from '../views/EmployeesView.vue';

const routes = [
  {
    path: '/setup',
    name: 'Setup',
    component: SetupView
  },
  {
    path: '/',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/menu',
    name: 'Menu',
    component: MenuView,
    meta: { requiresAuth: true }
  },
  {
    path: '/employees',
    name: 'Employees',
    component: EmployeesView,
    meta: { requiresAuth: true }
  },
  // Additional routes will be added here:
  // { path: '/inventory', name: 'Inventory', component: InventoryView },
  // { path: '/pos', name: 'POS', component: POSView },
  // { path: '/reports', name: 'Reports', component: ReportsView },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

// Navigation guards for setup and authentication
router.beforeEach(async (to, from, next) => {
  try {
    const { ipcRenderer } = window.require('electron');
    
    // Check database for setup completion
    const isSetupComplete = await ipcRenderer.invoke('check-setup');
    
    // Sync with localStorage
    if (isSetupComplete) {
      localStorage.setItem('setupComplete', 'true');
    } else {
      localStorage.removeItem('setupComplete');
    }
    
    // If setup not complete and not going to setup page, redirect to setup
    if (!isSetupComplete && to.name !== 'Setup') {
      next({ name: 'Setup' });
      return;
    }
    
    // If setup complete and trying to go to setup, redirect to login
    if (isSetupComplete && to.name === 'Setup') {
      next({ name: 'Login' });
      return;
    }
    
    // Check authentication for protected routes
    if (to.meta.requiresAuth) {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        // Not logged in, redirect to login
        next({ name: 'Login' });
        return;
      }
      
      // Verify token is still valid
      const result = await ipcRenderer.invoke('verify-token', token);
      if (!result.valid) {
        // Token invalid, clear and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        next({ name: 'Login' });
        return;
      }
    }
    
    next();
  } catch (error) {
    console.error('Navigation guard error:', error);
    next();
  }
});

export default router;
