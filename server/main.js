const { app, BrowserWindow } = require('electron');
const path = require('path');
const { initWebSocketServer } = require('./websocketServer.js');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 700,
        height: 500,
        icon: path.join(__dirname, '..', 'public', 'assets', 'images', 'and.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        },
        autoHideMenuBar: true,
        show: false  
    });


    mainWindow.loadFile(path.join(__dirname, '..', 'public', 'splash.html'));

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        setTimeout(() => {
           
            mainWindow.loadFile(path.join(__dirname, '..', 'public', 'index.html'));
           
            mainWindow.webContents.once('did-finish-load', () => {
                initWebSocketServer(mainWindow.webContents);
            });
        }, 10000);
    });
}

app.whenReady().then(() => {
    createWindow();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
