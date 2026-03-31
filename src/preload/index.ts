import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc-channels'
import type { FileData, FileEntry, WorkspaceSettings, WatchedFile } from '../shared/types'

const api = {
  openFile: (): Promise<FileData | null> => ipcRenderer.invoke(IPC.OPEN_FILE),
  openDirectory: (): Promise<string | null> => ipcRenderer.invoke(IPC.OPEN_DIRECTORY),
  readFile: (filePath: string): Promise<FileData> => ipcRenderer.invoke(IPC.READ_FILE, filePath),
  saveFile: (filePath: string, content: string): Promise<FileData> =>
    ipcRenderer.invoke(IPC.SAVE_FILE, filePath, content),
  listDirectory: (dirPath: string): Promise<FileEntry[]> =>
    ipcRenderer.invoke(IPC.LIST_DIRECTORY, dirPath),
  watchFile: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC.WATCH_FILE, filePath),
  unwatchFile: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC.UNWATCH_FILE, filePath),

  // Settings
  loadSettings: (): Promise<WorkspaceSettings> => ipcRenderer.invoke(IPC.SETTINGS_LOAD),
  saveSettings: (settings: WorkspaceSettings): Promise<boolean> =>
    ipcRenderer.invoke(IPC.SETTINGS_SAVE, settings),

  // Folder management
  addFolder: (): Promise<string | null> => ipcRenderer.invoke(IPC.ADD_FOLDER),
  removeFolder: (folder: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC.REMOVE_FOLDER, folder),
  listRecentFiles: (): Promise<WatchedFile[]> => ipcRenderer.invoke(IPC.LIST_RECENT_FILES),
  getGitInfo: (): Promise<Record<string, { name: string; branch: string }>> =>
    ipcRenderer.invoke('folder:gitInfo'),

  // Events
  onFileChanged: (callback: (filePath: string) => void) => {
    const handler = (_event: unknown, filePath: string) => callback(filePath)
    ipcRenderer.on(IPC.FILE_CHANGED, handler)
    return () => ipcRenderer.removeListener(IPC.FILE_CHANGED, handler)
  },
  onFileAdded: (callback: (filePath: string, folder: string) => void) => {
    const handler = (_event: unknown, filePath: string, folder: string) => callback(filePath, folder)
    ipcRenderer.on(IPC.FILE_ADDED, handler)
    return () => ipcRenderer.removeListener(IPC.FILE_ADDED, handler)
  },
  onFileRemoved: (callback: (filePath: string, folder: string) => void) => {
    const handler = (_event: unknown, filePath: string, folder: string) => callback(filePath, folder)
    ipcRenderer.on(IPC.FILE_REMOVED, handler)
    return () => ipcRenderer.removeListener(IPC.FILE_REMOVED, handler)
  },

  // Menu events
  onMenuOpenFile: (callback: () => void) => {
    ipcRenderer.on('menu:openFile', callback)
    return () => ipcRenderer.removeListener('menu:openFile', callback)
  },
  onMenuAddFolder: (callback: () => void) => {
    ipcRenderer.on('menu:addFolder', callback)
    return () => ipcRenderer.removeListener('menu:addFolder', callback)
  },
  onMenuSave: (callback: () => void) => {
    ipcRenderer.on('menu:save', callback)
    return () => ipcRenderer.removeListener('menu:save', callback)
  },
  onMenuToggleMode: (callback: () => void) => {
    ipcRenderer.on('menu:toggleMode', callback)
    return () => ipcRenderer.removeListener('menu:toggleMode', callback)
  },

  // CLI: open file from command line
  onCliOpenFile: (callback: (filePath: string) => void) => {
    const handler = (_event: unknown, filePath: string) => callback(filePath)
    ipcRenderer.on('cli:openFile', handler)
    return () => ipcRenderer.removeListener('cli:openFile', handler)
  },

  // Drag and drop
  handleDrop: (filePath: string): Promise<{ type: 'file'; filePath: string; content: string } | { type: 'directory'; dirPath: string } | null> =>
    ipcRenderer.invoke('drop:file', filePath)
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type ElectronAPI = typeof api
