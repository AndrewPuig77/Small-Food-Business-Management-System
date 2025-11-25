import { createRouter, createWebHashHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import SetupView from '../views/SetupView.vue';

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
  // Additional routes will be added here:
  // { path: '/dashboard', name: 'Dashboard', component: DashboardView },
  // { path: '/inventory', name: 'Inventory', component: InventoryView },
  // { path: '/pos', name: 'POS', component: POSView },
  // { path: '/employees', name: 'Employees', component: EmployeeView },
  // { path: '/menu', name: 'Menu', component: MenuView },
  // { path: '/reports', name: 'Reports', component: ReportsView },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

// Check if setup is complete on navigation
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
    }
    // If setup complete and trying to go to setup, redirect to login
    else if (isSetupComplete && to.name === 'Setup') {
      next({ name: 'Login' });
    }
    else {
      next();
    }
  } catch (error) {
    console.error('Navigation guard error:', error);
    next();
  }
});

export default router;
