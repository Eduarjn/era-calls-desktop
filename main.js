// ============================================================
//  ERA · Inteligência de Calls — app desktop (Electron)
//  Abre o painel hospedado e habilita a gravação com áudio do
//  sistema (loopback) + microfone. Inicia com o Windows e fica
//  na bandeja.
// ============================================================
const { app, BrowserWindow, Tray, Menu, session, shell, desktopCapturer, nativeImage } = require("electron");
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
      autoHideMenuBar: true,
      webPreferences: { contextIsolation: true, nodeIntegration: false },
    });
    win.loadURL(SITE_URL);

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
      tray = new Tray(nativeImage.createEmpty());
      tray.setToolTip("ERA · Inteligência de Calls");
      tray.setContextMenu(Menu.buildFromTemplate([
        { label: "Abrir", click: () => { win.show(); win.focus(); } },
        { type: "separator" },
        { label: "Sair", click: () => { app.isQuitting = true; app.quit(); } },
      ]));
      tray.on("click", () => { win.show(); win.focus(); });
    } catch (e) { /* sem bandeja, segue normal */ }

    // iniciar junto com o Windows
    app.setLoginItemSettings({ openAtLogin: true });

    // verifica atualizações (GitHub Releases) e avisa quando houver
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});

    app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });

  // mantém vivo na bandeja mesmo sem janelas
  app.on("window-all-closed", () => {});
}
