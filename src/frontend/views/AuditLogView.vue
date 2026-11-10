<template>
  <div class="audit-page">
    <Sidebar />

    <main class="audit-main">
      <header class="page-header">
        <div>
          <h1 class="page-title">Audit Log</h1>
          <p class="page-subtitle">Who did what: voids, refunds, discounts, price changes, drawer activity, sign-ins and settings.</p>
        </div>
      </header>

      <section class="filters">
        <div>
          <label for="audit-from" class="field-label">From</label>
          <input id="audit-from" v-model="filters.from" type="date" class="input-field" @change="load" />
        </div>
        <div>
          <label for="audit-to" class="field-label">To</label>
          <input id="audit-to" v-model="filters.to" type="date" class="input-field" @change="load" />
        </div>
        <div class="grow">
          <label for="audit-action" class="field-label">Action</label>
          <select id="audit-action" v-model="filters.action" class="input-field" @change="load">
            <option value="">All actions</option>
            <option v-for="(label, key) in actions" :key="key" :value="key">{{ label }}</option>
          </select>
        </div>
      </section>

      <div v-if="error" class="banner banner-error" role="alert">{{ error }}</div>

      <section class="panel">
        <p v-if="!loading && !entries.length" class="empty">No entries for this period.</p>
        <table v-else class="table" data-testid="audit-table">
          <thead>
            <tr><th>Time</th><th>Who</th><th>Action</th><th>Details</th></tr>
          </thead>
          <tbody>
            <tr v-for="e in entries" :key="e.id">
              <td class="nowrap">{{ formatTime(e.createdAt) }}</td>
              <td>
                <div>{{ e.userName || 'Unknown' }}</div>
                <div v-if="e.userRole" class="muted">{{ e.userRole }}</div>
              </td>
              <td><span :class="['action', severity(e.action)]">{{ e.label }}</span></td>
              <td class="details">{{ describe(e) }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Sidebar from '../components/Sidebar.vue';

const { ipcRenderer } = window.electron;
const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const weekAgo = new Date(Date.now() - 6 * 864e5);

const filters = ref({ from: isoDate(weekAgo), to: isoDate(new Date()), action: '' });
const entries = ref([]);
const actions = ref({});
const loading = ref(true);
const error = ref('');

const load = async () => {
  loading.value = true;
  error.value = '';
  const result = await ipcRenderer.invoke('audit:list', { businessId: user.businessId, filters: { ...filters.value } });
  loading.value = false;
  if (!result.success) {
    error.value = result.error;
    entries.value = [];
    return;
  }
  entries.value = result.data;
  actions.value = result.actions;
};

const formatTime = (s) => {
  const d = new Date(String(s).replace(' ', 'T'));
  return isNaN(d) ? s : d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

const money = (n) => (n === null || n === undefined ? '' : '$' + Number(n).toFixed(2));

// Short, readable summary of an entry's details
const describe = (e) => {
  const d = e.details || {};
  switch (e.action) {
    case 'sale.void': return `Sale #${d.transactionId}${d.total !== undefined ? ' (' + money(d.total) + ')' : ''}: ${d.reason || 'no reason'}`;
    case 'sale.deleted': return `Sale #${d.transactionId} ${money(d.total)}`;
    case 'sale.discount': return `Sale #${d.transactionId}: ${money(d.discount)} off (${d.discountType})${d.reason ? ', ' + d.reason : ''}`;
    case 'refund.created': return `Sale #${d.transactionId}: ${money(d.amount)} to ${d.method}, ${d.reason}`;
    case 'tab.cancelled': return `Tab #${d.tabId}: ${d.reason}`;
    case 'drawer.opened': return `Starting cash ${money(d.openingFloat)}`;
    case 'drawer.closed': return `Should be ${money(d.expected)}, counted ${money(d.counted)}, ${Number(d.variance) === 0 ? 'balanced' : (d.variance > 0 ? 'over ' : 'short ') + money(Math.abs(d.variance))}`;
    case 'drawer.pay_in':
    case 'drawer.pay_out': return `${money(d.amount)}: ${d.reason}`;
    case 'menu.price_changed': return `${d.name}: ${money(d.from)} to ${money(d.to)}`;
    case 'menu.item_created': return `${d.name} at ${money(d.price)}`;
    case 'menu.item_updated':
    case 'menu.item_deleted': return d.name || '';
    case 'settings.tax_rate': return `${d.from}% to ${d.to}%`;
    case 'login.failed': return `Username "${d.username}"`;
    case 'access.denied': return d.reason || '';
    case 'backup.exported': return d.path || '';
    case 'backup.restored': return d.safetyBackup ? `Safety copy: ${d.safetyBackup}` : '';
    default: {
      const parts = Object.entries(d).filter(([, v]) => v !== null && v !== undefined && v !== '');
      return parts.map(([k, v]) => `${k}: ${v}`).join(', ');
    }
  }
};

const severity = (action) => {
  if (['sale.void', 'sale.deleted', 'sales.purged', 'refund.created', 'tab.cancelled', 'backup.restored', 'access.denied', 'login.failed', 'owner_code.rejected'].includes(action)) return 'warn';
  if (['menu.price_changed', 'sale.discount', 'drawer.pay_out', 'settings.tax_rate', 'owner_code.changed'].includes(action)) return 'note';
  return 'info';
};

onMounted(load);
</script>

<style scoped>
.audit-page {
  display: flex;
  height: 100vh;
  background: var(--bg);
}
.audit-main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 2rem;
}
.page-header {
  margin-bottom: 1.5rem;
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
.filters {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.filters .grow {
  flex: 1;
  min-width: 220px;
}
.filters input[type='date'] {
  color-scheme: dark;
}
.field-label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-muted);
}
.panel {
  padding: 0.5rem 1rem;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
}
.empty {
  padding: 2rem;
  text-align: center;
  color: var(--text-faint);
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.table th {
  padding: 0.625rem 0.75rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-faint);
  border-bottom: 1px solid var(--border);
}
.table td {
  padding: 0.75rem;
  vertical-align: top;
  color: var(--text);
  border-bottom: 1px solid var(--border);
}
.table tbody tr:last-child td {
  border-bottom: none;
}
.nowrap {
  white-space: nowrap;
}
.muted {
  font-size: 0.75rem;
  color: var(--text-faint);
  text-transform: capitalize;
}
.details {
  color: var(--text-muted);
}
.action {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  border-radius: 999px;
  border: 1px solid var(--border);
  color: var(--text-muted);
}
.action.warn {
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.35);
  background: rgba(248, 113, 113, 0.08);
}
.action.note {
  color: #fbbf24;
  border-color: rgba(251, 191, 36, 0.35);
  background: rgba(251, 191, 36, 0.08);
}
.banner {
  margin-bottom: 1rem;
  padding: 0.75rem 0.875rem;
  font-size: 0.875rem;
  border-radius: 10px;
}
.banner-error {
  color: #f87171;
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.3);
}
</style>
