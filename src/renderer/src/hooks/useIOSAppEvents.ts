import type { WorkspaceState } from './useWorkspace'
import type { TabManager } from './useTabs'
import type { ActiveDocumentState } from './useActiveDocument'

interface AppEventDeps {
  workspace: WorkspaceState
  tabManager: TabManager
  doc: ActiveDocumentState
}

/**
 * iOS platform stub — no menu events, no CLI polling, no drag-drop.
 * Mirrors the signature of useAppEvents so App.tsx can swap them based on build mode.
 */
export function useIOSAppEvents({ tabManager }: AppEventDeps) {
  const handleOpen = async () => { /* no-op on iOS */ }

  const handleSelectFile = async (path: string) => {
    // Basic file open — reads through fileService once it's wired
    void path
  }

  const handlePinFile = async (path: string) => {
    void path
  }

  return { handleOpen, handleSelectFile, handlePinFile }
}
