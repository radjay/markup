import { useCallback } from 'react'
import type { WorkspaceState } from './useWorkspace'
import type { TabManager } from './useTabs'
import type { ActiveDocumentState } from './useActiveDocument'
import { useFileService } from '../../../lib/platform/FileServiceContext'

interface AppEventDeps {
  workspace: WorkspaceState
  tabManager: TabManager
  doc: ActiveDocumentState
}

/**
 * iOS platform events hook — no Electron menu events, no CLI polling, no drag-drop.
 * Mirrors the return signature of useAppEvents so App.tsx can swap them based on build mode.
 */
export function useIOSAppEvents({ tabManager }: AppEventDeps) {
  const fileService = useFileService()

  const handleOpen = useCallback(async () => {
    // No file-open dialog on iOS; files are opened from the sidebar tree
  }, [])

  const handleSelectFile = useCallback(
    async (workspaceId: string, path: string) => {
      try {
        const result = await fileService.readFile(workspaceId, path)
        tabManager.openFileInTab(result.filePath, result.content, false, result.sha, workspaceId)
      } catch (err) {
        console.error('Failed to open file', path, err)
      }
    },
    [tabManager, fileService]
  )

  const handlePinFile = useCallback(
    async (workspaceId: string, path: string) => {
      const existingIndex = tabManager.tabs.findIndex((t) => t.filePath === path)
      if (existingIndex >= 0) {
        tabManager.updateTab(existingIndex, { pinned: true })
        return
      }
      try {
        const result = await fileService.readFile(workspaceId, path)
        tabManager.openFileInTab(result.filePath, result.content, true, result.sha, workspaceId)
      } catch (err) {
        console.error('Failed to open file', path, err)
      }
    },
    [tabManager, fileService]
  )

  return { handleOpen, handleSelectFile, handlePinFile }
}
