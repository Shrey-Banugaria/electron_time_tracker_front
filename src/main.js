const { app, BrowserWindow, ipcMain  } = require('electron')
const path = require('path')
const fs = require('fs/promises');
const Store = require('electron-store');

if (require('electron-squirrel-startup')) app.quit()

const store = new Store();
let mainWindow;
const token = store.get('token');

const createWindow = () => {
  const userDataPath = app.getPath('userData');

  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  // store.delete('token');
  // console.log('Token: ' + token)
  if (token) mainWindow.loadFile(path.join(__dirname, 'index.html'));
  else mainWindow.loadFile(path.join(__dirname, './public/login.html'));

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
  mainWindow.loadFile('index.html');
})

ipcMain.on('logout', () => {
  store.delete('token');
  mainWindow.loadFile('./public/login.html');
})

ipcMain.on('getToken', (event) => {
  event.reply('sendToken', token);
})