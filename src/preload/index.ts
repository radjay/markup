import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc-channels'
import type { FileData } from '../shared/types'

const api = {
  openFile: (): Promise<FileData | null> => ipcRenderer.invoke(IPC.OPEN_FILE),
  readFile: (filePath: string): Promise<FileData> => ipcRenderer.invoke(IPC.READ_FILE, filePath),
  saveFile: (filePath: string, content: string): Promise<FileData> =>
    ipcRenderer.invoke(IPC.SAVE_FILE, filePath, content)
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type ElectronAPI = typeof api
