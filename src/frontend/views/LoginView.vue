<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
    <div class="card max-w-md w-full">
      <!-- Logo and Title -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-100 mb-2">Food Business Manager</h1>
        <p class="text-gray-400">Sign in to your account</p>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        {{ errorMessage }}
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" autocomplete="on">
        <div class="mb-4">
          <label for="username" class="block text-gray-300 font-semibold mb-2">Username</label>
          <input
            id="username"
            v-model.trim="username"
            type="text"
            class="input-field"
            placeholder="Enter your username"
            autocomplete="username"
            autocapitalize="off"
            autocorrect="off"
            spellcheck="false"
            autofocus
            required
          />
        </div>

        <div class="mb-6">
          <label for="password" class="block text-gray-300 font-semibold mb-2">Password</label>
          <input
            id="password"
            v-model.trim="password"
            type="password"
            class="input-field"
            placeholder="Enter your password"
            autocomplete="current-password"
            required
          />
        </div>

        <div class="flex items-center justify-between mb-6">
          <label class="flex items-center">
            <input type="checkbox" class="mr-2 bg-gray-800 border-gray-700" />
            <span class="text-sm text-gray-400">Remember me</span>
          </label>
          <router-link to="/forgot-password" class="text-sm text-blue-400 hover:text-blue-300">
            Forgot password?
          </router-link>
        </div>

        <button type="submit" class="btn-primary w-full" :disabled="loading">
          <span v-if="loading">Signing in...</span>
          <span v-else>Sign In</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const { ipcRenderer } = window.require('electron');
    
    // Trim whitespace from inputs to prevent issues
    const cleanUsername = username.value.trim();
    const cleanPassword = password.value.trim();
    
    if (!cleanUsername || !cleanPassword) {
      errorMessage.value = 'Please enter both username and password';
      loading.value = false;
      return;
    }
    
    // Authenticate via IPC
    const result = await ipcRenderer.invoke('login', {
      username: cleanUsername,
      password: cleanPassword
    });

    if (result.success) {
      // Store token and user info
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('currentUser', JSON.stringify(result.user));
      
      console.log('Login successful!', result.user);
      
      // Navigate to dashboard
      router.push('/dashboard');
    } else {
      errorMessage.value = result.error || 'Invalid username or password';
    }
  } catch (error) {
    console.error('Login error:', error);
    errorMessage.value = 'An error occurred during login';
  } finally {
    loading.value = false;
  }
};
</script>
