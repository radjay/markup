import { app, BrowserWindow, dialog, ipcMain, Menu, nativeImage, shell } from 'electron'
import { join, extname, basename } from 'path'
import { readFile, writeFile, readdir } from 'fs/promises'
import { is } from '@electron-toolkit/utils'
import { IPC } from '../shared/ipc-channels'
import type { FileEntry } from '../shared/types'
import { loadSettings, saveSettings, type Settings } from './settings'
import { startWatching, stopAllWatching, listRecentFiles, setWatcherWindow, markSelfSave, getGitInfoForFolders } from './folder-watcher'

let mainWindow: BrowserWindow | null = null

function createWindow(): BrowserWindow {
  const iconPath = join(__dirname, '../../assets/app-icon.png')

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset',
    icon: nativeImage.createFromPath(iconPath),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Share the window reference with folder-watcher so it can send IPC events
  // (same pattern as menu events which use mainWindow?.webContents.send)
  setWatcherWindow(mainWindow)

  // Open external links in system browser, not in the Electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Allow dev server reloads, block everything else
    if (!url.startsWith('http://localhost')) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// ---- Gitignore parsing ----

async function loadGitignorePatterns(rootDir: string): Promise<((path: string, isDir: boolean) => boolean)> {
  const patterns: { negated: boolean; regex: RegExp; dirOnly: boolean }[] = []

  // Always ignore these
  const builtinIgnores = ['node_modules', '.git', 'out', 'dist']
  for (const name of builtinIgnores) {
    patterns.push({ negated: false, regex: new RegExp(`(^|/)${name}(/|$)`), dirOnly: false })
  }

  try {
    const content = await readFile(join(rootDir, '.gitignore'), 'utf-8')
    for (let line of content.split('\n')) {
      line = line.trim()
      if (!line || line.startsWith('#')) continue

      let negated = false
      if (line.startsWith('!')) {
        negated = true
        line = line.slice(1)
      }

      const dirOnly = line.endsWith('/')
      if (dirOnly) line = line.slice(0, -1)

      // Convert gitignore glob to regex
      let pattern = line
        .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape regex chars except * and ?
        .replace(/\*\*/g, '{{GLOBSTAR}}')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]')
        .replace(/\{\{GLOBSTAR\}\}/g, '.*')

      // If pattern doesn't contain /, match against basename
      if (!line.includes('/')) {
        pattern = `(^|/)${pattern}(/|$)`
      } else {
        pattern = `(^|/)${pattern}(/|$)`
      }

      patterns.push({ negated, regex: new RegExp(pattern), dirOnly })
    }
  } catch {
    // No .gitignore — that's fine
  }

  return (relativePath: string, isDir: boolean) => {
    let ignored = false
    for (const p of patterns) {
      if (p.dirOnly && !isDir) continue
      if (p.regex.test(relativePath)) {
        ignored = !p.negated
      }
    }
    return ignored
  }
}

// ---- Directory listing ----

async function listMarkdownFiles(
  dirPath: string,
  depth = 0,
  isIgnored?: (path: string, isDir: boolean) => boolean,
  rootDir?: string
): Promise<FileEntry[]> {
  if (depth > 5) return []

  if (!rootDir) rootDir = dirPath
  if (!isIgnored) isIgnored = await loadGitignorePatterns(rootDir)

  const entries = await readdir(dirPath, { withFileTypes: true })
  const results: FileEntry[] = []

  const sorted = entries
    .filter((e) => !e.name.startsWith('.'))
    .sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1
      return a.name.localeCompare(b.name)
    })

  for (const entry of sorted) {
    const fullPath = join(dirPath, entry.name)
    const relativePath = fullPath.slice(rootDir.length)

    if (isIgnored(relativePath, entry.isDirectory())) continue

    if (entry.isDirectory()) {
      const children = await listMarkdownFiles(fullPath, depth + 1, isIgnored, rootDir)
      if (children.length > 0) {
        results.push({ name: entry.name, path: fullPath, isDirectory: true, children })
      }
    } else {
      const ext = extname(entry.name).toLowerCase()
      if (ext === '.md' || ext === '.markdown') {
        results.push({ name: entry.name, path: fullPath, isDirectory: false })
      }
    }
  }

  return results
}

// ---- IPC Handlers ----

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

ipcMain.handle(IPC.OPEN_DIRECTORY, async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })

  if (canceled || filePaths.length === 0) return null
  return filePaths[0]
})

ipcMain.handle(IPC.READ_FILE, async (_event, filePath: string) => {
  const content = await readFile(filePath, 'utf-8')
  return { filePath, content }
})

