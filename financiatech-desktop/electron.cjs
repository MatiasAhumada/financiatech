const { app, BrowserWindow, nativeImage } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let mainWindow;

function getIconPath() {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    return path.join(__dirname, 'src', 'assets', 'favicon.ico');
  }
  return path.join(__dirname, 'src', 'assets', 'favicon.ico');
}

function createWindow() {
  const icon = nativeImage.createFromPath(getIconPath());

  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    icon: icon,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
    autoHideMenuBar: true,
    title: 'FinanciaTech Provisioner',
    backgroundColor: '#032831',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
