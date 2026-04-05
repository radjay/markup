import type { FileData, FileEntry, WorkspaceSettings, WatchedFile } from '../../shared/types'

// Workspace is defined here until GitHubRepo is added to shared types in Unit 3
export interface GitHubRepo {
  owner: string
  repo: string
  branch: string
}

export interface Workspace {
  id: string
  type: 'local' | 'github'
  path?: string
  repo?: GitHubRepo
}

export interface FileService {
  listWorkspaces(): Promise<Workspace[]>
  addWorkspace(): Promise<Workspace | null>
  removeWorkspace(id: string): Promise<void>
  listDirectory(workspaceId: string, path?: string): Promise<FileEntry[]>
  readFile(workspaceId: string, path: string): Promise<FileData & { sha?: string }>
  saveFile(workspaceId: string, path: string, content: string, sha?: string): Promise<{ sha?: string }>
  watchFile(path: string): Promise<void>
  unwatchFile(path: string): Promise<void>
  getWorkspaceMetadata(): Promise<Record<string, { name: string; branch: string }>>
  listRecentFiles(): Promise<WatchedFile[]>
  loadSettings(): Promise<WorkspaceSettings>
  saveSettings(settings: WorkspaceSettings): Promise<void>
  onFileChanged(cb: (path: string) => void): () => void
  onFileAdded(cb: (filePath: string, folder?: string) => void): () => void
  onFileRemoved(cb: (filePath: string, folder?: string) => void): () => void
}
