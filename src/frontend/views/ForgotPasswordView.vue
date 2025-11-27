<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
    <div class="card max-w-md w-full">
      <!-- Back to Login -->
      <button @click="goBack" class="text-gray-400 hover:text-gray-300 mb-6 flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Login
      </button>

      <!-- Logo and Title -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-100 mb-2">Reset Password</h1>
        <p class="text-gray-400">Verify your identity to reset your password</p>
      </div>

      <!-- Step 1: Verify Identity -->
      <div v-if="step === 1">
        <div class="space-y-4">
          <div>
            <label class="block text-gray-300 font-semibold mb-2">Username</label>
            <input
              v-model.trim="username"
              type="text"
              class="input-field"
              placeholder="Enter your username"
              autocomplete="username"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              required
            />
          </div>

          <div>
            <label class="block text-gray-300 font-semibold mb-2">Email Address</label>
            <p class="text-gray-500 text-sm mb-2">Enter the email associated with your account</p>
            <input
              v-model.trim="email"
              type="email"
              class="input-field"
              placeholder="your@email.com"
              autocomplete="email"
              required
            />
          </div>

          <div v-if="errorMessage" class="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-sm">
            {{ errorMessage }}
          </div>

          <button @click="verifyIdentity" class="btn-primary w-full" :disabled="loading">
            <span v-if="loading">Verifying...</span>
            <span v-else>Verify Identity</span>
          </button>
        </div>
      </div>

      <!-- Step 2: Reset Password -->
      <div v-if="step === 2">
        <div class="mb-4 p-3 bg-green-900/50 border border-green-700 text-green-300 rounded-lg text-sm">
          Identity verified! Now set your new password.
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-gray-300 font-semibold mb-2">New Password</label>
            <input
              v-model.trim="newPassword"
              type="password"
              class="input-field"
              placeholder="Minimum 8 characters"
              autocomplete="new-password"
              required
            />
          </div>

          <div>
            <label class="block text-gray-300 font-semibold mb-2">Confirm New Password</label>
            <input
              v-model.trim="confirmPassword"
              type="password"
              class="input-field"
              placeholder="Re-enter password"
              autocomplete="new-password"
              required
            />
          </div>

          <div v-if="errorMessage" class="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-sm">
            {{ errorMessage }}
          </div>

          <button @click="resetPassword" class="btn-primary w-full" :disabled="loading">
            <span v-if="loading">Resetting...</span>
            <span v-else>Reset Password</span>
          </button>
        </div>
      </div>

      <!-- Step 3: Success -->
      <div v-if="step === 3">
        <div class="text-center">
          <div class="mb-6">
            <svg class="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-100 mb-3">Password Reset Successfully!</h2>
          <p class="text-gray-400 mb-6">You can now login with your new password.</p>
          <button @click="goToLogin" class="btn-primary w-full">
            Go to Login
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { ipcRenderer } = window.require('electron');

const step = ref(1);
const username = ref('');
const email = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const errorMessage = ref('');
const verifiedUserId = ref(null);
const verifiedBusinessId = ref(null);

const goBack = () => {
  router.push('/');
};

const goToLogin = () => {
  router.push('/');
};

const verifyIdentity = async () => {
  errorMessage.value = '';
  
  if (!username.value || !email.value) {
    errorMessage.value = 'Please enter both username and email';
    return;
  }

  loading.value = true;

  try {
    const result = await ipcRenderer.invoke('auth:verify-identity', {
      username: username.value,
      email: email.value
    });

    if (result.success) {
      verifiedUserId.value = result.userId;
      verifiedBusinessId.value = result.businessId;
      step.value = 2;
    } else {
      errorMessage.value = result.error || 'Username and email do not match';
    }
  } catch (error) {
    console.error('Verify identity error:', error);
    errorMessage.value = 'An error occurred during verification';
  } finally {
    loading.value = false;
  }
};

const resetPassword = async () => {
  errorMessage.value = '';

  if (!newPassword.value || !confirmPassword.value) {
    errorMessage.value = 'Please fill in all fields';
    return;
  }

  if (newPassword.value.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters';
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match';
    return;
  }

  loading.value = true;

  try {
    const result = await ipcRenderer.invoke('auth:reset-password', {
      userId: verifiedUserId.value,
      businessId: verifiedBusinessId.value,
      newPassword: newPassword.value
    });

    if (result.success) {
      step.value = 3;
    } else {
      errorMessage.value = result.error || 'Failed to reset password';
    }
  } catch (error) {
    console.error('Reset password error:', error);
    errorMessage.value = 'An error occurred while resetting password';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.card {
  background: rgba(31, 41, 55, 0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(75, 85, 99, 0.3);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

.input-field {
  width: 100%;
  padding: 0.75rem;
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(75, 85, 99, 0.5);
  border-radius: 0.5rem;
  color: #f3f4f6;
  font-size: 1rem;
  transition: all 0.2s;
}

.input-field:focus {
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

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
