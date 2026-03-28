import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { join } from 'path'
import { readFile, writeFile, rename } from 'fs/promises'
import { is } from '@electron-toolkit/utils'
import { IPC } from '../shared/ipc-channels'

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// IPC Handlers

ipcMain.handle(IPC.OPEN_FILE, async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
  })

  if (canceled || filePaths.length === 0) return null

  const filePath = filePaths[0]
  const content = await readFile(filePath, 'utf-8')
  return { filePath, content }
})

ipcMain.handle(IPC.READ_FILE, async (_event, filePath: string) => {
  const content = await readFile(filePath, 'utf-8')
  return { filePath, content }
})

ipcMain.handle(IPC.SAVE_FILE, async (_event, filePath: string, content: string) => {
  const tmpPath = filePath + '.tmp'
  await writeFile(tmpPath, content, 'utf-8')
  await rename(tmpPath, filePath)
  return { filePath }
})

// App lifecycle

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
