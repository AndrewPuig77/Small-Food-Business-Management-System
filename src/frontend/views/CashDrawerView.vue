<template>
  <div class="drawer-page">
    <Sidebar />

    <main class="drawer-main">
      <header class="page-header">
        <div>
          <h1 class="page-title">Cash Drawer</h1>
          <p class="page-subtitle">Track the cash in your register: what you start with, what comes in and out, and whether it adds up when you count it at closing.</p>
        </div>
        <button type="button" class="btn-secondary" @click="showDailyReport">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-6m4 6V7m4 10v-3M4 21h16" /></svg>
          End-of-day report
        </button>
      </header>

      <div v-if="error" class="banner banner-error" role="alert">{{ error }}</div>

      <!-- Drawer closed: open it with the starting cash -->
      <section v-if="!loading && !session" class="panel open-panel" data-testid="drawer-closed">
        <div class="status-row">
          <span class="status-dot closed"></span>
          <h2 class="panel-title">Drawer is closed</h2>
        </div>
        <p class="panel-text">Count the cash in the drawer before you start selling (the change you keep on hand), enter it, and open the drawer.</p>
        <form class="inline-form" @submit.prevent="openDrawer">
          <label for="opening-float" class="field-label">Starting cash</label>
          <div class="money-input">
            <span>$</span>
            <input id="opening-float" v-model="openingFloat" type="number" step="0.01" min="0" class="input-field" placeholder="0.00" />
          </div>
          <button type="submit" class="btn-primary" :disabled="busy">Open drawer</button>
        </form>
      </section>

      <!-- Drawer open: live position -->
      <template v-if="session">
        <section class="panel" data-testid="drawer-open">
          <div class="panel-head">
            <div>
              <div class="status-row">
                <span class="status-dot open"></span>
                <h2 class="panel-title">Drawer is open</h2>
              </div>
              <p class="panel-text">Opened {{ formatTime(session.openedAt) }} by {{ session.openedBy || 'Unknown' }}</p>
            </div>
            <div class="panel-actions">
              <button type="button" class="btn-secondary" @click="openMovement('pay_in')">Add cash</button>
              <button type="button" class="btn-secondary" @click="openMovement('pay_out')">Remove cash</button>
              <button type="button" class="btn-primary" @click="openClose">Close drawer</button>
            </div>
          </div>

          <div class="tiles">
            <div class="tile"><span class="tile-label">Starting cash</span><span class="tile-value">{{ money(session.cash.openingFloat) }}</span></div>
            <div class="tile"><span class="tile-label">Cash sales</span><span class="tile-value">{{ money(session.cash.cashSales) }}</span></div>
            <div class="tile"><span class="tile-label">Cash added</span><span class="tile-value">{{ money(session.cash.payIns) }}</span></div>
            <div class="tile"><span class="tile-label">Cash removed</span><span class="tile-value">{{ money(session.cash.payOuts) }}</span></div>
            <div class="tile tile-accent"><span class="tile-label">Should be in drawer</span><span class="tile-value" data-testid="expected-cash">{{ money(session.cash.expected) }}</span></div>
          </div>
        </section>

        <section class="panel">
          <h3 class="section-title">Cash in and out</h3>
          <p v-if="!session.movements.length" class="panel-text">No cash added or removed yet.</p>
          <table v-else class="table">
            <thead><tr><th>Time</th><th>Type</th><th>Reason</th><th>By</th><th class="num">Amount</th></tr></thead>
            <tbody>
              <tr v-for="m in session.movements" :key="m.id">
                <td>{{ formatTime(m.created_at) }}</td>
                <td><span :class="['pill', m.type]">{{ m.type === 'pay_in' ? 'Added' : 'Removed' }}</span></td>
                <td>{{ m.reason }}</td>
                <td>{{ m.created_by_name }}</td>
                <td class="num">{{ m.type === 'pay_in' ? '+' : '-' }}{{ money(m.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="panel">
          <DrawerReport :report="session.report" title="This session so far" />
        </section>
      </template>

      <!-- History -->
      <section class="panel">
        <h3 class="section-title">Past close-outs</h3>
        <p v-if="!history.length" class="panel-text">No closed sessions yet.</p>
        <table v-else class="table" data-testid="drawer-history">
          <thead>
            <tr><th>Closed</th><th>Opened by</th><th>Closed by</th><th class="num">Should be</th><th class="num">Counted</th><th class="num">Difference</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="s in history" :key="s.id">
              <td>{{ formatTime(s.closed_at) }}</td>
              <td>{{ s.opened_by_name }}</td>
              <td>{{ s.closed_by_name }}</td>
              <td class="num">{{ money(s.expected_cash) }}</td>
              <td class="num">{{ money(s.counted_cash) }}</td>
              <td :class="['num', varianceClass(s.variance)]">{{ signedMoney(s.variance) }}</td>
              <td class="num"><button type="button" class="link-btn" @click="viewSession(s.id)">View report</button></td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>

    <!-- Add or remove cash -->
    <div v-if="movement" class="modal-overlay" @click.self="movement = null">
      <form class="modal" @submit.prevent="saveMovement">
        <h2 class="modal-title">{{ movement.type === 'pay_in' ? 'Add cash' : 'Remove cash' }}</h2>
        <p class="panel-text">
          {{ movement.type === 'pay_in' ? 'Cash you put into the drawer that isn\'t from a sale, e.g. more coins for change.' : 'Cash you take out of the drawer that isn\'t a refund, e.g. paying a delivery driver.' }}
        </p>
        <label for="movement-amount" class="field-label">Amount</label>
        <div class="money-input">
          <span>$</span>
          <input id="movement-amount" v-model="movement.amount" type="number" step="0.01" min="0" class="input-field" />
        </div>
        <label for="movement-reason" class="field-label">Reason</label>
        <input id="movement-reason" v-model="movement.reason" type="text" maxlength="120" class="input-field" placeholder="Required" />
        <div v-if="movement.error" class="banner banner-error" role="alert">{{ movement.error }}</div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="movement = null">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="busy">Save</button>
        </div>
      </form>
    </div>

    <!-- Close drawer -->
    <div v-if="closing" class="modal-overlay" @click.self="closing = null">
      <form class="modal" @submit.prevent="closeDrawer">
        <h2 class="modal-title">Close drawer</h2>
        <p class="panel-text">Count all the cash in the drawer and enter the total.</p>
        <div class="close-expected">
          <span>Should be in drawer</span>
          <strong>{{ money(session.cash.expected) }}</strong>
        </div>
        <label for="counted-cash" class="field-label">Counted cash</label>
        <div class="money-input">
          <span>$</span>
          <input id="counted-cash" v-model="closing.counted" type="number" step="0.01" min="0" class="input-field" />
        </div>
        <p v-if="closing.counted !== ''" :class="['variance-preview', varianceClass(previewVariance)]" data-testid="variance-preview">
          {{ Math.abs(previewVariance) < 0.005 ? 'Drawer balances' : (previewVariance > 0 ? 'Over by ' : 'Short by ') + money(Math.abs(previewVariance)) }}
        </p>
        <label for="closing-notes" class="field-label">Notes (optional)</label>
        <textarea id="closing-notes" v-model="closing.notes" rows="2" class="input-field" placeholder="e.g. explanation for a difference"></textarea>
        <div v-if="closing.error" class="banner banner-error" role="alert">{{ closing.error }}</div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="closing = null">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="busy || closing.counted === ''">Close drawer</button>
        </div>
      </form>
    </div>

    <!-- Report viewer -->
    <div v-if="viewer" class="modal-overlay" @click.self="viewer = null">
      <div class="modal modal-wide report-print">
        <div class="report-toolbar no-print">
          <div v-if="viewer.date !== undefined" class="date-picker">
            <label for="report-date" class="field-label">Date</label>
            <input id="report-date" v-model="viewer.date" type="date" class="input-field" @change="loadDailyReport" />
          </div>
          <span v-else></span>
          <div class="panel-actions">
            <button type="button" class="btn-secondary" @click="printReport">Print</button>
            <button type="button" class="btn-secondary" @click="viewer = null">Close</button>
          </div>
        </div>
        <div v-if="viewer.error" class="banner banner-error" role="alert">{{ viewer.error }}</div>
        <DrawerReport v-if="viewer.report" :report="viewer.report" :title="viewer.title" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Sidebar from '../components/Sidebar.vue';
import DrawerReport from '../components/DrawerReport.vue';

const { ipcRenderer } = window.electron;
const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
const businessId = user.businessId;
const userId = user.userId || user.id;

const loading = ref(true);
const busy = ref(false);
const error = ref('');
const session = ref(null);
const history = ref([]);
const openingFloat = ref('');
const movement = ref(null);
const closing = ref(null);
const viewer = ref(null);

const money = (n) => '$' + (Number(n) || 0).toFixed(2);
const signedMoney = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) < 0.005) return '$0.00';
  return (v > 0 ? '+' : '-') + '$' + Math.abs(v).toFixed(2);
};
const varianceClass = (n) => {
  if (n === null || n === undefined) return '';
  if (Math.abs(n) < 0.005) return 'even';
  return n > 0 ? 'over' : 'short';
};
const formatTime = (s) => {
  if (!s) return '';
  const d = new Date(String(s).replace(' ', 'T'));
  return isNaN(d) ? s : d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};
