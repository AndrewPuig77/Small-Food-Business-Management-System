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
router.beforeEach((to, from, next) => {
  const setupComplete = localStorage.getItem('setupComplete');
  
  // If setup not complete and not going to setup page, redirect to setup
  if (!setupComplete && to.name !== 'Setup') {
    next({ name: 'Setup' });
  }
  // If setup complete and trying to go to setup, redirect to login
  else if (setupComplete && to.name === 'Setup') {
    next({ name: 'Login' });
  }
  else {
    next();
  }
});

export default router;
