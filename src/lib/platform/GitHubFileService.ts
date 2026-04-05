import type { FileData, FileEntry, WorkspaceSettings, WatchedFile, GitHubRepo } from '../../shared/types'
import type { FileService, Workspace } from './FileService'
import type { CapacitorStorageService } from './CapacitorStorageService'
import { GitHubClient } from '../github/GitHubClient'
import { GitHubAuthError, GitHubNotFoundError } from '../github/types'
import type { GitHubTreeEntry } from '../github/types'

const DEFAULT_SETTINGS: WorkspaceSettings = {
  folders: [],
  repos: [],
  sidebarMode: 'recent',
  autosave: true,
  appIcon: 'light',
  defaultMode: 'review',
  fontSize: 15,
  authorName: '',
  rightPanelOpen: false,
}

export class GitHubFileService implements FileService {
  private settingsCache: WorkspaceSettings | null = null

  constructor(private storageService: CapacitorStorageService) {}

  // ── Auth ──────────────────────────────────────────────────────────────────

  private async getToken(): Promise<string> {
    const token = await this.storageService.getPAT()
    if (!token) throw new GitHubAuthError('No GitHub PAT configured', 401)
    return token
  }

  private getClient(token: string): GitHubClient {
    return new GitHubClient(token)
  }

  // ── Settings cache ────────────────────────────────────────────────────────

  private async ensureSettings(): Promise<WorkspaceSettings> {
    if (!this.settingsCache) {
      const stored = await this.storageService.getSettings()
      this.settingsCache = { ...DEFAULT_SETTINGS, ...(stored ?? {}) }
    }
    return this.settingsCache
  }

  private async getRepo(workspaceId: string): Promise<GitHubRepo> {
    const settings = await this.ensureSettings()
    const repo = settings.repos.find((r) => r.id === workspaceId)
    if (!repo) throw new GitHubNotFoundError(`Workspace ${workspaceId} not found`, 404)
    return repo
  }

  // ── FileService: Workspaces ───────────────────────────────────────────────

  async listWorkspaces(): Promise<Workspace[]> {
    const settings = await this.ensureSettings()
    return settings.repos.map((repo) => ({
      id: repo.id,
      type: 'github' as const,
      repo,
    }))
  }

  async addWorkspace(): Promise<Workspace | null> {
    // Repos are added through RepoPicker UI; this is intentionally a no-op
    return null
  }

  async removeWorkspace(id: string): Promise<void> {
    const settings = await this.ensureSettings()
    const updated = { ...settings, repos: settings.repos.filter((r) => r.id !== id) }
    await this.saveSettings(updated)
  }

  // ── FileService: File tree ────────────────────────────────────────────────

  async listDirectory(workspaceId: string): Promise<FileEntry[]> {
    const token = await this.getToken()
    const repo = await this.getRepo(workspaceId)
    const client = this.getClient(token)
    const treeSha = await client.getBranchSha(repo.owner, repo.repo, repo.branch)
    const entries = await client.getRepoTree(repo.owner, repo.repo, treeSha, repo.rootPath)
    return buildFileTree(entries, repo.rootPath)
  }

  // ── FileService: File I/O ─────────────────────────────────────────────────

  async readFile(workspaceId: string, path: string): Promise<FileData & { sha?: string }> {
    const token = await this.getToken()
    const repo = await this.getRepo(workspaceId)
    const client = this.getClient(token)
    const { content, sha } = await client.getFileContent(repo.owner, repo.repo, path, repo.branch)
    return { filePath: path, content, sha }
  }

  async saveFile(
    workspaceId: string,
    path: string,
    content: string,
    sha?: string
  ): Promise<{ sha?: string }> {
    const token = await this.getToken()
    const repo = await this.getRepo(workspaceId)
    const client = this.getClient(token)
    const filename = path.split('/').pop() || path
    const message = `Markup review: ${filename}`
    if (sha === undefined) {
      throw new Error(`Cannot save ${path}: file SHA is missing. Re-open the file to refresh its SHA before saving.`)
    }
    const result = await client.putFileContent(repo.owner, repo.repo, path, content, sha, message)
    return { sha: result.sha }
  }

