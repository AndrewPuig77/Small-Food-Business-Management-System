// Stand-in for the `electron` module when running backend tests under Jest.
// Jest gives every test file its own module registry, so each file gets a
// fresh temporary data directory and therefore its own empty database.
const fs = require('fs');
const os = require('os');
const path = require('path');

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fbm-test-'));

module.exports = {
  app: {
    getPath: () => dataDir
  },
  ipcMain: {
    handle: () => {}
  }
};
