const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('blueprintAPI', {
  isElectron: true,
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  getVaultPath: () => ipcRenderer.invoke('vault:getPath'),
  loadVault: () => ipcRenderer.invoke('vault:load'),
  saveVault: (data) => ipcRenderer.invoke('vault:save', data),
  exportPng: (payload) => ipcRenderer.invoke('vault:exportPng', payload),
});
