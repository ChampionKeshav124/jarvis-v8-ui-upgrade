// ═══════════════════════════════════════════════════════════════
//  JARVIS V8 — Preload Script (Titan Prime)
//  Secure contextBridge API for the renderer process
// ═══════════════════════════════════════════════════════════════

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('jarvis', {
  /** Send a command to the Python AI backend */
  sendCommand: (payload) => ipcRenderer.invoke('send-command', payload),

  /** Get real CPU/RAM stats from the OS */
  getSystemStats: () => ipcRenderer.invoke('get-system-stats'),

  /** Get config variables from the main process */
  getConfig: () => ipcRenderer.invoke('get-config'),

  /** Wake word trigger from main process */
  onWakeJarvis: (callback) => ipcRenderer.on('wake-jarvis', callback),

  /** TITAN PRIME: Neural retry interim signal */
  onNeuralRetry: (callback) => ipcRenderer.on('neural-retry', (_event, data) => callback(data)),

  /** TITAN PRIME: Real-time neural data chunks */
  onNeuralChunk: (callback) => ipcRenderer.on('neural-chunk', (_event, data) => callback(data)),

  /** Frameless window controls */
  minimize:  () => ipcRenderer.send('win-minimize'),
  maximize:  () => ipcRenderer.send('win-maximize'),
  fullscreen:() => ipcRenderer.send('win-fullscreen'),
  close:     () => ipcRenderer.send('win-close'),

  /** Get full conversation history for UI startup display */
  getChatHistory: () => ipcRenderer.invoke('get-chat-history'),
});
