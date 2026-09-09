import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import { join } from 'path'
import Store from 'electron-store'

const store = new Store<{ theme: 'light' | 'dark' | 'system' }>()

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    title: 'Numio',
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('get-theme', () => store.get('theme', 'system'))
ipcMain.handle('set-theme', (_event, theme: 'light' | 'dark' | 'system') => {
  store.set('theme', theme)
  if (theme === 'system') {
    nativeTheme.themeSource = 'system'
  } else {
    nativeTheme.themeSource = theme
  }
})
ipcMain.handle('get-app-version', () => app.getVersion())
