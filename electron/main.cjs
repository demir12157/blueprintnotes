const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const devServerUrl = process.env.VITE_DEV_SERVER_URL;
const vaultDir = path.join(os.homedir(), 'Documents', 'BlueprintVault');
const vaultFile = path.join(vaultDir, 'drawings.json');

function ensureVaultDir() {
  if (!fs.existsSync(vaultDir)) {
    fs.mkdirSync(vaultDir, { recursive: true });
  }
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    frame: false,
    backgroundColor: '#0B2545',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    title: 'BLUEPRINTNOTES // DRAWBOARD',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  ensureVaultDir();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Window Controls IPC
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window:close', () => mainWindow?.close());

// Vault Persistence IPC
ipcMain.handle('vault:getPath', () => vaultDir);

ipcMain.handle('vault:load', () => {
  try {
    ensureVaultDir();
    if (fs.existsSync(vaultFile)) {
      return JSON.parse(fs.readFileSync(vaultFile, 'utf-8'));
    }
    return null;
  } catch (err) {
    console.error('Failed to load drawings:', err);
    return null;
  }
});

ipcMain.handle('vault:save', (_event, data) => {
  try {
    ensureVaultDir();
    fs.writeFileSync(vaultFile, JSON.stringify(data, null, 2), 'utf-8');
    return { ok: true, path: vaultFile };
  } catch (err) {
    console.error('Failed to save drawings:', err);
    return { ok: false, error: String(err) };
  }
});

ipcMain.handle('vault:exportPng', async (_event, { filename, dataUrl }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Blueprint Drawing as PNG',
    defaultPath: path.join(vaultDir, filename),
    filters: [{ name: 'PNG Image', extensions: ['png'] }],
  });
  if (result.canceled || !result.filePath) {
    return { ok: false, canceled: true };
  }
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(result.filePath, Buffer.from(base64, 'base64'));
  return { ok: true, filePath: result.filePath };
});
