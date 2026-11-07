<template>
  <div class="login-root h-screen w-full overflow-y-auto">
    <div class="min-h-full flex items-center justify-center p-6">
    <div class="login-card w-full max-w-[420px]">
      <!-- Logo and Title -->
      <div class="mb-8">
        <div class="brand-mark mb-6">
          <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 11h18M5 11a7 7 0 0 1 14 0M12 4V3M4 15h16l-1 3a2 2 0 0 1-2 1.5H7A2 2 0 0 1 5 18z" />
          </svg>
        </div>
        <h1 class="text-2xl font-semibold text-neutral-50 tracking-tight mb-1">Welcome back</h1>
        <p class="text-neutral-400">Sign in to Food Business Manager</p>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="error-banner mb-5" role="alert">
        {{ errorMessage }}
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" autocomplete="on">
        <div class="mb-5">
          <label for="username" class="field-label">Username</label>
          <input
            id="username"
            v-model.trim="username"
            type="text"
            class="field"
            placeholder="Enter your username"
            autocomplete="username"
            autocapitalize="off"
            autocorrect="off"
            spellcheck="false"
            autofocus
            required
          />
        </div>

        <div class="mb-5">
          <label for="password" class="field-label">Password</label>
          <input
            id="password"
            v-model.trim="password"
            type="password"
            class="field"
            placeholder="Enter your password"
            autocomplete="current-password"
            required
          />
        </div>

        <div class="flex items-center justify-between mb-7">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="remember" class="check" />
            <span class="text-sm text-neutral-400">Remember me</span>
          </label>
          <router-link to="/forgot-password" class="link">
            Forgot password?
          </router-link>
        </div>

        <button type="submit" class="btn-accent w-full" :disabled="loading">
          <span v-if="loading">Signing in...</span>
          <span v-else>Sign in</span>
        </button>
      </form>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('');
const password = ref('');
const remember = ref(false);
const loading = ref(false);
const errorMessage = ref('');

onMounted(async () => {
  try {
    const { ipcRenderer } = window.electron;
    const savedRemember = localStorage.getItem('rememberMe');
    remember.value = savedRemember === 'true';

    // If a token exists and is valid, go straight to dashboard or employee account
    const token = localStorage.getItem('authToken');
    if (token) {
      const result = await ipcRenderer.invoke('verify-token', token);
      if (result && result.valid) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userRole = currentUser.role?.toLowerCase();
        // Only owner, manager, and admin go to main dashboard
        if (userRole === 'owner' || userRole === 'manager' || userRole === 'admin') {
          router.push('/dashboard');
        } else {
          // All other roles (staff, chef, server, cashier, driver, etc.) go to employee account
          router.push('/employee-account');
        }
      } else {
        // Clear invalid token
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
      }
    }
  } catch (e) {
    // ignore
  }
});


const handleLogin = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const { ipcRenderer } = window.electron;
    
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
      password: cleanPassword,
      remember: remember.value
    });

    if (result.success) {
      // Store token and user info
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('currentUser', JSON.stringify(result.user));
      localStorage.setItem('rememberMe', remember.value ? 'true' : 'false');

      console.log('Login successful!', result.user);

      // Navigate to dashboard or employee account based on role
      const userRole = result.user.role?.toLowerCase();
      // Only owner, manager, and admin go to main dashboard
      if (userRole === 'owner' || userRole === 'manager' || userRole === 'admin') {
        router.push('/dashboard');
      } else {
        // All other roles (staff, chef, server, cashier, driver, etc.) go to employee account
        router.push('/employee-account');
      }
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

<style scoped>
/* Same palette as the setup wizard (SetupView.vue) */
.login-root {
  --bg: #0a0a0a;
  --surface: #171717;
  --border: #262626;
  --border-strong: #3a3a3a;
  --text: #fafafa;
  --text-faint: #737373;
  --accent: #f97316;
  --accent-hover: #fb8a3c;
  --accent-soft: rgba(249, 115, 22, 0.12);

  color: var(--text);
  background:
    radial-gradient(700px 400px at 50% -10%, rgba(249, 115, 22, 0.08), transparent 70%),
    var(--bg);
}
.login-card {
  padding: 40px;
  background: #111111;
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: 0 30px 80px -30px rgba(0, 0, 0, 0.8);
}
.brand-mark {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
}
.field-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 8px;
}
.field {
  width: 100%;
  height: 46px;
  padding: 0 14px;
  font-size: 15px;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  transition: border-color 150ms, box-shadow 150ms;
}
.field::placeholder {
  color: #525252;
}
.field:hover {
  border-color: var(--border-strong);
}
.field:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.check {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
}
.link {
  font-size: 14px;
  font-weight: 500;
  color: var(--accent);
}
.link:hover {
  color: var(--accent-hover);
  text-decoration: underline;
}
.btn-accent {
  height: 46px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: var(--accent);
  border-radius: 10px;
  transition: background-color 150ms, opacity 150ms;
}
.btn-accent:hover:not(:disabled) {
  background: var(--accent-hover);
}
.btn-accent:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-accent:focus-visible,
.link:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.error-banner {
  padding: 12px 14px;
  font-size: 14px;
  color: #f87171;
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 10px;
}
</style>
