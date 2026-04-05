import { useState, useCallback, useEffect } from 'react'
import type { FileEntry, WatchedFile, WorkspaceSettings, GitHubRepo } from '../../../shared/types'
import { useFileService } from '../../../lib/platform/FileServiceContext'

export type SidebarMode = 'tree' | 'recent'

export interface WorkspaceState {
  loaded: boolean
  folders: string[]
  sidebarMode: SidebarMode
  autosave: boolean
  allSettings: WorkspaceSettings
  folderFiles: Map<string, FileEntry[]>
  folderGitInfo: Map<string, { name: string; branch: string }>
  recentFiles: WatchedFile[]
  viewedFiles: Set<string>
  addFolder: () => Promise<void>
  removeFolder: (folder: string) => Promise<void>
  addRepo: (repo: GitHubRepo) => Promise<void>
  setSidebarMode: (mode: SidebarMode) => Promise<void>
  reloadSettings: (settings: WorkspaceSettings) => void
  markViewed: (filePath: string) => void
}

export function useWorkspace(): WorkspaceState {
  const fileService = useFileService()
  const [loaded, setLoaded] = useState(false)
  const [folders, setFolders] = useState<string[]>([])
  const [sidebarMode, setSidebarModeState] = useState<SidebarMode>('recent')
  const [folderFiles, setFolderFiles] = useState<Map<string, FileEntry[]>>(new Map())
  const [recentFiles, setRecentFiles] = useState<WatchedFile[]>([])
  const [autosave, setAutosave] = useState(true)
  const [viewedFiles, setViewedFiles] = useState<Set<string>>(new Set())
  const [folderGitInfo, setFolderGitInfo] = useState<Map<string, { name: string; branch: string }>>(new Map())
  const [allSettings, setAllSettings] = useState<WorkspaceSettings>({
    folders: [],
    repos: [],
    sidebarMode: 'recent',
    autosave: true,
    appIcon: 'light',
    defaultMode: 'review',
    fontSize: 15,
    authorName: '',
    rightPanelOpen: false
  })

  const refreshAll = useCallback(async (currentFolders: string[]) => {
    for (const folder of currentFolders) {
      const files = await fileService.listDirectory(folder)
      setFolderFiles((prev) => new Map(prev).set(folder, files))
    }
    if (currentFolders.length > 0) {
      const recent = await fileService.listRecentFiles()
      setRecentFiles(recent)
    }
  }, [fileService])

  // Load settings on startup
  useEffect(() => {
    (async () => {
      const settings = await fileService.loadSettings()
      // Combine local folders and GitHub repo IDs into a single workspace list
      const repoIds = (settings.repos ?? []).map((r) => r.id)
      const allWorkspaceIds = [...settings.folders, ...repoIds]
      setFolders(allWorkspaceIds)
      setSidebarModeState(settings.sidebarMode)
      setAutosave(settings.autosave ?? true)
      setAllSettings(settings)
      setLoaded(true)
      await refreshAll(allWorkspaceIds)
      const gitInfo = await fileService.getWorkspaceMetadata()
      setFolderGitInfo(new Map(Object.entries(gitInfo)))
    })()
  }, [refreshAll, fileService])

  // Listen for chokidar events
  useEffect(() => {
    const refresh = () => refreshAll(folders)
    const cleanups = [
      fileService.onFileAdded(refresh),
      fileService.onFileRemoved(refresh)
    ]
    return () => cleanups.forEach((c) => c())
  }, [folders, refreshAll, fileService])

  const addFolder = useCallback(async () => {
    const workspace = await fileService.addWorkspace()
    if (workspace) {
      const folder = workspace.path ?? workspace.id
      setFolders((prev) => (prev.includes(folder) ? prev : [...prev, folder]))
      const files = await fileService.listDirectory(folder)
      setFolderFiles((prev) => new Map(prev).set(folder, files))
      const recent = await fileService.listRecentFiles()
      setRecentFiles(recent)
    }
  }, [fileService])

  const removeFolder = useCallback(async (folder: string) => {
    await fileService.removeWorkspace(folder)
    setFolders((prev) => prev.filter((f) => f !== folder))
    setFolderFiles((prev) => {
      const next = new Map(prev)
      next.delete(folder)
      return next
    })
    const recent = await fileService.listRecentFiles()
    setRecentFiles(recent)
  }, [fileService])

  const setSidebarMode = useCallback(
    async (mode: SidebarMode) => {
      setSidebarModeState(mode)
      const updated = { ...allSettings, folders, sidebarMode: mode, autosave }
      setAllSettings(updated)
      await fileService.saveSettings(updated)
      if (mode === 'recent') {
        const recent = await fileService.listRecentFiles()
        setRecentFiles(recent)
      }
    },
    [folders, autosave, allSettings, fileService]
  )

  const reloadSettings = useCallback((settings: WorkspaceSettings) => {
    setAllSettings(settings)
    setFolders(settings.folders)
    setSidebarModeState(settings.sidebarMode)
    setAutosave(settings.autosave ?? true)
  }, [])

  const addRepo = useCallback(async (repo: GitHubRepo) => {
    const updated = { ...allSettings, repos: [...(allSettings.repos ?? []), repo] }
    await fileService.saveSettings(updated)
    setAllSettings(updated)
    setFolders((prev) => (prev.includes(repo.id) ? prev : [...prev, repo.id]))
    try {
      const files = await fileService.listDirectory(repo.id)
      setFolderFiles((prev) => new Map(prev).set(repo.id, files))
    } catch (err) {
      console.error('Failed to list repo directory', err)
    }
    const gitInfo = await fileService.getWorkspaceMetadata()
    setFolderGitInfo(new Map(Object.entries(gitInfo)))
  }, [allSettings, fileService])

  const markViewed = useCallback((filePath: string) => {
    setViewedFiles((prev) => new Set(prev).add(filePath))
  }, [])

  return {
    loaded, folders, sidebarMode, autosave, allSettings, folderFiles, folderGitInfo, recentFiles, viewedFiles,
    addFolder, removeFolder, addRepo, setSidebarMode, reloadSettings, markViewed
  }
}
