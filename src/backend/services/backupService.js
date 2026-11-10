// Backups of the local database.
//
// Backups are full copies of the database file, kept in a "backups" folder
// next to it:
//   foodbusiness-auto-2026-11-09_080000.db        (daily, newest 14 kept)
//   foodbusiness-manual-2026-11-09_173012.db      (Back up now; kept)
//   foodbusiness-pre-restore-2026-11-09_173500.db (taken before a restore)
// A backup can also be exported anywhere (e.g. a USB stick) and restored.
const fs = require('fs');
const path = require('path');
const database = require('../database/database');

const KEEP_AUTO = 14;
const AUTO_INTERVAL_MS = 20 * 60 * 60 * 1000; // at most one auto backup per ~day

const backupsDir = () => path.join(path.dirname(database.getDbPath()), 'backups');

const stamp = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

const KINDS = ['auto', 'manual', 'pre-restore'];
const NAME_RE = /^foodbusiness-(auto|manual|pre-restore)-(\d{4}-\d{2}-\d{2})_(\d{2})(\d{2})(\d{2})(?:-(\d+))?\.db$/;

const parseName = (file) => {
  const m = NAME_RE.exec(file);
  if (!m) return null;
  return { kind: m[1], createdAt: `${m[2]} ${m[3]}:${m[4]}:${m[5]}` };
};

// Current database contents, with any pending writes included.
const currentContents = () => {
  database.flushDatabase();
  return fs.readFileSync(database.getDbPath());
};

const listBackups = () => {
  const dir = backupsDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .map((file) => {
      const info = parseName(file);
      if (!info) return null;
      const stats = fs.statSync(path.join(dir, file));
      return { file, kind: info.kind, createdAt: info.createdAt, size: stats.size };
    })
    .filter(Boolean)
    // Newest first; same-second backups fall back to their name (-2, -3 ...)
    .sort((a, b) => (a.createdAt === b.createdAt ? b.file.localeCompare(a.file, undefined, { numeric: true }) : (a.createdAt < b.createdAt ? 1 : -1)));
};

const pruneAuto = () => {
  const auto = listBackups().filter((b) => b.kind === 'auto');
  auto.slice(KEEP_AUTO).forEach((b) => fs.unlinkSync(path.join(backupsDir(), b.file)));
};

const createBackup = (kind = 'manual') => {
  if (!KINDS.includes(kind)) throw new Error('Unknown backup type');
  const dir = backupsDir();
  fs.mkdirSync(dir, { recursive: true });
  const base = `foodbusiness-${kind}-${stamp()}`;
  let file = `${base}.db`;
  for (let n = 2; fs.existsSync(path.join(dir, file)); n++) file = `${base}-${n}.db`;
  fs.writeFileSync(path.join(dir, file), currentContents());
  if (kind === 'auto') pruneAuto();
  return listBackups().find((b) => b.file === file);
};

// Take an automatic backup if the last one is old enough (or there is none).
const autoBackupIfDue = (now = Date.now()) => {
  const last = listBackups().find((b) => b.kind === 'auto');
  if (last) {
    const lastTime = new Date(last.createdAt.replace(' ', 'T')).getTime();
    if (now - lastTime < AUTO_INTERVAL_MS) return null;
  }
  return createBackup('auto');
};

// Only plain file names from the backups folder (no paths).
const backupPath = (file) => {
  if (!parseName(String(file)) || path.basename(file) !== file) throw new Error('Backup not found');
  const full = path.join(backupsDir(), file);
  if (!fs.existsSync(full)) throw new Error('Backup not found');
  return full;
};

const exportBackup = (destPath) => {
  if (!destPath) throw new Error('Choose where to save the backup');
  fs.writeFileSync(destPath, currentContents());
  return { path: destPath, size: fs.statSync(destPath).size };
};

const inspectFile = (filePath) => database.inspectDatabase(fs.readFileSync(filePath));

// Restore from a file: validate it, keep a copy of the current data, swap.
const restoreFromFile = (filePath) => {
  if (!filePath || !fs.existsSync(filePath)) throw new Error('Backup file not found');
  const contents = fs.readFileSync(filePath);
  const summary = database.inspectDatabase(contents); // throws if unusable
  const safety = createBackup('pre-restore');
  database.replaceDatabase(contents);
  return { restored: summary, safetyBackup: safety.file };
};

const restoreBackup = (file) => restoreFromFile(backupPath(file));

module.exports = {
  listBackups,
  createBackup,
  autoBackupIfDue,
  exportBackup,
  inspectFile,
  restoreFromFile,
  restoreBackup,
  backupsDir,
  KEEP_AUTO
};
