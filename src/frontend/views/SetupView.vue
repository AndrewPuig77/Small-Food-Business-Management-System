<template>
  <div class="setup-root h-screen w-full flex overflow-hidden">

        <!-- Sidebar: brand + vertical stepper -->
        <aside class="setup-aside hidden md:flex flex-col shrink-0 w-[300px] lg:w-[340px] h-full overflow-y-auto p-8 lg:p-10">
          <div class="flex items-center gap-3 mb-12">
            <div class="brand-mark">
              <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 11h18M5 11a7 7 0 0 1 14 0M12 4V3M4 15h16l-1 3a2 2 0 0 1-2 1.5H7A2 2 0 0 1 5 18z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-neutral-100 leading-tight">Food Business Manager</p>
              <p class="text-xs text-neutral-500">First-time setup</p>
            </div>
          </div>

          <ol class="space-y-1">
            <li v-for="(step, index) in steps" :key="step.title">
              <button
                type="button"
                class="step-item w-full text-left"
                :class="{ 'is-active': currentStep === index, 'is-done': currentStep > index || completed }"
                :disabled="index > currentStep || completed || submitting"
                @click="goToStep(index)"
              >
                <span class="step-dot">
                  <svg v-if="currentStep > index || completed" viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                  <span v-else>{{ index + 1 }}</span>
                </span>
                <span class="min-w-0">
                  <span class="block text-sm font-medium step-title">{{ step.title }}</span>
                  <span class="block text-xs text-neutral-500 truncate">{{ step.hint }}</span>
                </span>
              </button>
            </li>
          </ol>

          <p class="mt-auto pt-10 text-xs text-neutral-600 leading-relaxed">
            Your data is stored locally on this computer. You can change any of these details later in Settings.
          </p>
        </aside>

        <!-- Main panel: scrolls on its own; content is centered and capped for readability -->
        <main class="setup-main flex-1 h-full overflow-y-auto">
          <div class="min-h-full w-full max-w-3xl mx-auto flex flex-col px-6 py-10 sm:px-12 lg:py-16">
          <!-- Compact progress for narrow windows -->
          <div v-if="!completed" class="md:hidden mb-8">
            <div class="flex justify-between text-xs text-neutral-500 mb-2">
              <span>Step {{ currentStep + 1 }} of {{ steps.length }}</span>
              <span>{{ steps[currentStep].title }}</span>
            </div>
            <div class="h-1 rounded-full bg-neutral-800 overflow-hidden">
              <div class="h-full progress-fill transition-all duration-300" :style="{ width: ((currentStep + 1) / steps.length * 100) + '%' }"></div>
            </div>
          </div>

          <form class="flex-1 flex flex-col" novalidate @submit.prevent="nextStep">
            <Transition name="fade" mode="out-in">

              <!-- Done -->
              <section v-if="completed" key="done" class="flex-1 flex flex-col items-center justify-center text-center py-10">
                <div class="success-ring mb-6">
                  <svg viewBox="0 0 24 24" class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </div>
                <h1 class="text-3xl font-semibold text-neutral-50 tracking-tight mb-3">You're all set</h1>
                <p class="text-neutral-400 max-w-sm mb-8">
                  {{ businessInfo.name }} is ready. Sign in with the username
                  <span class="text-neutral-200 font-medium">{{ ownerInfo.username }}</span> to get started.
                </p>
                <button type="button" class="btn-accent" @click="router.push('/')">
                  Go to sign in
                </button>
              </section>

              <!-- Step 1: Welcome -->
              <section v-else-if="currentStep === 0" key="welcome" class="flex-1">
                <p class="eyebrow">Welcome</p>
                <h1 class="text-3xl sm:text-4xl font-semibold text-neutral-50 tracking-tight mb-3">
                  Let's set up your business
                </h1>
                <p class="text-neutral-400 mb-10 max-w-lg">
                  It takes about two minutes. You'll add your business details and create the owner account.
                </p>

                <div class="grid sm:grid-cols-2 gap-3">
                  <div v-for="feature in features" :key="feature.title" class="feature-card">
                    <div class="feature-icon">
                      <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" v-html="feature.icon"></svg>
                    </div>
                    <div>
                      <h3 class="text-sm font-semibold text-neutral-100">{{ feature.title }}</h3>
                      <p class="text-sm text-neutral-500 mt-0.5">{{ feature.text }}</p>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Step 2: Business information -->
              <section v-else-if="currentStep === 1" key="business" class="flex-1">
                <p class="eyebrow">Step 2 of 4</p>
                <h2 class="text-2xl sm:text-3xl font-semibold text-neutral-50 tracking-tight mb-2">Your business</h2>
                <p class="text-neutral-400 mb-8">This appears on receipts and reports.</p>

                <div class="space-y-6">
                  <div>
                    <label for="biz-name" class="field-label">Business name</label>
                    <input id="biz-name" v-model="businessInfo.name" type="text" class="field" placeholder="e.g. Joe's Pizza Shop" autofocus />
                  </div>

                  <div>
                    <span class="field-label">Business type</span>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button
                        v-for="type in businessTypes"
                        :key="type.value"
                        type="button"
                        class="type-tile"
                        :class="{ 'is-selected': businessInfo.type === type.value }"
                        :aria-pressed="businessInfo.type === type.value"
                        @click="businessInfo.type = type.value"
                      >
                        {{ type.label }}
                      </button>
                    </div>
                  </div>

                  <div class="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label for="biz-address" class="field-label">Address <span class="optional">Optional</span></label>
                      <input id="biz-address" v-model="businessInfo.address" type="text" class="field" placeholder="123 Main St, City, State" />
                    </div>
                    <div>
                      <label for="biz-phone" class="field-label">Phone <span class="optional">Optional</span></label>
                      <input id="biz-phone" v-model="businessInfo.phone" type="tel" class="field" placeholder="(555) 123-4567" />
                    </div>
                  </div>

                  <div class="sm:w-1/2">
                    <label for="biz-tax" class="field-label">Sales tax rate</label>
                    <div class="relative">
                      <input
                        id="biz-tax"
                        v-model.number="businessInfo.taxRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        class="field pr-10"
                        placeholder="7.5"
                      />
                      <span class="absolute inset-y-0 right-4 flex items-center text-neutral-500 text-sm pointer-events-none">%</span>
                    </div>
                    <p class="field-help">The sales tax percentage for your location.</p>
                  </div>
                </div>
              </section>

              <!-- Step 3: Owner account -->
              <section v-else-if="currentStep === 2" key="owner" class="flex-1">
                <p class="eyebrow">Step 3 of 4</p>
                <h2 class="text-2xl sm:text-3xl font-semibold text-neutral-50 tracking-tight mb-2">Owner account</h2>
                <p class="text-neutral-400 mb-8">The main administrator, with full access to everything.</p>

                <div class="space-y-6">
                  <div class="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label for="own-name" class="field-label">Full name</label>
                      <input id="own-name" v-model="ownerInfo.fullName" type="text" class="field" placeholder="Jordan Smith" autocomplete="name" autofocus />
                    </div>
                    <div>
                      <label for="own-email" class="field-label">Email</label>
                      <input id="own-email" v-model.trim="ownerInfo.email" type="email" class="field" placeholder="owner@business.com" autocomplete="email" />
                    </div>
                  </div>

                  <div>
                    <label for="own-user" class="field-label">Username</label>
                    <input
                      id="own-user"
                      v-model.trim="ownerInfo.username"
                      type="text"
                      class="field"
                      placeholder="admin"
                      autocomplete="username"
                      autocapitalize="off"
                      autocorrect="off"
                      spellcheck="false"
                    />
                  </div>

                  <div class="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label for="own-pass" class="field-label">Password</label>
                      <input id="own-pass" v-model.trim="ownerInfo.password" type="password" class="field" placeholder="At least 8 characters" autocomplete="new-password" />
                      <div class="flex gap-1 mt-2" aria-hidden="true">
                        <span v-for="n in 4" :key="n" class="h-1 flex-1 rounded-full transition-colors" :class="n <= passwordStrength.score ? passwordStrength.color : 'bg-neutral-800'"></span>
                      </div>
                      <p class="field-help">{{ passwordStrength.label }}</p>
                    </div>
                    <div>
                      <label for="own-pass2" class="field-label">Confirm password</label>
                      <input id="own-pass2" v-model.trim="ownerInfo.confirmPassword" type="password" class="field" placeholder="Re-enter password" autocomplete="new-password" />
                    </div>
                  </div>

                  <div class="pin-panel">
                    <div class="sm:flex sm:items-center sm:justify-between gap-6">
                      <div class="mb-3 sm:mb-0">
                        <label for="own-pin" class="text-sm font-medium text-neutral-200">Manager PIN</label>
                        <p class="text-sm text-neutral-500 mt-0.5">4 digits, used to approve voids and large discounts.</p>
                      </div>
                      <input
                        id="own-pin"
                        v-model.trim="ownerInfo.pin"
                        type="password"
                        maxlength="4"
                        class="field pin-field"
                        placeholder="0000"
                        inputmode="numeric"
                        autocomplete="off"
                        @input="ownerInfo.pin = ownerInfo.pin.replace(/\D/g, '')"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <!-- Step 4: Review -->
              <section v-else-if="currentStep === 3" key="review" class="flex-1">
                <p class="eyebrow">Step 4 of 4</p>
                <h2 class="text-2xl sm:text-3xl font-semibold text-neutral-50 tracking-tight mb-2">Review and finish</h2>
                <p class="text-neutral-400 mb-8">Check everything looks right.</p>

                <div class="space-y-4">
                  <div class="review-card">
                    <div class="flex items-center justify-between mb-4">
                      <h3 class="text-sm font-semibold text-neutral-200">Business</h3>
                      <button type="button" class="link-btn" @click="goToStep(1)">Edit</button>
                    </div>
                    <dl class="review-grid">
                      <dt>Name</dt><dd>{{ businessInfo.name }}</dd>
                      <dt>Type</dt><dd>{{ businessTypeLabel }}</dd>
                      <template v-if="businessInfo.address"><dt>Address</dt><dd>{{ businessInfo.address }}</dd></template>
                      <template v-if="businessInfo.phone"><dt>Phone</dt><dd>{{ businessInfo.phone }}</dd></template>
                      <dt>Sales tax</dt><dd>{{ businessInfo.taxRate }}%</dd>
                    </dl>
                  </div>

                  <div class="review-card">
                    <div class="flex items-center justify-between mb-4">
                      <h3 class="text-sm font-semibold text-neutral-200">Owner account</h3>
                      <button type="button" class="link-btn" @click="goToStep(2)">Edit</button>
                    </div>
                    <dl class="review-grid">
                      <dt>Name</dt><dd>{{ ownerInfo.fullName }}</dd>
                      <dt>Email</dt><dd>{{ ownerInfo.email }}</dd>
                      <dt>Username</dt><dd>{{ ownerInfo.username }}</dd>
                      <dt>Password</dt><dd>Set</dd>
                      <dt>Manager PIN</dt><dd>Set</dd>
                    </dl>
                  </div>
                </div>
              </section>
            </Transition>

            <!-- Error -->
            <div v-if="errorMessage && !completed" class="error-banner mt-6" role="alert">
              <svg viewBox="0 0 24 24" class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />
              </svg>
              <span>{{ errorMessage }}</span>
            </div>

            <!-- Navigation -->
            <div v-if="!completed" class="flex items-center justify-between mt-10 pt-6 border-t border-neutral-800/80">
              <button v-if="currentStep > 0" type="button" class="btn-ghost" :disabled="submitting" @click="previousStep">
                Back
              </button>
              <span v-else></span>

              <button type="submit" class="btn-accent" :disabled="!canProceed || submitting">
                <svg v-if="submitting" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
                </svg>
                <span>{{ primaryLabel }}</span>
              </button>
            </div>
          </form>
          </div>
        </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const steps = [
  { title: 'Welcome', hint: 'What you can do' },
  { title: 'Business', hint: 'Name, type and tax' },
  { title: 'Owner account', hint: 'Your admin login' },
  { title: 'Review', hint: 'Confirm and finish' }
];