const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const previewVariance = computed(() =>
  closing.value && session.value ? Number(closing.value.counted || 0) - session.value.cash.expected : 0
);

const load = async () => {
  const [current, sessions] = await Promise.all([
    ipcRenderer.invoke('drawer:get-current', businessId),
    ipcRenderer.invoke('drawer:get-sessions', { businessId, limit: 30 })
  ]);
  if (current.success) session.value = current.data;
  else error.value = current.error;
  if (sessions.success) history.value = sessions.data.filter((s) => s.status === 'closed');
  loading.value = false;
};

const run = async (fn) => {
  busy.value = true;
  try {
    return await fn();
  } finally {
    busy.value = false;
  }
};

const openDrawer = () =>
  run(async () => {
    error.value = '';
    const result = await ipcRenderer.invoke('drawer:open', { businessId, userId, openingFloat: openingFloat.value });
    if (!result.success) {
      error.value = result.error;
      return;
    }
    session.value = result.data;
    openingFloat.value = '';
  });

const openMovement = (type) => {
  movement.value = { type, amount: '', reason: '', error: '' };
};

const saveMovement = () =>
  run(async () => {
    const m = movement.value;
    const result = await ipcRenderer.invoke('drawer:add-movement', {
      businessId, userId, type: m.type, amount: m.amount, reason: m.reason
    });
    if (!result.success) {
      m.error = result.error;
      return;
    }
    session.value = result.data;
    movement.value = null;
  });

