const { app, BrowserWindow, ipcMain  } = require('electron')
const path = require('path')
const fs = require('fs/promises');
const Store = require('electron-store');

if (require('electron-squirrel-startup')) app.quit()

const store = new Store();
let mainWindow;

const createWindow = () => {
  const userDataPath = app.getPath('userData');
  const token = store.get('token');

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (token) mainWindow.loadFile(path.join(__dirname, 'index.html'));
  else mainWindow.loadFile(path.join(__dirname, './public/login.html'));

  mainWindow.webContents.openDevTools()
  mainWindow.on('closed', () => mainWindow = null); // for garbage collection
};

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
})

ipcMain.on('start-timer', () => {
  mainWindow.webContents.send('start-timer');
});

ipcMain.on('stop-timer', (event, data) => {
  console.log('stop timer', data);
  mainWindow.webContents.send('stop-timer');
})

ipcMain.on('register', (event, data) => { console.log('register', data) });

ipcMain.on('login', (event, data) => {
  store.set('token', data.token);
  mainWindow.loadFile('index.html');
})

ipcMain.on('logout', () => {
  store.delete('token');
  mainWindow.loadFile('./public/login.html');
})