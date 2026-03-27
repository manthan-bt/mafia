import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    sendNotification: (title, body) => ipcRenderer.send('notify', { title, body }),
    onUpdate: (callback) => ipcRenderer.on('update-available', callback)
});
