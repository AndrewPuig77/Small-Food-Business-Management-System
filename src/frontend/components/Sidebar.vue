<template>
  <aside class="sidebar" :class="{ collapsed: isCollapsed }">
    <button class="toggle-btn" @click="toggleSidebar" title="Toggle sidebar">
      <svg class="toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path v-if="!isCollapsed" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    </button>

    <div class="logo-section">
      <h2 class="logo">FoodBiz</h2>
    </div>
    
    <nav class="nav-menu">
      <router-link to="/dashboard" class="nav-item">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>Dashboard</span>
      </router-link>

      <router-link v-if="canAccess('employees')" to="/employees" class="nav-item">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span>Employees</span>
      </router-link>

      <router-link v-if="canAccess('inventory')" to="/inventory" class="nav-item">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <span>Inventory</span>
      </router-link>

      <router-link to="/menu" class="nav-item">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span>Menu</span>
      </router-link>

      <router-link to="/customers" class="nav-item">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span>Customers</span>
      </router-link>

      <router-link v-if="canAccess('pos')" to="/pos" class="nav-item">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span>POS</span>
      </router-link>

      <router-link to="/kitchen" class="nav-item">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span>Kitchen</span>
      </router-link>

      <router-link to="/reservations" class="nav-item">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>Reservations</span>
      </router-link>

      <router-link v-if="isOwnerOrManager" to="/profile" class="nav-item">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span>Profile</span>
      </router-link>

      <router-link v-if="canAccess('reports')" to="/reports" class="nav-item">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span>Reports</span>
      </router-link>

      <router-link v-if="isOwnerOrManager" to="/expenses" class="nav-item">
        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span>Expenses</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const isCollapsed = ref(false);
const currentUser = ref(null);
const employeeData = ref(null);

const isOwnerOrManager = computed(() => {
  return currentUser.value?.role === 'owner' || currentUser.value?.role === 'manager';
});

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
  localStorage.setItem('sidebarCollapsed', isCollapsed.value);
};

const canAccess = (feature) => {
  // Owner and manager have full access
  if (currentUser.value?.role === 'owner' || currentUser.value?.role === 'manager') {
    return true;
  }
  
  // Staff needs specific permissions
  if (!employeeData.value || !employeeData.value.permissions) {
    return false;
  }
  
  try {
    const permissions = typeof employeeData.value.permissions === 'string' 
      ? JSON.parse(employeeData.value.permissions)
      : employeeData.value.permissions;
    
    const permissionMap = {
      'pos': permissions.canAccessPOS,
      'inventory': permissions.canViewInventory || permissions.canEditInventory,
      'reports': permissions.canViewReports,
      'employees': permissions.canManageEmployees,
      'schedule': permissions.canManageSchedule,
    };
    
    return permissionMap[feature] || false;
  } catch (error) {
    console.error('Error parsing permissions:', error);
    return false;
  }
};

onMounted(async () => {
  const saved = localStorage.getItem('sidebarCollapsed');
  if (saved !== null) {
    isCollapsed.value = saved === 'true';
  }
  
  // Get current user
  const stored = localStorage.getItem('currentUser');
  if (stored) {
    currentUser.value = JSON.parse(stored);
    
    // If staff, load employee data with permissions
    if (currentUser.value.role === 'staff' && currentUser.value.userId) {
      try {
        const { ipcRenderer } = window.require('electron');
        const employees = await ipcRenderer.invoke('employee:get-all', currentUser.value.businessId);
        employeeData.value = employees.find(emp => emp.user_id === currentUser.value.userId);
      } catch (error) {
        console.error('Error loading employee permissions:', error);
      }
    }
  }
});
</script>

<style scoped>
.sidebar {
  width: 250px;
  background: linear-gradient(180deg, #1a1f2e 0%, #0f1419 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0;
  flex-shrink: 0;
  transition: width 0.3s ease, transform 0.3s ease;
  position: relative;
}

.sidebar.collapsed {
  width: 70px;
}

.toggle-btn {
  position: absolute;
  top: 1rem;
  right: -12px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border: 2px solid #1a1f2e;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: transform 0.2s;
  padding: 0;
}

.toggle-btn:hover {
  transform: scale(1.1);
}

.toggle-icon {
  width: 14px;
  height: 14px;
  color: white;
}

.logo-section {
  padding: 0 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: opacity 0.2s;
}

.sidebar.collapsed .logo-section {
  opacity: 0;
  pointer-events: none;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
  white-space: nowrap;
}

.nav-menu {
  flex: 1;
  padding: 1.5rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  color: white;
  text-decoration: none;
  transition: all 0.2s;
  border-left: 3px solid transparent;
  cursor: pointer;
  position: relative;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0.875rem;
}

.sidebar.collapsed .nav-item span {
  position: absolute;
  left: 70px;
  background: #1a1f2e;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  z-index: 100;
}

.sidebar.collapsed .nav-item:hover span {
  opacity: 1;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-left-color: white;
}

.nav-item.router-link-active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-left-color: white;
}

.nav-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}
</style>
