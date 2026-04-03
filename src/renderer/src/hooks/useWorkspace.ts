import { useState, useCallback, useEffect } from 'react'
import type { FileEntry, WatchedFile, WorkspaceSettings } from '../../../shared/types'

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
  setSidebarMode: (mode: SidebarMode) => Promise<void>
  reloadSettings: (settings: WorkspaceSettings) => void
  markViewed: (filePath: string) => void
}

export function useWorkspace(): WorkspaceState {
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
      const files = await window.electronAPI.listDirectory(folder)
      setFolderFiles((prev) => new Map(prev).set(folder, files))
    }
    if (currentFolders.length > 0) {
      const recent = await window.electronAPI.listRecentFiles()
      setRecentFiles(recent)
    }
  }, [])

  // Load settings on startup
  useEffect(() => {
    (async () => {
      const settings = await window.electronAPI.loadSettings()
      setFolders(settings.folders)
      setSidebarModeState(settings.sidebarMode)
      setAutosave(settings.autosave ?? true)
      setAllSettings(settings)
      setLoaded(true)
      await refreshAll(settings.folders)
      const gitInfo = await window.electronAPI.getGitInfo()
      setFolderGitInfo(new Map(Object.entries(gitInfo)))
    })()
  }, [refreshAll])

  // Listen for chokidar events
  useEffect(() => {
    const refresh = () => refreshAll(folders)
    const cleanups = [
      window.electronAPI.onFileAdded(refresh),
      window.electronAPI.onFileRemoved(refresh)
    ]
    return () => cleanups.forEach((c) => c())
  }, [folders, refreshAll])

  const addFolder = useCallback(async () => {
    const folder = await window.electronAPI.addFolder()
    if (folder) {
      setFolders((prev) => (prev.includes(folder) ? prev : [...prev, folder]))
      const files = await window.electronAPI.listDirectory(folder)
      setFolderFiles((prev) => new Map(prev).set(folder, files))
      const recent = await window.electronAPI.listRecentFiles()
      setRecentFiles(recent)
    }
  }, [])

  const removeFolder = useCallback(async (folder: string) => {
    await window.electronAPI.removeFolder(folder)
    setFolders((prev) => prev.filter((f) => f !== folder))
    setFolderFiles((prev) => {
      const next = new Map(prev)
      next.delete(folder)
      return next
    })
    const recent = await window.electronAPI.listRecentFiles()
    setRecentFiles(recent)
  }, [])

  const setSidebarMode = useCallback(
    async (mode: SidebarMode) => {
      setSidebarModeState(mode)
      const updated = { ...allSettings, folders, sidebarMode: mode, autosave }
      setAllSettings(updated)
      await window.electronAPI.saveSettings(updated)
      if (mode === 'recent') {
        const recent = await window.electronAPI.listRecentFiles()
        setRecentFiles(recent)
      }
    },
    [folders, autosave, allSettings]
  )

  const reloadSettings = useCallback((settings: WorkspaceSettings) => {
    setAllSettings(settings)
    setFolders(settings.folders)
    setSidebarModeState(settings.sidebarMode)
    setAutosave(settings.autosave ?? true)
  }, [])

  const markViewed = useCallback((filePath: string) => {
    setViewedFiles((prev) => new Set(prev).add(filePath))
  }, [])

  return {
    loaded, folders, sidebarMode, autosave, allSettings, folderFiles, folderGitInfo, recentFiles, viewedFiles,
    addFolder, removeFolder, setSidebarMode, reloadSettings, markViewed
  }
}
