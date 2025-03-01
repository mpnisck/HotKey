const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, func) => {
    ipcRenderer.on(channel, func);
    return () => ipcRenderer.removeListener(channel, func);
  },
});
