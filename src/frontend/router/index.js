import { createRouter, createWebHashHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import SetupView from '../views/SetupView.vue';
import DashboardView from '../views/DashboardView.vue';
import MenuView from '../views/MenuView.vue';
import EmployeesView from '../views/EmployeesView.vue';
import EmployeeDetailView from '../views/EmployeeDetailView.vue';
import ScheduleView from '../views/ScheduleView.vue';
import InventoryView from '../views/InventoryView.vue';
import POSView from '../views/POSView.vue';
import CustomersView from '../views/CustomersView.vue';
import ProfileView from '../views/ProfileView.vue';
import ForgotPasswordView from '../views/ForgotPasswordView.vue';
import ReportsView from '../views/ReportsView.vue';
import ExpensesView from '../views/ExpensesView.vue';
import ReservationsView from '../views/ReservationsView.vue';
import KitchenView from '../views/KitchenView.vue';

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
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPasswordView
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
  {
    path: '/employees/:id',
    name: 'EmployeeDetail',
    component: EmployeeDetailView,
    meta: { requiresAuth: true }
  },
  {
    path: '/schedule',
    name: 'Schedule',
    component: ScheduleView,
    meta: { requiresAuth: true }
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: InventoryView,
    meta: { requiresAuth: true }
  },
  {
    path: '/pos',
    name: 'POS',
    component: POSView,
    meta: { requiresAuth: true }
  },
  {
    path: '/kitchen',
    name: 'Kitchen',
    component: KitchenView,
    meta: { requiresAuth: true }
  },
  {
    path: '/customers',
    name: 'Customers',
    component: CustomersView,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: ReportsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/expenses',
    name: 'Expenses',
    component: ExpensesView,
    meta: { requiresAuth: true }
  },
  {
    path: '/reservations',
    name: 'Reservations',
    component: ReservationsView,
    meta: { requiresAuth: true }
  }
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
