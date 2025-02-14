const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
});

ipcRenderer
  .invoke("get-menu-info")
  .then((response) => {
    console.log(response);
  })
  .catch((error) => {
    console.error("데이터 invoke 실패", error);
  });
