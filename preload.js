const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // API request methods
  makeRequest: (requestData) => ipcRenderer.invoke('make-api-request', requestData),
  
  // Collection management
  saveCollections: (collections) => ipcRenderer.invoke('save-collections', collections),
  loadCollections: () => ipcRenderer.invoke('load-collections'),
  exportCollection: (collection) => ipcRenderer.invoke('export-collection', collection),
  importCollection: () => ipcRenderer.invoke('import-collection'),
  
  // Environment management
  saveEnvironment: (environment) => ipcRenderer.invoke('save-environment', environment),
  loadEnvironment: () => ipcRenderer.invoke('load-environment'),
  
  // Utility methods
  platform: process.platform,
  version: process.version
});