const openClose = async () => {
  await load(); // refresh expected cash before counting
  closing.value = { counted: '', notes: '', error: '' };
};

const closeDrawer = () =>
  run(async () => {
    const c = closing.value;
    const result = await ipcRenderer.invoke('drawer:close', { businessId, userId, countedCash: c.counted, notes: c.notes });
    if (!result.success) {
      c.error = result.error;
      return;
    }
    closing.value = null;
    session.value = null;
    viewer.value = { title: 'Drawer close-out', report: result.data };
    await load();
  });

const viewSession = async (sessionId) => {
  const result = await ipcRenderer.invoke('drawer:get-session-report', { businessId, sessionId });
  viewer.value = result.success
    ? { title: `Drawer close-out #${sessionId}`, report: result.data }
    : { title: 'Report', report: null, error: result.error };
};

const loadDailyReport = async () => {
  const v = viewer.value;
  const result = await ipcRenderer.invoke('drawer:get-daily-report', { businessId, date: v.date });
  v.report = result.success ? result.data : null;
  v.error = result.success ? '' : result.error;
  v.title = `End-of-day report, ${v.date}`;
};

const showDailyReport = async () => {
  viewer.value = { date: todayLocal(), report: null, error: '', title: '' };
  await loadDailyReport();
};

// The print styles only apply while this class is on <body>, so they never
// affect printing elsewhere (e.g. POS receipts).
const printReport = () => {
  document.body.classList.add('printing-drawer-report');
  window.print();
  document.body.classList.remove('printing-drawer-report');
};

