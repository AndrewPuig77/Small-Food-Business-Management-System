<template>
  <div class="report" data-testid="drawer-report">
    <div class="report-head">
      <div>
        <h3 class="report-title">{{ title }}</h3>
        <p class="report-period">{{ formatTime(report.period.from) }} to {{ formatTime(report.period.to) }}</p>
      </div>
      <p v-if="report.session" class="report-people">
        Opened by {{ report.session.openedBy || 'Unknown' }}<br />
        Closed by {{ report.session.closedBy || 'Unknown' }}
      </p>
    </div>

    <section class="report-section">
      <h4>Sales</h4>
      <dl class="report-grid">
        <dt>Transactions</dt><dd>{{ report.sales.transactions }}</dd>
        <dt>Gross sales</dt><dd>{{ money(report.sales.grossSales) }}</dd>
        <dt>Discounts</dt><dd>-{{ money(report.sales.discounts) }}</dd>
        <dt>Tax</dt><dd>{{ money(report.sales.tax) }}</dd>
        <dt>Tips</dt><dd>{{ money(report.sales.tips) }}</dd>
        <dt class="strong">Total collected</dt><dd class="strong">{{ money(report.sales.total) }}</dd>
        <template v-if="report.refunds.total > 0">
          <dt>Refunds</dt><dd>-{{ money(report.refunds.total) }}</dd>
          <dt class="strong">Net sales</dt><dd class="strong" data-testid="report-net">{{ money(report.sales.netSales) }}</dd>
        </template>
      </dl>
    </section>

    <section class="report-section">
      <h4>By payment method</h4>
      <p v-if="!report.byPaymentMethod.length" class="muted">No payments</p>
      <dl v-else class="report-grid">
        <template v-for="m in report.byPaymentMethod" :key="m.method">
          <dt>{{ label(m.method) }} ({{ m.count }})</dt><dd>{{ money(m.amount) }}</dd>
        </template>
      </dl>
    </section>

    <section class="report-section">
      <h4>By order type</h4>
      <p v-if="!report.byOrderType.length" class="muted">No orders</p>
      <dl v-else class="report-grid">
        <template v-for="o in report.byOrderType" :key="o.orderType">
          <dt>{{ orderTypeLabel(o.orderType) }} ({{ o.count }})</dt><dd>{{ money(o.total) }}</dd>
        </template>
      </dl>
    </section>

    <section class="report-section">
      <h4>Voids and refunds</h4>
      <dl class="report-grid">
        <dt>Voided sales ({{ report.voids.count }})</dt><dd>{{ money(report.voids.total) }}</dd>
        <dt>Refunds ({{ report.refunds.count }})</dt><dd>{{ money(report.refunds.total) }}</dd>
      </dl>
    </section>

    <section v-if="report.cash" class="report-section">
      <h4>Cash drawer</h4>
      <dl class="report-grid">
        <dt>Starting cash</dt><dd>{{ money(report.cash.openingFloat) }}</dd>
        <dt>Cash sales</dt><dd>+{{ money(report.cash.cashSales) }}</dd>
        <dt>Cash added</dt><dd>+{{ money(report.cash.payIns) }}</dd>
        <dt>Cash removed</dt><dd>-{{ money(report.cash.payOuts) }}</dd>
        <dt>Cash refunds</dt><dd>-{{ money(report.cash.cashRefunds) }}</dd>
        <dt class="strong">Should be in drawer</dt><dd class="strong">{{ money(report.cash.expected) }}</dd>
        <template v-if="report.cash.counted !== undefined">
          <dt>Counted</dt><dd>{{ money(report.cash.counted) }}</dd>
          <dt class="strong">Difference (over + / short −)</dt>
          <dd :class="['strong', varianceClass(report.cash.variance)]" data-testid="report-variance">{{ signedMoney(report.cash.variance) }}</dd>
        </template>
      </dl>
      <p v-if="report.session && report.session.notes" class="report-notes">Notes: {{ report.session.notes }}</p>
    </section>

    <section v-if="report.drawerSessions && report.drawerSessions.length" class="report-section">
      <h4>Drawer sessions</h4>
      <dl class="report-grid">
        <template v-for="s in report.drawerSessions" :key="s.id">
          <dt>#{{ s.id }} {{ s.openedBy }} ({{ s.status }})</dt>
          <dd :class="varianceClass(s.variance)">{{ s.variance === null ? 'Open' : signedMoney(s.variance) }}</dd>
        </template>
      </dl>
    </section>
  </div>
</template>

<script setup>
defineProps({
  report: { type: Object, required: true },
  title: { type: String, default: 'Report' }
});

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
const label = (m) => (m ? m.charAt(0).toUpperCase() + m.slice(1) : 'Other');
const orderTypeLabel = (t) => ({ 'dine-in': 'Dine in', takeout: 'Takeout', delivery: 'Delivery' }[t] || t);
const formatTime = (s) => {
  if (!s) return '';
  const d = new Date(String(s).replace(' ', 'T'));
  return isNaN(d) ? s : d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};
</script>

<style scoped>
.report {
  color: var(--text);
}
.report-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}
.report-title {
  font-size: 1.125rem;
  font-weight: 600;
}
.report-period,
.report-people {
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: var(--text-faint);
}
.report-people {
  text-align: right;
}
.report-section {
  padding: 1rem 0;
  border-bottom: 1px solid var(--border);
}
.report-section:last-child {
  border-bottom: none;
}
.report-section h4 {
  margin-bottom: 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-faint);
}
.report-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  row-gap: 0.4rem;
  font-size: 0.9rem;
}
.report-grid dt {
  color: var(--text-muted);
}
.report-grid dd {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.strong {
  font-weight: 600;
  color: var(--text) !important;
}
.over {
  color: #4ade80 !important;
}
.short {
  color: #f87171 !important;
}
.even {
  color: var(--text) !important;
}
.muted {
  font-size: 0.875rem;
  color: var(--text-faint);
}
.report-notes {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}
</style>
