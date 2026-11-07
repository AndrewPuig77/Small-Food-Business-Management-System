// Runs before the renderer loads, with access to Electron APIs. The renderer
// itself has no Node.js access; this exposes only what it needs: a way to
// call the backend's IPC handlers (registered in src/backend/ipc.js).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
  }
});
