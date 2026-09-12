const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow;

function checkServerReady(retries = 30, delay = 500) {
  const API_KEY = 'PAVATI OS-pos-secret-2026';
  return new Promise((resolve, reject) => {
    function ping() {
      const req = http.get(
        'http://localhost:3000/api/settings',
        { headers: { 'x-api-key': API_KEY } },
        (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else if (retries > 0) {
            retries--;
            setTimeout(ping, delay);
          } else {
            reject(new Error('Server timeout'));
          }
        }
      );
      req.on('error', () => {
        if (retries > 0) {
          retries--;
          setTimeout(ping, delay);
        } else {
          reject(new Error('Server unreachable'));
        }
      });
      req.end();
    }
    ping();
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'MCT POS — Enterprise Retail Suite',
    icon: path.join(__dirname, '..', 'client', 'app-icon.ico'),
    backgroundColor: '#090d16',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Remove default browser menu bar for a clean, professional POS counter feel
  Menu.setApplicationMenu(null);

  try {
    await checkServerReady();
  } catch (e) {
    console.log('Server not responding yet, attempting direct connection...');
  }

  mainWindow.loadURL('http://localhost:3000');

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
