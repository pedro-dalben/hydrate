const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hydrateAPI', {
  // Funcionalidades básicas
  getTodayCount: () => ipcRenderer.invoke('get-today-count'),
  addIntake: () => ipcRenderer.invoke('add-intake'),
  getIntakeByRange: (days) => ipcRenderer.invoke('get-intake-by-range', days),
  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (config) => ipcRenderer.invoke('set-config', config),
  testSound: () => ipcRenderer.invoke('test-sound'),
  dismissAlarm: () => ipcRenderer.invoke('dismiss-alarm'),

  // Novas funcionalidades
  exportData: () => ipcRenderer.invoke('export-data'),
  importData: (data) => ipcRenderer.invoke('import-data', data),
  getDailyProgress: () => ipcRenderer.invoke('get-daily-progress'),
  toggleTheme: () => ipcRenderer.invoke('toggle-theme'),

  // Listeners para eventos
  onAlarmTriggered: (callback) => {
    ipcRenderer.on('alarm-triggered', callback);
  },

  onNavigateTo: (callback) => {
    ipcRenderer.on('navigate-to', callback);
  },

  removeAlarmListener: () => {
    ipcRenderer.removeAllListeners('alarm-triggered');
  },

  removeNavigateListener: () => {
    ipcRenderer.removeAllListeners('navigate-to');
  }
});
