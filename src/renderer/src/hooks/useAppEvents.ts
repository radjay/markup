import { useEffect, useCallback } from 'react'
import type { WorkspaceState } from './useWorkspace'
import type { TabManager } from './useTabs'
import type { ActiveDocumentState } from './useActiveDocument'
import { useFileService } from '../../../lib/platform/FileServiceContext'

interface AppEventDeps {
  workspace: WorkspaceState
  tabManager: TabManager
  doc: ActiveDocumentState
  openSettings?: () => void
}

export function useAppEvents({ workspace, tabManager, doc, openSettings }: AppEventDeps) {
  const fileService = useFileService()

  const handleOpen = useCallback(async () => {
    const result = await window.electronAPI.openFile()
    if (result) tabManager.openFileInTab(result.filePath, result.content, true)
  }, [tabManager])

  const handleSelectFile = useCallback(
    async (path: string) => {
      try {
        const result = await fileService.readFile('', path)
        tabManager.openFileInTab(result.filePath, result.content, false, result.sha)
      } catch {
        window.alert(`File not found:\n${path}`)
      }
    },
    [tabManager, fileService]
  )

  const handlePinFile = useCallback(
    async (path: string) => {
      const existingIndex = tabManager.tabs.findIndex((t) => t.filePath === path)
      if (existingIndex >= 0) {
        tabManager.updateTab(existingIndex, { pinned: true })
        return
      }
      try {
        const result = await fileService.readFile('', path)
        tabManager.openFileInTab(result.filePath, result.content, true, result.sha)
      } catch {
        window.alert(`File not found:\n${path}`)
      }
    },
    [tabManager, fileService]
  )

  // Menu events (Electron-only)
  useEffect(() => {
    const cleanups = [
      window.electronAPI.onMenuOpenFile(() => handleOpen()),
      window.electronAPI.onMenuAddFolder(() => workspace.addFolder()),
      window.electronAPI.onMenuSave(() => doc.save()),
      window.electronAPI.onMenuToggleMode(() => doc.modeToggle()),
      ...(openSettings ? [window.electronAPI.onMenuOpenSettings(openSettings)] : [])
    ]
    return () => cleanups.forEach((c) => c())
  }, [handleOpen, workspace, doc, openSettings])

  // Poll for files opened via CLI / open-file event
  useEffect(() => {
    const interval = setInterval(async () => {
      const files = await window.electronAPI.pollPendingFiles()
      for (const filePath of files) {
        handlePinFile(filePath)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [handlePinFile])

  // Drag and drop
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => { e.preventDefault(); e.stopPropagation() }
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault(); e.stopPropagation()
      const files = e.dataTransfer?.files
      if (!files || files.length === 0) return
      const droppedPath = (files[0] as unknown as { path: string }).path
      if (!droppedPath) return
      const result = await window.electronAPI.handleDrop(droppedPath)
      if (!result) return
      if (result.type === 'file') {
        tabManager.openFileInTab(result.filePath, result.content, true)
      } else if (result.type === 'directory') {
        // Dropped folder acts as "Add Folder"
        await fileService.saveSettings({
          ...workspace.allSettings,
          folders: [...workspace.folders, result.dirPath]
        })
        // Trigger a reload by calling addFolder logic
        window.location.reload() // simplest for now
      }
    }
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('drop', handleDrop)
    return () => {
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('drop', handleDrop)
    }
  }, [tabManager, workspace, fileService])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault()
        if (tabManager.activeTabIndex >= 0) tabManager.closeTab(tabManager.activeTabIndex)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [tabManager])

  return { handleOpen, handleSelectFile, handlePinFile }
}
