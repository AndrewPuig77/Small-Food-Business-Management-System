<template>
  <div class="card mb-6" data-testid="backups-panel">
    <div class="backups-head">
      <div>
        <h2 class="text-xl font-semibold text-gray-100">Backups</h2>
        <p class="backups-text">
          A backup is taken automatically each day (the newest {{ keepAuto }} are kept).
          Export a copy somewhere safe, like a USB drive, so your data survives if this computer fails.
        </p>
      </div>
      <div class="backups-actions">
        <button type="button" class="btn-secondary" :disabled="busy" @click="exportBackup">Export backup…</button>
        <button type="button" class="btn-secondary" :disabled="busy" @click="chooseFile">Restore from file…</button>
        <button type="button" class="btn-primary" :disabled="busy" @click="backUpNow">Back up now</button>
      </div>
    </div>

    <p v-if="message" class="backups-banner success" role="status">{{ message }}</p>
    <p v-if="error" class="backups-banner error" role="alert">{{ error }}</p>

    <!-- Restore confirmation -->
    <div v-if="pending" ref="confirmBox" class="restore-confirm" data-testid="restore-confirm">
      <h3>Restore this backup?</h3>
      <p>
        <strong>{{ pending.label }}</strong>
        <span v-if="pending.summary"> · {{ pending.summary.businessName || 'Unknown business' }} · {{ pending.summary.sales }} sales</span>
      </p>
      <p class="backups-text">
        All current data will be replaced with this backup. A safety copy of the current data is saved first,
        so this can be undone. Everyone will need to sign in again.
      </p>
      <div class="backups-actions">
        <button type="button" class="btn-secondary" :disabled="busy" @click="pending = null">Cancel</button>
        <button type="button" class="btn-danger-solid" :disabled="busy" @click="confirmRestore">Restore</button>
      </div>
    </div>

    <table v-if="backups.length" class="backups-table">
      <thead>
        <tr><th>Date</th><th>Type</th><th class="num">Size</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="b in backups" :key="b.file">
          <td>{{ formatDate(b.createdAt) }}</td>
          <td><span :class="['kind', b.kind]">{{ kindLabel(b.kind) }}</span></td>
          <td class="num">{{ formatSize(b.size) }}</td>
          <td class="num"><button type="button" class="link-btn" :disabled="busy" @click="askRestore(b)">Restore</button></td>
        </tr>
      </tbody>
    </table>
    <p v-else class="backups-text">No backups yet.</p>
    <p v-if="folder" class="backups-folder">Saved in {{ folder }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { ipcRenderer } = window.electron;

const backups = ref([]);
const folder = ref('');
const keepAuto = ref(14);
const busy = ref(false);
const message = ref('');
const error = ref('');
const pending = ref(null); // { label, file? , fromFile?, summary? }
const confirmBox = ref(null);

// Bring the confirmation into view: the table can be long
watch(pending, async (value) => {
  if (!value) return;
  await nextTick();
  confirmBox.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

const formatDate = (s) => {
  const d = new Date(String(s).replace(' ', 'T'));
  return isNaN(d) ? s : d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};
const formatSize = (bytes) => (bytes >= 1048576 ? (bytes / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB');
const kindLabel = (k) => ({ auto: 'Automatic', manual: 'Manual', 'pre-restore': 'Before restore' }[k] || k);

const run = async (fn) => {
  busy.value = true;
  message.value = '';
  error.value = '';
  try {
    await fn();
  } finally {
    busy.value = false;
  }
};

const load = async () => {
  const result = await ipcRenderer.invoke('backup:list');
  if (result.success) {
    backups.value = result.data.backups;
    folder.value = result.data.folder;
    keepAuto.value = result.data.keepAuto;
  } else {
    error.value = result.error;
  }
};

const backUpNow = () =>
  run(async () => {
    const result = await ipcRenderer.invoke('backup:create');
    if (!result.success) {
      error.value = result.error;
      return;
    }
    message.value = 'Backup saved.';
    await load();
  });

const exportBackup = () =>
  run(async () => {
    const result = await ipcRenderer.invoke('backup:export');
    if (!result.success) error.value = result.error;
    else if (result.data) message.value = `Backup exported to ${result.data.path}`;
  });

const askRestore = (b) => {
  message.value = '';
  error.value = '';
  pending.value = { label: `${kindLabel(b.kind)} backup from ${formatDate(b.createdAt)}`, file: b.file };
};

const chooseFile = () =>
  run(async () => {
    const result = await ipcRenderer.invoke('backup:choose-file');
    if (!result.success) {
      error.value = result.error;
      return;
    }
    if (!result.data) return; // cancelled
    pending.value = { label: result.data.fileName, fromFile: true, summary: result.data };
  });

const confirmRestore = () =>
  run(async () => {
    const p = pending.value;
    const result = p.fromFile
      ? await ipcRenderer.invoke('backup:restore-chosen')
      : await ipcRenderer.invoke('backup:restore', { file: p.file });
    if (!result.success) {
      error.value = result.error;
      return;
    }
    pending.value = null;
    // Sessions come from the restored data, so everyone signs in again
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    router.push('/login');
  });

onMounted(load);
</script>

<style scoped>
.backups-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.backups-text {
  margin-top: 0.375rem;
  max-width: 560px;
  font-size: 0.875rem;
  color: var(--text-faint);
}
.backups-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.backups-banner {
  margin-bottom: 1rem;
  padding: 0.75rem 0.875rem;
  font-size: 0.875rem;
  border-radius: 10px;
}
.backups-banner.success {
  color: #4ade80;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.3);
}
.backups-banner.error {
  color: #f87171;
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.3);
}
.restore-confirm {
  margin-bottom: 1.25rem;
  padding: 1.25rem;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 12px;
}
.restore-confirm h3 {
  margin-bottom: 0.375rem;
  font-weight: 600;
  color: var(--text);
}
.restore-confirm p {
  color: var(--text-muted);
  font-size: 0.875rem;
}
.restore-confirm .backups-actions {
  margin-top: 1rem;
}
.btn-danger-solid {
  padding: 0.625rem 1.125rem;
  font-weight: 600;
  color: #fff;
  background: #dc2626;
  border-radius: 10px;
}
.btn-danger-solid:hover:not(:disabled) {
  background: #ef4444;
}
.backups-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.backups-table th {
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-faint);
  border-bottom: 1px solid var(--border);
}
.backups-table td {
  padding: 0.625rem 0.75rem;
  color: var(--text);
  border-bottom: 1px solid var(--border);
}
.num {
  text-align: right !important;
}
.kind {
  padding: 0.15rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 999px;
  color: var(--text-muted);
  background: var(--surface);
  border: 1px solid var(--border);
}
.kind.manual {
  color: #fb923c;
  border-color: var(--accent-ring);
  background: var(--accent-soft);
}
.kind.pre-restore {
  color: #fbbf24;
  border-color: rgba(251, 191, 36, 0.35);
}
.link-btn {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--accent);
}
.link-btn:hover:not(:disabled) {
  color: var(--accent-hover);
}
.backups-folder {
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: var(--text-faint);
  word-break: break-all;
}
</style>
