import type { FileEntry, WorkspaceSettings, WatchedFile, FileData } from '../../shared/types'
import type { FileService, Workspace } from './FileService'

export class ElectronFileService implements FileService {
  async listWorkspaces(): Promise<Workspace[]> {
    const settings = await window.electronAPI.loadSettings()
    return settings.folders.map((folderPath) => ({
      id: folderPath,
      type: 'local' as const,
      path: folderPath
    }))
  }

  async addWorkspace(): Promise<Workspace | null> {
    const folder = await window.electronAPI.addFolder()
    if (!folder) return null
    return { id: folder, type: 'local', path: folder }
  }

  async removeWorkspace(id: string): Promise<void> {
    await window.electronAPI.removeFolder(id)
  }

  async listDirectory(workspaceId: string, path?: string): Promise<FileEntry[]> {
    return window.electronAPI.listDirectory(path ?? workspaceId)
  }

  async readFile(_workspaceId: string, path: string): Promise<FileData & { sha?: string }> {
    const result = await window.electronAPI.readFile(path)
    return { ...result, sha: undefined }
  }

  async saveFile(_workspaceId: string, path: string, content: string, _sha?: string): Promise<{ sha?: string }> {
    await window.electronAPI.saveFile(path, content)
    return {}
  }

  async watchFile(path: string): Promise<void> {
    await window.electronAPI.watchFile(path)
  }

  async unwatchFile(path: string): Promise<void> {
    await window.electronAPI.unwatchFile(path)
  }

  async getWorkspaceMetadata(): Promise<Record<string, { name: string; branch: string }>> {
    return window.electronAPI.getGitInfo()
  }

  async listRecentFiles(): Promise<WatchedFile[]> {
    return window.electronAPI.listRecentFiles()
  }

  async loadSettings(): Promise<WorkspaceSettings> {
    return window.electronAPI.loadSettings()
  }

  async saveSettings(settings: WorkspaceSettings): Promise<void> {
    await window.electronAPI.saveSettings(settings)
  }

  onFileChanged(cb: (path: string) => void): () => void {
    return window.electronAPI.onFileChanged(cb)
  }

  onFileAdded(cb: (filePath: string, folder?: string) => void): () => void {
    return window.electronAPI.onFileAdded(cb)
  }

  onFileRemoved(cb: (filePath: string, folder?: string) => void): () => void {
    return window.electronAPI.onFileRemoved(cb)
  }
}
