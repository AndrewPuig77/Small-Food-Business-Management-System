const { app, BrowserWindow } = require('electron');
const path = require('path');
const { setupIPC } = require('../backend/ipc');
const { flushDatabase } = require('../backend/database/database');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    resizable: true,
    maximizable: true,
    fullscreenable: true,
    show: false,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      // The UI gets no direct Node.js access. It talks to the backend only
      // through the IPC bridge defined in preload.js.
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
    title: 'Food Business Management System',
    icon: path.join(__dirname, '../../assets/icon.png')
  });

  // Show at normal size, centered, once the first frame is ready (avoids a
  // white flash). The window can be resized, maximized or made full screen.
  mainWindow.once('ready-to-show', () => {
    mainWindow.center();
    mainWindow.show();
  });

  // Load from Vite dev server in development, or file in production
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // Detached so DevTools doesn't take half of the app window
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create window when app is ready
app.on('ready', async () => {
  // Setup IPC handlers for backend communication
  await setupIPC();
  createWindow();
});

// Write any pending database changes before the app exits
app.on('before-quit', () => {
  try {
    flushDatabase();
  } catch (error) {
    console.error('Failed to save database on quit:', error);
  }
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Recreate window when app is activated (macOS)
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