  // ── FileService: Tab lifecycle (no-ops on iOS) ────────────────────────────

  watchFile(_path: string): Promise<void> {
    return Promise.resolve()
  }

  unwatchFile(_path: string): Promise<void> {
    return Promise.resolve()
  }

  // ── FileService: Workspace metadata ──────────────────────────────────────

  async getWorkspaceMetadata(): Promise<Record<string, { name: string; branch: string }>> {
    const settings = await this.ensureSettings()
    const result: Record<string, { name: string; branch: string }> = {}
    for (const repo of settings.repos) {
      result[repo.id] = { name: repo.repo, branch: repo.branch }
    }
    return result
  }

  // ── FileService: Recents (not tracked on iOS) ─────────────────────────────

  async listRecentFiles(): Promise<WatchedFile[]> {
    return []
  }

  // ── FileService: Settings ─────────────────────────────────────────────────

  async loadSettings(): Promise<WorkspaceSettings> {
    return this.ensureSettings()
  }

  async saveSettings(settings: WorkspaceSettings): Promise<void> {
    this.settingsCache = settings
    await this.storageService.saveSettings(settings)
  }

  // ── FileService: Change events (no-ops on iOS) ────────────────────────────

  onFileChanged(_cb: (path: string) => void): () => void {
    return () => {}
  }

  onFileAdded(_cb: (filePath: string, folder?: string) => void): () => void {
    return () => {}
  }

  onFileRemoved(_cb: (filePath: string, folder?: string) => void): () => void {
    return () => {}
  }

  // ── GitHub-specific: list available repos for RepoPicker ─────────────────

  async listAvailableRepos(): Promise<Array<{ owner: string; repo: string; branch: string }>> {
    const token = await this.getToken()
    const client = this.getClient(token)
    const repos = await client.listRepos()
    return repos.map((r) => ({ owner: r.owner, repo: r.repo, branch: r.branch }))
  }

  async listBranches(owner: string, repo: string): Promise<string[]> {
    const token = await this.getToken()
    const client = this.getClient(token)
    return client.listBranches(owner, repo)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Converts a flat list of GitHub tree entries (all blobs, all .md) into
 * a hierarchical FileEntry tree by synthesising intermediate directory nodes.
 */
function buildFileTree(entries: GitHubTreeEntry[], rootPath?: string): FileEntry[] {
  const root: FileEntry[] = []
  const dirMap = new Map<string, FileEntry>()

  // Prefix to strip from paths when rootPath is set
  const prefix = rootPath ? (rootPath.endsWith('/') ? rootPath : rootPath + '/') : ''

  for (const entry of entries) {
    const relativePath = prefix ? entry.path.slice(prefix.length) : entry.path
    const parts = relativePath.split('/')

    // Ensure all ancestor directories exist in the tree
    for (let depth = 1; depth < parts.length; depth++) {
      const absDirPath = prefix + parts.slice(0, depth).join('/')

      if (!dirMap.has(absDirPath)) {
        const dirEntry: FileEntry = {
          name: parts[depth - 1],
          path: absDirPath,
          isDirectory: true,
          children: [],
        }
        dirMap.set(absDirPath, dirEntry)

        if (depth === 1) {
          root.push(dirEntry)
        } else {
          const parentAbsPath = prefix + parts.slice(0, depth - 1).join('/')
          dirMap.get(parentAbsPath)!.children!.push(dirEntry)
        }
      }
    }

    // Add the file itself to its parent
    const fileEntry: FileEntry = {
      name: parts[parts.length - 1],
      path: entry.path, // full GitHub path (used for API calls)
      isDirectory: false,
    }

    if (parts.length === 1) {
      root.push(fileEntry)
    } else {
      const parentAbsPath = prefix + parts.slice(0, parts.length - 1).join('/')
      dirMap.get(parentAbsPath)!.children!.push(fileEntry)
    }
  }

  return root
}
