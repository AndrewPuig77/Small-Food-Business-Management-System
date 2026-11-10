// Feature 6: backups, export and restore.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { backend, setupBusiness, silenceLogs } = require('../helpers/setup');

let ctx, Backup, Menu;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fbm-backup-test-'));

beforeAll(async () => {
  silenceLogs();
  ctx = await setupBusiness();
  Backup = backend('services/backupService');
  Menu = backend('services/menuService');
  Menu.createItem(1, { name: 'Original item', price: 5, available: 1 });
});

afterAll(() => ctx.database.flushDatabase());

const menuNames = () => Menu.getAllItems(1).items.map((i) => i.name).sort();

describe('creating backups', () => {
  test('there are none at first', () => {
    expect(Backup.listBackups()).toEqual([]);
  });

  test('a manual backup includes changes not yet written to disk', () => {
    Menu.createItem(1, { name: 'Unsaved item', price: 6, available: 1 }); // write is still pending
    const b = Backup.createBackup('manual');
    expect(b.kind).toBe('manual');
    expect(b.size).toBeGreaterThan(0);
    const summary = Backup.inspectFile(path.join(Backup.backupsDir(), b.file));
    expect(summary.businessName).toBe("Joe's Pizza");
  });

  test('automatic backups run once a day and only the newest 14 are kept', () => {
    const first = Backup.autoBackupIfDue();
    expect(first.kind).toBe('auto');
    expect(Backup.autoBackupIfDue()).toBeNull(); // not due yet

    for (let i = 0; i < 20; i++) Backup.createBackup('auto');
    const auto = Backup.listBackups().filter((b) => b.kind === 'auto');
    expect(auto).toHaveLength(Backup.KEEP_AUTO);
    expect(Backup.listBackups().filter((b) => b.kind === 'manual')).toHaveLength(1); // manual ones are never pruned
  });

  test('due again after a day', () => {
    const tomorrow = Date.now() + 25 * 60 * 60 * 1000;
    expect(Backup.autoBackupIfDue(tomorrow)).not.toBeNull();
  });
});

describe('export', () => {
  test('writes a usable copy to any location', () => {
    const dest = path.join(tmp, 'usb-copy.db');
    const out = Backup.exportBackup(dest);
    expect(out.size).toBeGreaterThan(0);
    expect(Backup.inspectFile(dest).businessName).toBe("Joe's Pizza");
  });
});

describe('restore', () => {
  test('restoring brings back the data from the backup and keeps a safety copy', () => {
    const exported = path.join(tmp, 'before-changes.db');
    Backup.exportBackup(exported);
    const before = menuNames();

    Menu.createItem(1, { name: 'Added after backup', price: 7, available: 1 });
    expect(menuNames()).toContain('Added after backup');

    const result = Backup.restoreFromFile(exported);
    expect(result.restored.businessName).toBe("Joe's Pizza");
    expect(menuNames()).toEqual(before);
    expect(result.safetyBackup).toMatch(/^foodbusiness-pre-restore-/);

    // The safety copy still has the newer data
    const safety = path.join(Backup.backupsDir(), result.safetyBackup);
    fs.copyFileSync(safety, path.join(tmp, 'safety.db'));
    Backup.restoreFromFile(path.join(tmp, 'safety.db'));
    expect(menuNames()).toContain('Added after backup');
  });

  test('the app keeps working after a restore (writes and reads)', () => {
    Menu.createItem(1, { name: 'After restore', price: 8, available: 1 });
    expect(menuNames()).toContain('After restore');
    ctx.database.flushDatabase();
    expect(Backup.inspectFile(ctx.database.getDbPath()).businessName).toBe("Joe's Pizza");
  });

  test('restores by name from the backups folder only', () => {
    const [manual] = Backup.listBackups().filter((b) => b.kind === 'manual');
    expect(() => Backup.restoreBackup(manual.file)).not.toThrow();
    expect(() => Backup.restoreBackup('../foodbusiness.db')).toThrow(/not found/);
    expect(() => Backup.restoreBackup('foodbusiness-manual-2000-01-01_000000.db')).toThrow(/not found/);
  });

  test('rejects files that are not backups, without touching current data', () => {
    const before = menuNames();
    const text = path.join(tmp, 'notes.db');
    fs.writeFileSync(text, 'hello, not a database');
    expect(() => Backup.restoreFromFile(text)).toThrow(/not a Food Business Manager backup/);

    // A valid SQLite file from some other app
    const initSqlJs = require('sql.js');
    return initSqlJs().then((SQL) => {
      const other = new SQL.Database();
      other.run('CREATE TABLE notes (id INTEGER)');
      const otherPath = path.join(tmp, 'other-app.db');
      fs.writeFileSync(otherPath, Buffer.from(other.export()));
      expect(() => Backup.restoreFromFile(otherPath)).toThrow(/not a Food Business Manager backup/);

      // A damaged backup: correct header, truncated body
      const good = fs.readFileSync(ctx.database.getDbPath());
      const damaged = path.join(tmp, 'damaged.db');
      fs.writeFileSync(damaged, good.slice(0, 200));
      expect(() => Backup.restoreFromFile(damaged)).toThrow(/damaged|not a Food Business Manager backup/);

      expect(menuNames()).toEqual(before);
    });
  });
});

describe('listing', () => {
  test('backups are listed newest first regardless of type', () => {
    const list = Backup.listBackups();
    const times = list.map((b) => b.createdAt);
    expect([...times].sort().reverse()).toEqual(times);
    expect(new Set(list.map((b) => b.kind))).toEqual(new Set(['auto', 'manual', 'pre-restore']));
  });
});
