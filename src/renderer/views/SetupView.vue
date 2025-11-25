<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
    <div class="card max-w-2xl w-full">
      <!-- Progress Steps -->
      <div class="flex justify-between mb-8">
        <div 
          v-for="(step, index) in steps" 
          :key="index"
          class="flex-1 text-center"
        >
          <div class="relative">
            <div 
              class="w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold transition-all"
              :class="currentStep >= index ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-500'"
            >
              {{ index + 1 }}
            </div>
            <p class="text-xs mt-2" :class="currentStep >= index ? 'text-gray-300' : 'text-gray-600'">
              {{ step }}
            </p>
          </div>
          <div 
            v-if="index < steps.length - 1" 
            class="absolute top-5 w-full h-0.5 -z-10"
            :class="currentStep > index ? 'bg-gray-700' : 'bg-gray-800'"
            :style="{ left: '50%', width: 'calc(100% / ' + steps.length + ')' }"
          ></div>
        </div>
      </div>

      <!-- Step 1: Welcome -->
      <div v-if="currentStep === 0">
        <div class="text-center mb-6">
          <h1 class="text-4xl font-bold text-gray-100 mb-4">Welcome! 🎉</h1>
          <p class="text-gray-400 text-lg">Let's get your food business management system set up</p>
        </div>
        
        <div class="space-y-4 my-8">
          <div class="flex items-start space-x-3">
            <span class="text-2xl">✓</span>
            <div>
              <h3 class="text-gray-200 font-semibold">Employee Management</h3>
              <p class="text-gray-500 text-sm">Track schedules, payroll, and time tracking</p>
            </div>
          </div>
          <div class="flex items-start space-x-3">
            <span class="text-2xl">✓</span>
            <div>
              <h3 class="text-gray-200 font-semibold">Inventory Control</h3>
              <p class="text-gray-500 text-sm">Real-time stock tracking with alerts</p>
            </div>
          </div>
          <div class="flex items-start space-x-3">
            <span class="text-2xl">✓</span>
            <div>
              <h3 class="text-gray-200 font-semibold">Point of Sale</h3>
              <p class="text-gray-500 text-sm">Process transactions and manage orders</p>
            </div>
          </div>
          <div class="flex items-start space-x-3">
            <span class="text-2xl">✓</span>
            <div>
              <h3 class="text-gray-200 font-semibold">Reports & Analytics</h3>
              <p class="text-gray-500 text-sm">Sales reports, profit tracking, and insights</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Business Information -->
      <div v-if="currentStep === 1">
        <h2 class="text-2xl font-bold text-gray-100 mb-2">Business Information</h2>
        <p class="text-gray-400 mb-6">Tell us about your business</p>

        <div class="space-y-4">
          <div>
            <label class="block text-gray-300 font-semibold mb-2">Business Name *</label>
            <input
              v-model="businessInfo.name"
              type="text"
              class="input-field"
              placeholder="e.g., Joe's Pizza Shop"
              required
            />
          </div>

          <div>
            <label class="block text-gray-300 font-semibold mb-2">Business Type *</label>
            <select v-model="businessInfo.type" class="input-field">
              <option value="">Select type...</option>
              <option value="restaurant">Restaurant</option>
              <option value="cafe">Cafe</option>
              <option value="food-truck">Food Truck</option>
              <option value="bakery">Bakery</option>
              <option value="market-vendor">Market Vendor</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label class="block text-gray-300 font-semibold mb-2">Address (Optional)</label>
            <input
              v-model="businessInfo.address"
              type="text"
              class="input-field"
              placeholder="123 Main St, City, State"
            />
          </div>

          <div>
            <label class="block text-gray-300 font-semibold mb-2">Phone Number (Optional)</label>
            <input
              v-model="businessInfo.phone"
              type="tel"
              class="input-field"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
      </div>

      <!-- Step 3: Owner Account -->
      <div v-if="currentStep === 2">
        <h2 class="text-2xl font-bold text-gray-100 mb-2">Create Owner Account</h2>
        <p class="text-gray-400 mb-6">This will be the main administrator account</p>

        <div class="space-y-4">
          <div>
            <label class="block text-gray-300 font-semibold mb-2">Full Name *</label>
            <input
              v-model="ownerInfo.fullName"
              type="text"
              class="input-field"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label class="block text-gray-300 font-semibold mb-2">Email (Optional)</label>
            <input
              v-model="ownerInfo.email"
              type="email"
              class="input-field"
              placeholder="owner@business.com"
            />
          </div>

          <div>
            <label class="block text-gray-300 font-semibold mb-2">Username *</label>
            <input
              v-model="ownerInfo.username"
              type="text"
              class="input-field"
              placeholder="admin"
              required
            />
          </div>

          <div>
            <label class="block text-gray-300 font-semibold mb-2">Password *</label>
            <input
              v-model="ownerInfo.password"
              type="password"
              class="input-field"
              placeholder="Minimum 8 characters"
              required
            />
          </div>

          <div>
            <label class="block text-gray-300 font-semibold mb-2">Confirm Password *</label>
            <input
              v-model="ownerInfo.confirmPassword"
              type="password"
              class="input-field"
              placeholder="Re-enter password"
              required
            />
          </div>

          <div v-if="passwordError" class="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-sm">
            {{ passwordError }}
          </div>
        </div>
      </div>

      <!-- Step 4: Confirmation -->
      <div v-if="currentStep === 3">
        <h2 class="text-2xl font-bold text-gray-100 mb-2">Review & Confirm</h2>
        <p class="text-gray-400 mb-6">Please review your setup information</p>

        <div class="space-y-6">
          <div class="bg-gray-800 p-4 rounded-lg">
            <h3 class="text-gray-300 font-semibold mb-3">Business Information</h3>
            <div class="space-y-2 text-sm">
              <p><span class="text-gray-500">Name:</span> <span class="text-gray-200">{{ businessInfo.name }}</span></p>
              <p><span class="text-gray-500">Type:</span> <span class="text-gray-200">{{ businessInfo.type }}</span></p>
              <p v-if="businessInfo.address"><span class="text-gray-500">Address:</span> <span class="text-gray-200">{{ businessInfo.address }}</span></p>
              <p v-if="businessInfo.phone"><span class="text-gray-500">Phone:</span> <span class="text-gray-200">{{ businessInfo.phone }}</span></p>
            </div>
          </div>

          <div class="bg-gray-800 p-4 rounded-lg">
            <h3 class="text-gray-300 font-semibold mb-3">Owner Account</h3>
            <div class="space-y-2 text-sm">
              <p><span class="text-gray-500">Name:</span> <span class="text-gray-200">{{ ownerInfo.fullName }}</span></p>
              <p v-if="ownerInfo.email"><span class="text-gray-500">Email:</span> <span class="text-gray-200">{{ ownerInfo.email }}</span></p>
              <p><span class="text-gray-500">Username:</span> <span class="text-gray-200">{{ ownerInfo.username }}</span></p>
            </div>
          </div>

          <div class="bg-green-900/20 border border-green-700 p-4 rounded-lg">
            <p class="text-green-300 text-sm">
              ✓ By completing setup, you'll be able to login and start managing your business immediately
            </p>
          </div>
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="flex justify-between mt-8 pt-6 border-t border-gray-800">
        <button
          v-if="currentStep > 0"
          @click="previousStep"
          class="btn-secondary"
        >
          Back
        </button>
        <div v-else></div>

        <button
          @click="nextStep"
          class="btn-primary"
          :disabled="!canProceed"
        >
          {{ currentStep === steps.length - 1 ? 'Complete Setup' : 'Next' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const steps = ['Welcome', 'Business Info', 'Owner Account', 'Confirm'];
const currentStep = ref(0);
const passwordError = ref('');

const businessInfo = ref({
  name: '',
  type: '',
  address: '',
  phone: ''
});

const ownerInfo = ref({
  fullName: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: ''
});

const canProceed = computed(() => {
  if (currentStep.value === 0) return true;
  
  if (currentStep.value === 1) {
    return businessInfo.value.name && businessInfo.value.type;
  }
  
  if (currentStep.value === 2) {
    return ownerInfo.value.fullName && 
           ownerInfo.value.username && 
           ownerInfo.value.password &&
           ownerInfo.value.confirmPassword;
  }
  
  return true;
});

const nextStep = () => {
  passwordError.value = '';

  // Validate password on step 2
  if (currentStep.value === 2) {
    if (ownerInfo.value.password.length < 8) {
      passwordError.value = 'Password must be at least 8 characters';
      return;
    }
    if (ownerInfo.value.password !== ownerInfo.value.confirmPassword) {
      passwordError.value = 'Passwords do not match';
      return;
    }
  }

  // Complete setup on final step
  if (currentStep.value === steps.length - 1) {
    completeSetup();
    return;
  }

  currentStep.value++;
};

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
    passwordError.value = '';
  }
};

const completeSetup = () => {
  // TODO: Save to database via backend API
  console.log('Setup Complete!', {
    business: businessInfo.value,
    owner: {
      ...ownerInfo.value,
      password: '[HIDDEN]',
      confirmPassword: '[HIDDEN]'
    }
  });

  // Mark setup as complete in localStorage
  localStorage.setItem('setupComplete', 'true');
  localStorage.setItem('businessName', businessInfo.value.name);

  // Navigate to login
  alert('Setup complete! Please login with your credentials.');
  router.push('/');
};
</script>
