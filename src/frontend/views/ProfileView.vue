<template>
  <div class="app-container">
    <Sidebar />
    
    <div class="main-content">
      <div class="content-header">
        <h1 class="page-title">Profile & Settings</h1>
      </div>

      <div class="content-body">
        <!-- User Info Card -->
        <div class="card mb-6">
          <h2 class="text-xl font-semibold text-gray-100 mb-4">User Information</h2>
          <div class="space-y-3">
            <div>
              <label class="text-gray-400 text-sm">Full Name</label>
              <p class="text-gray-200">{{ currentUser?.fullName }}</p>
            </div>
            <div>
              <label class="text-gray-400 text-sm">Username</label>
              <p class="text-gray-200">{{ currentUser?.username }}</p>
            </div>
            <div>
              <label class="text-gray-400 text-sm">Email</label>
              <p class="text-gray-200">{{ currentUser?.email || 'Not set' }}</p>
            </div>
            <div>
              <label class="text-gray-400 text-sm">Role</label>
              <p class="text-gray-200 capitalize">{{ currentUser?.role }}</p>
            </div>
          </div>
        </div>

        

        <!-- System Settings Card -->
        <div class="card mb-6">
          <h2 class="text-xl font-semibold text-gray-100 mb-4">System Settings</h2>
          
          <div class="space-y-4 max-w-md">
            <div>
              <label class="block text-gray-300 font-semibold mb-2">Sales Tax Rate (%)</label>
              <input
                v-model.number="taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                class="form-input"
                placeholder="e.g., 7.5"
                @change="saveTaxRate"
              />
              <p class="text-gray-400 text-xs mt-1">Applied to all POS transactions</p>
            </div>

            <div v-if="taxRateSuccess" class="p-3 bg-green-900/50 border border-green-700 text-green-300 rounded-lg text-sm">
              {{ taxRateSuccess }}
            </div>
          </div>
        </div>

        <!-- Owner Code Card (Owner Only) -->
        <div v-if="currentUser?.role === 'owner'" class="card mb-6">
          <h2 class="text-xl font-semibold text-gray-100 mb-4">Owner Security Code</h2>
          <p class="text-gray-400 text-sm mb-4">
            This code is required for employees to perform sensitive operations like deleting customers or menu items.
          </p>

          <div class="space-y-4 max-w-md">
            <div>
              <label class="block text-gray-300 font-semibold mb-2">Owner Code (4 digits)</label>
              <input
                v-model="ownerCodeForm.code"
                type="password"
                maxlength="4"
                class="form-input"
                placeholder="Enter 4-digit code"
              />
            </div>

            <div v-if="ownerCodeError" class="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-sm">
              {{ ownerCodeError }}
            </div>

            <div v-if="ownerCodeSuccess" class="p-3 bg-green-900/50 border border-green-700 text-green-300 rounded-lg text-sm">
              {{ ownerCodeSuccess }}
            </div>

            <button @click="saveOwnerCode" class="btn-primary">
              Update Owner Code
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Sidebar from '../components/Sidebar.vue';

const { ipcRenderer } = window.require('electron');

const currentUser = ref(null);

const ownerCodeForm = ref({
  code: ''
});
const ownerCodeError = ref('');
const ownerCodeSuccess = ref('');

const pinForm = ref({
  currentPin: '',
  newPin: '',
  confirmPin: ''
});

const resetForm = ref({
  password: '',
  newPin: '',
  confirmPin: ''
});

const pinError = ref('');
const pinSuccess = ref('');
const resetError = ref('');
const resetSuccess = ref('');
const taxRate = ref(7.5);
const taxRateSuccess = ref('');

onMounted(() => {
  const user = localStorage.getItem('currentUser');
  if (user) {
    currentUser.value = JSON.parse(user);
    
    // Load tax rate from localStorage
    const savedTaxRate = localStorage.getItem(`taxRate_${currentUser.value.businessId}`);
    if (savedTaxRate) {
      taxRate.value = parseFloat(savedTaxRate);
    }
  }
});

const saveTaxRate = () => {
  if (currentUser.value) {
    localStorage.setItem(`taxRate_${currentUser.value.businessId}`, taxRate.value.toString());
    taxRateSuccess.value = 'Tax rate saved successfully!';
    setTimeout(() => {
      taxRateSuccess.value = '';
    }, 3000);
  }
};

