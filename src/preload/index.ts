import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

type IPCInvokeChannels = "get-active-app" | "get-menu-items";
type IPCOnChannels =
  | "global-key-state"
  | "global-key-progress"
  | "global-key-activated";

contextBridge.exposeInMainWorld("api", {
  invoke: (channel: IPCInvokeChannels, ...args: unknown[]) =>
    ipcRenderer.invoke(channel, ...args),
  on: (channel: IPCOnChannels, func: (data: unknown) => void) => {
    const subscription = (_event: IpcRendererEvent, data: unknown) =>
      func(data);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
});