const features = [
  {
    title: 'Point of sale',
    text: 'Fast checkout, split bills and receipts.',
    icon: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'
  },
  {
    title: 'Staff and scheduling',
    text: 'Shifts, time clock and payroll hours.',
    icon: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>'
  },
  {
    title: 'Inventory',
    text: 'Stock levels with low-stock alerts.',
    icon: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>'
  },
  {
    title: 'Reports',
    text: 'Sales, costs and profit at a glance.',
    icon: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'
  }
];

const businessTypes = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'food-truck', label: 'Food truck' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'market-vendor', label: 'Market vendor' },
  { value: 'other', label: 'Other' }
];

const currentStep = ref(0);
const errorMessage = ref('');
const submitting = ref(false);
const completed = ref(false);

const businessInfo = ref({
  name: '',
  type: '',
  address: '',
  phone: '',
  taxRate: 7.5
});

const ownerInfo = ref({
  fullName: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  pin: ''
});

const businessTypeLabel = computed(
  () => businessTypes.find((t) => t.value === businessInfo.value.type)?.label || businessInfo.value.type
);

const passwordStrength = computed(() => {
  const pw = ownerInfo.value.password || '';
  if (!pw) return { score: 0, label: 'Use 8 or more characters.', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length < 8) return { score: 1, label: 'Too short', color: 'bg-red-500' };
  const levels = [
    { label: 'Weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-red-500' },
    { label: 'Fair', color: 'bg-amber-400' },
    { label: 'Good', color: 'bg-lime-400' },
    { label: 'Strong', color: 'bg-emerald-400' }
  ];
  return { score, ...levels[score] };
});