// Keep the expected cash current while sales come in
let timer = null;
onMounted(() => {
  load();
  timer = setInterval(() => {
    if (!movement.value && !closing.value) load();
  }, 15000);
});
onUnmounted(() => clearInterval(timer));
</script>

<style scoped>
.drawer-page {
  display: flex;
  height: 100vh;
  background: var(--bg);
}
.drawer-main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 2rem;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.page-header > .btn-secondary {
  flex-shrink: 0;
  white-space: nowrap;
}
.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text);
}
.page-subtitle {
  margin-top: 0.25rem;
  color: var(--text-faint);
}
.panel {
  margin-bottom: 1.25rem;
  padding: 1.5rem;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
}
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}
.panel-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text);
}
.panel-text {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-faint);
}
.panel-actions {
  display: flex;
  gap: 0.5rem;
}
.status-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}
.status-dot.open {
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.15);
}
.status-dot.closed {
  background: #737373;
}
.inline-form {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  margin-top: 1.25rem;
  flex-wrap: wrap;
}
.inline-form .field-label {
  width: 100%;
}
.field-label {
  display: block;
  margin: 0.875rem 0 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text);
}
.inline-form .field-label {
  margin-top: 0;
}
.money-input {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--text-faint);
}
.money-input .input-field {
  max-width: 200px;
}
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  margin-top: 1.25rem;
}
.tile {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
}
.tile-label {
  font-size: 0.8125rem;
  color: var(--text-faint);
}
.tile-value {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}
.tile-accent {
  border-color: var(--accent-ring);
  background: var(--accent-soft);
}
.tile-accent .tile-value {
  color: #fb923c;
}
.section-title {
  margin-bottom: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.table th {
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-faint);
  border-bottom: 1px solid var(--border);
}
.table td {
  padding: 0.625rem 0.75rem;
  color: var(--text);
  border-bottom: 1px solid var(--border);
}
.table tbody tr:last-child td {
  border-bottom: none;
}
.num {
  text-align: right !important;
  font-variant-numeric: tabular-nums;
}
.pill {
  padding: 0.15rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 999px;
}
.pill.pay_in {
  color: #4ade80;
  background: rgba(34, 197, 94, 0.12);
}
.pill.pay_out {
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.12);
}
.over {
  color: #4ade80;
}
.short {
  color: #f87171;
}
.link-btn {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--accent);
}
.link-btn:hover {
  color: var(--accent-hover);
}
.banner {
  margin: 0.75rem 0;
  padding: 0.75rem 0.875rem;
  font-size: 0.875rem;
  border-radius: 10px;
}
.banner-error {
  color: #f87171;
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.3);
}
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.7);
}
.modal {
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 16px;
}
.modal-wide {
  max-width: 620px;
}
.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.25rem;
}
.close-expected {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  padding: 0.875rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text-muted);
}
.close-expected strong {
  color: var(--text);
}
.variance-preview {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
}
.variance-preview.even {
  color: var(--text-muted);
}
.report-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1rem;
}
.date-picker .field-label {
  margin-top: 0;
}
.date-picker .input-field {
  color-scheme: dark;
}
</style>

<style>
/* Print only the open report (only while printing from this screen) */
@media print {
  body.printing-drawer-report * {
    visibility: hidden;
  }
  body.printing-drawer-report .report-print,
  body.printing-drawer-report .report-print * {
    visibility: visible;
  }
  body.printing-drawer-report .report-print {
    position: absolute;
    inset: 0;
    max-height: none !important;
    border: none !important;
  }
  body.printing-drawer-report .report-print .no-print {
    display: none !important;
  }
}
</style>
