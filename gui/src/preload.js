const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
	ipcRenderer: {
		myPing: () => ipcRenderer.send('my-ping'),
		on: (channel, func) => ipcRenderer.on(channel, func),
		send: (channel, data) => ipcRenderer.send(channel, data),
		invoke: (channel, data) => ipcRenderer.invoke(channel, data)
	},
});