const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return Boolean(businessInfo.value.name && businessInfo.value.type);
  }
  if (currentStep.value === 2) {
    const o = ownerInfo.value;
    return Boolean(o.fullName && o.email && o.username && o.password && o.confirmPassword && o.pin);
  }
  return true;
});

const primaryLabel = computed(() => {
  if (submitting.value) return 'Setting up...';
  if (currentStep.value === 0) return 'Get started';
  if (currentStep.value === steps.length - 1) return 'Complete setup';
  return 'Continue';
});

const validateStep = () => {
  if (currentStep.value === 1) {
    const rate = businessInfo.value.taxRate;
    if (rate === '' || rate === null || Number.isNaN(Number(rate)) || rate < 0 || rate > 100) {
      return 'Enter a sales tax rate between 0 and 100.';
    }
  }
  if (currentStep.value === 2) {
    const o = ownerInfo.value;
    if (!/^\S+@\S+\.\S+$/.test(o.email)) return 'Enter a valid email address.';
    if (o.password.length < 8) return 'Password must be at least 8 characters.';
    if (o.password !== o.confirmPassword) return 'Passwords do not match.';
    if (!/^\d{4}$/.test(o.pin)) return 'PIN must be exactly 4 digits.';
  }
  return '';
};

const nextStep = () => {
  if (!canProceed.value || submitting.value) return;
  errorMessage.value = validateStep();
  if (errorMessage.value) return;

  if (currentStep.value === steps.length - 1) {
    completeSetup();
    return;
  }
  currentStep.value++;
};

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
    errorMessage.value = '';
  }
};

