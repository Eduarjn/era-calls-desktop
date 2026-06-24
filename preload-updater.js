const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("upd", {
  on: (cb) => ipcRenderer.on("upd", (_e, data) => cb(data)),
  restart: () => ipcRenderer.send("upd-restart"),
  close: () => ipcRenderer.send("upd-close"),
});