ipcMain.handle(IPC.SAVE_FILE, async (_event, filePath: string, content: string) => {
  try {
    markSelfSave(filePath)
    await writeFile(filePath, content, 'utf-8')
    return { filePath, success: true }
  } catch (err) {
    console.error('[Main] Save failed:', err)
    return { filePath, success: false, error: String(err) }
  }
})

ipcMain.handle(IPC.LIST_DIRECTORY, async (_event, dirPath: string) => {
  try {
    return await listMarkdownFiles(dirPath)
  } catch (err) {
    console.error('[Main] List directory failed:', err)
    return []
  }
})

// Per-file watching is now handled by chokidar in folder-watcher.ts
// Keep these as no-ops for backwards compat
ipcMain.handle(IPC.WATCH_FILE, async () => true)
ipcMain.handle(IPC.UNWATCH_FILE, async () => true)

// ---- Settings & Folder Management ----

let currentSettings: Settings = { folders: [], sidebarMode: 'recent' }

ipcMain.handle(IPC.SETTINGS_LOAD, async () => {
  currentSettings = await loadSettings()
  if (currentSettings.folders.length > 0) {
    startWatching(currentSettings.folders)
  }
  return currentSettings
})

ipcMain.handle(IPC.SETTINGS_SAVE, async (_event, settings: Settings) => {
  currentSettings = settings
  await saveSettings(settings)
  return true
})

ipcMain.handle(IPC.ADD_FOLDER, async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  if (canceled || filePaths.length === 0) return null

  const folder = filePaths[0]
  if (currentSettings.folders.includes(folder)) return folder

  currentSettings.folders.push(folder)
  await saveSettings(currentSettings)
  startWatching(currentSettings.folders)
  return folder
})

ipcMain.handle(IPC.REMOVE_FOLDER, async (_event, folder: string) => {
  currentSettings.folders = currentSettings.folders.filter((f) => f !== folder)
  await saveSettings(currentSettings)
  startWatching(currentSettings.folders)
  return true
})

ipcMain.handle(IPC.LIST_RECENT_FILES, async () => {
  return listRecentFiles(currentSettings.folders)
})

ipcMain.handle('folder:gitInfo', async () => {
  return getGitInfoForFolders(currentSettings.folders)
})

// ---- Native Menus ----

function buildMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File…',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu:openFile')
        },
        {
          label: 'Add Folder…',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => mainWindow?.webContents.send('menu:addFolder')
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu:save')
        },
        { type: 'separator' },
        { role: 'close' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Edit Mode',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow?.webContents.send('menu:toggleMode')
        },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ---- Drag and drop IPC ----

ipcMain.handle('drop:file', async (_event, filePath: string) => {
  const ext = extname(filePath).toLowerCase()
  if (ext === '.md' || ext === '.markdown') {
    const content = await readFile(filePath, 'utf-8')
    return { type: 'file' as const, filePath, content }
  }
  // Check if it's a directory
  try {
    const stats = await stat(filePath)
    if (stats.isDirectory()) {
      return { type: 'directory' as const, dirPath: filePath }
    }
  } catch { /* ignore */ }
  return null
})

// ---- CLI: open file from command line ----

const pendingFileOpens: string[] = []

function queueFileOpen(filePath: string): void {
  const absPath = filePath.startsWith('/') ? filePath : join(process.cwd(), filePath)
  const ext = extname(absPath).toLowerCase()
  if (ext !== '.md' && ext !== '.markdown') return
  pendingFileOpens.push(absPath)
}

ipcMain.handle('cli:pendingFiles', async () => {
  return pendingFileOpens.splice(0)
})

// macOS: open-file event fires when files are opened via "open -a" or dropped on dock icon.
// MUST be registered before app.whenReady() to catch events during launch.
app.on('open-file', (event, filePath) => {
  event.preventDefault()
  queueFileOpen(filePath)
  // If app is already running, bring window to front
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

// Single instance lock — second launch sends argv to the running instance
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    const filePath = argv.find((arg) => arg.endsWith('.md') || arg.endsWith('.markdown'))
    if (filePath) queueFileOpen(filePath)
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// ---- App lifecycle ----

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    const dockIcon = nativeImage.createFromPath(join(__dirname, '../../assets/app-icon.png'))
    app.dock.setIcon(dockIcon)
  }

  buildMenu()
  createWindow()

  // Open files passed via command line arguments (direct electron invocation)
  const fileArg = process.argv.find((arg) => arg.endsWith('.md') || arg.endsWith('.markdown'))
  if (fileArg) queueFileOpen(fileArg)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  stopAllWatching()

  if (process.platform !== 'darwin') {
    app.quit()
  }
})
