const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hydrateAPI', {
  getTodayCount: () => ipcRenderer.invoke('get-today-count'),
  addIntake: () => ipcRenderer.invoke('add-intake'),
  getIntakeByRange: (days) => ipcRenderer.invoke('get-intake-by-range', days),
  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (config) => ipcRenderer.invoke('set-config', config),
  testSound: () => ipcRenderer.invoke('test-sound'),
  dismissAlarm: () => ipcRenderer.invoke('dismiss-alarm'),

  // Listener para alarmes
  onAlarmTriggered: (callback) => {
    ipcRenderer.on('alarm-triggered', callback);
  },

  removeAlarmListener: () => {
    ipcRenderer.removeAllListeners('alarm-triggered');
  }
});
