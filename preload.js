// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ipcRenderer', {
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  on: (...args) => ipcRenderer.on(...args), 
  fetchMinecraftVersions: () => ipcRenderer.invoke('fetch-minecraft-versions')
});