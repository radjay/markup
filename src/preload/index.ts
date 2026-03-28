import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc-channels'
import type { FileData, FileEntry } from '../shared/types'

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
  onFileChanged: (callback: (filePath: string) => void) => {
    const handler = (_event: unknown, filePath: string) => callback(filePath)
    ipcRenderer.on(IPC.FILE_CHANGED, handler)
    return () => ipcRenderer.removeListener(IPC.FILE_CHANGED, handler)
  }
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type ElectronAPI = typeof api