const saveOwnerCode = async () => {
  ownerCodeError.value = '';
  ownerCodeSuccess.value = '';

  if (!ownerCodeForm.value.code) {
    ownerCodeError.value = 'Please enter an owner code';
    return;
  }

  if (ownerCodeForm.value.code.length !== 4 || !/^\d{4}$/.test(ownerCodeForm.value.code)) {
    ownerCodeError.value = 'Owner code must be 4 digits';
    return;
  }

  try {
    const result = await ipcRenderer.invoke('business:update-owner-code', {
      businessId: currentUser.value.businessId,
      ownerCode: ownerCodeForm.value.code
    });

    if (result.success) {
      ownerCodeSuccess.value = 'Owner code updated successfully!';
      ownerCodeForm.value.code = '';
      setTimeout(() => {
        ownerCodeSuccess.value = '';
      }, 3000);
    } else {
      ownerCodeError.value = result.error || 'Failed to update owner code';
    }
  } catch (error) {
    console.error('Error updating owner code:', error);
    ownerCodeError.value = 'Error updating owner code';
  }
};

const changePin = async () => {
  pinError.value = '';
  pinSuccess.value = '';

  // Validation
  if (!pinForm.value.currentPin || !pinForm.value.newPin || !pinForm.value.confirmPin) {
    pinError.value = 'All fields are required';
    return;
  }

  if (!/^\d{4}$/.test(pinForm.value.newPin)) {
    pinError.value = 'New PIN must be exactly 4 digits';
    return;
  }

  if (pinForm.value.newPin !== pinForm.value.confirmPin) {
    pinError.value = 'New PIN and confirmation do not match';
    return;
  }

  if (pinForm.value.currentPin === pinForm.value.newPin) {
    pinError.value = 'New PIN must be different from current PIN';
    return;
  }

  try {
    const result = await ipcRenderer.invoke('user:change-pin', {
      businessId: currentUser.value.businessId,
      userId: currentUser.value.id,
      currentPin: pinForm.value.currentPin,
      newPin: pinForm.value.newPin
    });

    if (result.success) {
      pinSuccess.value = 'PIN changed successfully!';
      pinForm.value = { currentPin: '', newPin: '', confirmPin: '' };
    } else {
      pinError.value = result.error || 'Failed to change PIN';
    }
  } catch (error) {
    console.error('Error changing PIN:', error);
    pinError.value = 'An error occurred while changing PIN';
  }
};

const resetPin = async () => {
  resetError.value = '';
  resetSuccess.value = '';

  // Validation
  if (!resetForm.value.password || !resetForm.value.newPin || !resetForm.value.confirmPin) {
    resetError.value = 'All fields are required';
    return;
  }

  if (!/^\d{4}$/.test(resetForm.value.newPin)) {
    resetError.value = 'New PIN must be exactly 4 digits';
    return;
  }

  if (resetForm.value.newPin !== resetForm.value.confirmPin) {
    resetError.value = 'New PIN and confirmation do not match';
    return;
  }

  try {
    const result = await ipcRenderer.invoke('user:reset-pin', {
      businessId: currentUser.value.businessId,
      userId: currentUser.value.id,
      password: resetForm.value.password,
      newPin: resetForm.value.newPin
    });

    if (result.success) {
      resetSuccess.value = 'PIN reset successfully!';
      resetForm.value = { password: '', newPin: '', confirmPin: '' };
    } else {
      resetError.value = result.error || 'Failed to reset PIN';
    }
  } catch (error) {
    console.error('Error resetting PIN:', error);
    resetError.value = 'An error occurred while resetting PIN';
  }
};
</script>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(to bottom right, #111827, #1f2937, #000000);
}

.main-content {
  flex: 1;
  margin-left: 250px;
  padding: 2rem;
  overflow-y: auto;
  max-height: 100vh;
}

.content-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: bold;
  background: linear-gradient(to right, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.content-body {
  max-width: 1200px;
  padding-bottom: 2rem;
}

.card {
  background: rgba(31, 41, 55, 0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(75, 85, 99, 0.3);
  border-radius: 1rem;
  padding: 1.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(75, 85, 99, 0.5);
  border-radius: 0.5rem;
  color: #f3f4f6;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(to right, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: rgba(75, 85, 99, 0.5);
  color: white;
  border: 1px solid rgba(156, 163, 175, 0.3);
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(75, 85, 99, 0.8);
  transform: translateY(-2px);
}

.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
</style>
