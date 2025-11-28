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

        

        <!-- Change PIN Card -->
        <div class="card mb-6">
          <h2 class="text-xl font-semibold text-gray-100 mb-4">Manager PIN</h2>
          <p class="text-gray-400 text-sm mb-4">
            Your 4-digit PIN is required to authorize sensitive operations like voids and large discounts.
          </p>

          <div class="space-y-4 max-w-md">
            <div>
              <label class="block text-gray-300 font-semibold mb-2">Current PIN</label>
              <input
                v-model="pinForm.currentPin"
                type="password"
                maxlength="4"
                class="form-input"
                placeholder="****"
              />
            </div>

            <div>
              <label class="block text-gray-300 font-semibold mb-2">New PIN</label>
              <input
                v-model="pinForm.newPin"
                type="password"
                maxlength="4"
                class="form-input"
                placeholder="****"
              />
            </div>

            <div>
              <label class="block text-gray-300 font-semibold mb-2">Confirm New PIN</label>
              <input
                v-model="pinForm.confirmPin"
                type="password"
                maxlength="4"
                class="form-input"
                placeholder="****"
              />
            </div>

            <div v-if="pinError" class="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-sm">
              {{ pinError }}
            </div>

            <div v-if="pinSuccess" class="p-3 bg-green-900/50 border border-green-700 text-green-300 rounded-lg text-sm">
              {{ pinSuccess }}
            </div>

            <button @click="changePin" class="btn-primary">
              Change PIN
            </button>
          </div>
        </div>

        <!-- Forgot PIN Card -->
        <div class="card">
          <h2 class="text-xl font-semibold text-gray-100 mb-4">Forgot Your PIN?</h2>
          <p class="text-gray-400 text-sm mb-4">
            If you've forgotten your PIN, you can reset it by verifying your password.
          </p>

          <div class="space-y-4 max-w-md">
            <div>
              <label class="block text-gray-300 font-semibold mb-2">Verify Password</label>
              <input
                v-model="resetForm.password"
                type="password"
                class="form-input"
                placeholder="Enter your account password"
              />
            </div>

            <div>
              <label class="block text-gray-300 font-semibold mb-2">New PIN</label>
              <input
                v-model="resetForm.newPin"
                type="password"
                maxlength="4"
                class="form-input"
                placeholder="****"
              />
            </div>

            <div>
              <label class="block text-gray-300 font-semibold mb-2">Confirm New PIN</label>
              <input
                v-model="resetForm.confirmPin"
                type="password"
                maxlength="4"
                class="form-input"
                placeholder="****"
              />
            </div>

            <div v-if="resetError" class="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-sm">
              {{ resetError }}
            </div>

            <div v-if="resetSuccess" class="p-3 bg-green-900/50 border border-green-700 text-green-300 rounded-lg text-sm">
              {{ resetSuccess }}
            </div>

            <button @click="resetPin" class="btn-secondary">
              Reset PIN
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

onMounted(() => {
  const user = localStorage.getItem('currentUser');
  if (user) {
    currentUser.value = JSON.parse(user);
  }
});


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
