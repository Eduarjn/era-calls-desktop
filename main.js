// ============================================================
//  ERA · Inteligência de Calls — app desktop (Electron)
//  Abre o painel hospedado e habilita a gravação com áudio do
//  sistema (loopback) + microfone. Inicia com o Windows e fica
//  na bandeja.
// ============================================================
const { app, BrowserWindow, Tray, Menu, session, shell, desktopCapturer, nativeImage, ipcMain } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");

const SITE_URL = "https://eduarjn.github.io/era-calls-web/";
let win = null;
let tray = null;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); }
  });

  function createWindow() {
    win = new BrowserWindow({
      width: 1240, height: 840, minWidth: 920, minHeight: 600,
      title: "ERA · Inteligência de Calls",
      backgroundColor: "#faf9f5",
      icon: path.join(__dirname, "assets", "icon.ico"),
      autoHideMenuBar: true,
      webPreferences: { contextIsolation: true, nodeIntegration: false },
    });
    win.loadURL(SITE_URL);

    // sem internet / falha ao carregar o painel -> tela amigável
    win.webContents.on("did-fail-load", (e, code, desc, url, isMainFrame) => {
      if (isMainFrame && code !== -3) win.loadFile(path.join(__dirname, "assets", "error.html"));
    });

    // links externos (ex.: gravador.html target=_blank) abrem janela própria do app
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith("https://eduarjn.github.io")) {
        return {
          action: "allow",
          overrideBrowserWindowOptions: { width: 460, height: 560, autoHideMenuBar: true, backgroundColor: "#faf9f5" },
        };
      }
      shell.openExternal(url);
      return { action: "deny" };
    });

    // fechar = esconder na bandeja (não encerra)
    win.on("close", (e) => {
      if (!app.isQuitting) { e.preventDefault(); win.hide(); }
    });
  }

  // ---- Atualizações (UI própria de "Verificando atualização…") ----
  let updWin = null;
  function showUpdater(initial) {
    if (updWin && !updWin.isDestroyed()) { updWin.show(); updWin.webContents.send("upd", initial); return; }
    updWin = new BrowserWindow({
      width: 380, height: 250, resizable: false, frame: false, alwaysOnTop: true, skipTaskbar: true,
      backgroundColor: "#faf9f5", icon: path.join(__dirname, "assets", "icon.ico"),
      webPreferences: { preload: path.join(__dirname, "preload-updater.js") },
    });
    updWin.loadFile(path.join(__dirname, "assets", "updater.html"));
    updWin.webContents.on("did-finish-load", () => updWin.webContents.send("upd", initial));
    updWin.on("closed", () => { updWin = null; });
  }
  function sendUpd(data) { if (updWin && !updWin.isDestroyed()) updWin.webContents.send("upd", data); }
  function verificarAtualizacoes(manual) {
    if (manual) showUpdater({ state: "checking" });
    autoUpdater.checkForUpdates().catch((e) => { if (manual) showUpdater({ state: "error", message: String(e) }); });
  }
  ipcMain.on("upd-restart", () => { app.isQuitting = true; autoUpdater.quitAndInstall(); });
  ipcMain.on("upd-close", () => { if (updWin && !updWin.isDestroyed()) updWin.close(); });
  autoUpdater.on("checking-for-update", () => sendUpd({ state: "checking" }));
  autoUpdater.on("update-available", (info) => showUpdater({ state: "available", version: info && info.version }));
  autoUpdater.on("download-progress", (p) => sendUpd({ state: "downloading", percent: Math.round(p.percent || 0) }));
  autoUpdater.on("update-downloaded", (info) => showUpdater({ state: "ready", version: info && info.version }));
  autoUpdater.on("update-not-available", () => sendUpd({ state: "none" }));
  autoUpdater.on("error", (err) => sendUpd({ state: "error", message: String(err) }));

  app.whenReady().then(() => {
    // GRAVAÇÃO: ao chamar getDisplayMedia, entrega a tela + áudio do sistema (loopback)
    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
      desktopCapturer.getSources({ types: ["screen"] }).then((sources) => {
        callback({ video: sources[0], audio: "loopback" });
      }).catch(() => callback({}));
    });

    createWindow();

    // bandeja (ícone ao lado do relógio)
    try {
      tray = new Tray(path.join(__dirname, "assets", "icon.ico"));
      tray.setToolTip("ERA · Inteligência de Calls");
      tray.setContextMenu(Menu.buildFromTemplate([
        { label: "Abrir", click: () => { win.show(); win.focus(); } },
        { label: "Verificar atualizações", click: () => verificarAtualizacoes(true) },
        { type: "separator" },
        { label: "Sair", click: () => { app.isQuitting = true; app.quit(); } },
      ]));
      tray.on("click", () => { win.show(); win.focus(); });
    } catch (e) { /* sem bandeja, segue normal */ }

    // iniciar junto com o Windows
    app.setLoginItemSettings({ openAtLogin: true });

    // verifica atualizações no início (mostra a janela só se houver atualização)
    setTimeout(() => verificarAtualizacoes(false), 3000);

    app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });

  // mantém vivo na bandeja mesmo sem janelas
  app.on("window-all-closed", () => {});
}