const goToStep = (index) => {
  if (index <= currentStep.value && !completed.value && !submitting.value) {
    currentStep.value = index;
    errorMessage.value = '';
  }
};

const completeSetup = async () => {
  submitting.value = true;
  errorMessage.value = '';
  try {
    const { ipcRenderer } = window.electron;

    // Plain objects (not reactive proxies) for IPC
    const setupData = {
      business: {
        name: businessInfo.value.name,
        type: businessInfo.value.type,
        address: businessInfo.value.address,
        phone: businessInfo.value.phone,
        taxRate: businessInfo.value.taxRate || 7.5
      },
      owner: {
        fullName: ownerInfo.value.fullName,
        username: ownerInfo.value.username,
        email: ownerInfo.value.email,
        password: ownerInfo.value.password,
        pin: ownerInfo.value.pin
      }
    };

    const result = await ipcRenderer.invoke('complete-setup', setupData);

    if (result.success) {
      localStorage.setItem('setupComplete', 'true');
      localStorage.setItem('businessName', businessInfo.value.name);
      completed.value = true;
    } else {
      errorMessage.value = 'Setup failed: ' + (result.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Setup error:', error);
    errorMessage.value = 'Something went wrong during setup. Please try again.';
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
/* Palette: neutral near-black surfaces with one warm accent. */
.setup-root {
  --bg: #0a0a0a;
  --panel: #111111;
  --surface: #171717;
  --surface-hover: #1f1f1f;
  --border: #262626;
  --border-strong: #3a3a3a;
  --text: #fafafa;
  --text-muted: #a3a3a3;
  --text-faint: #737373;
  --accent: #f97316;
  --accent-hover: #fb8a3c;
  --accent-soft: rgba(249, 115, 22, 0.12);
  --accent-ring: rgba(249, 115, 22, 0.35);
  --success: #22c55e;
  --danger: #f87171;

  background: var(--bg);
  color: var(--text);
}

.setup-aside {
  background: var(--panel);
  border-right: 1px solid var(--border);
}
.setup-main {
  background:
    radial-gradient(800px 400px at 100% 0%, rgba(249, 115, 22, 0.06), transparent 70%),
    var(--bg);
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
}

/* Stepper */
.step-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  transition: background-color 150ms;
}
.step-item:not(:disabled):hover {
  background: var(--surface);
}
.step-item:disabled {
  cursor: default;
}
.step-dot {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-faint);
  border: 1px solid var(--border-strong);
  transition: all 200ms;
}
.step-title {
  color: var(--text-faint);
  transition: color 200ms;
}
.step-item.is-active {
  background: var(--surface);
}
.step-item.is-active .step-dot {
  color: #fff;
  background: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-soft);
}
.step-item.is-active .step-title,
.step-item.is-done .step-title {
  color: var(--text);
}
.step-item.is-done .step-dot {
  color: var(--accent);
  border-color: var(--accent-ring);
  background: var(--accent-soft);
}

.progress-fill {
  background: var(--accent);
}

.eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 12px;
}

/* Fields */
.field-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 8px;
}
.optional {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 400;
  color: var(--text-faint);
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
/* Hide number spinners on the tax field */
.field[type='number']::-webkit-inner-spin-button,
.field[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.field-help {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-faint);
}
.pin-field {
  width: 140px;
  text-align: center;
  letter-spacing: 0.6em;
  padding-left: calc(14px + 0.3em);
  font-size: 18px;
}

/* Business type tiles */
.type-tile {
  height: 46px;
  padding: 0 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  transition: all 150ms;
}
.type-tile:hover {
  color: var(--text);
  border-color: var(--border-strong);
}
.type-tile.is-selected {
  color: var(--text);
  background: var(--accent-soft);
  border-color: var(--accent);
}

/* Cards */
.feature-card,
.pin-panel,
.review-card {
  border-radius: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
}
.feature-card {
  display: flex;
  gap: 14px;
  padding: 20px;
}
.pin-panel {
  padding: 20px;
}
.review-card {
  padding: 22px;
}
.feature-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  color: var(--accent);
  background: var(--accent-soft);
}
.review-grid {
  display: grid;
  grid-template-columns: 130px 1fr;
  row-gap: 10px;
  font-size: 14px;
}
.review-grid dt {
  color: var(--text-faint);
}
.review-grid dd {
  color: var(--text);
  overflow-wrap: anywhere;
}

/* Buttons */
.btn-accent {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 46px;
  padding: 0 24px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: var(--accent);
  border-radius: 10px;
  transition: background-color 150ms, opacity 150ms, transform 100ms;
}
.btn-accent:hover:not(:disabled) {
  background: var(--accent-hover);
}
.btn-accent:active:not(:disabled) {
  transform: translateY(1px);
}
.btn-accent:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-ghost {
  height: 46px;
  padding: 0 18px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 10px;
  transition: color 150ms, background-color 150ms, border-color 150ms;
}
.btn-ghost:hover:not(:disabled) {
  color: var(--text);
  background: var(--surface);
  border-color: var(--border-strong);
}
.link-btn {
  font-size: 13px;
  font-weight: 500;
  color: var(--accent);
}
.link-btn:hover {
  color: var(--accent-hover);
  text-decoration: underline;
}
.btn-accent:focus-visible,
.btn-ghost:focus-visible,
.type-tile:focus-visible,
.step-item:focus-visible,
.link-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Feedback */
.error-banner {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  font-size: 14px;
  color: var(--danger);
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 10px;
}
.success-ring {
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  border-radius: 999px;
  color: var(--success);
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.35);
}

/* Step transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
