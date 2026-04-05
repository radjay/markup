import { useState, useCallback, useEffect } from 'react'
import { Settings as SettingsIcon, PanelRight } from 'lucide-react'
import { useWorkspace } from './hooks/useWorkspace'
import { useTabs } from './hooks/useTabs'
import { useActiveDocument } from './hooks/useActiveDocument'
import { useAppEvents } from './hooks/useAppEvents'
import { useIOSAppEvents } from './hooks/useIOSAppEvents'
import { WelcomeScreen } from './components/Layout/WelcomeScreen'
import { TabBar } from './components/Layout/TabBar'
import { ExternalChangeBar } from './components/Layout/ExternalChangeBar'
import { EditorPane } from './components/Layout/EditorPane'
import { RightPanel } from './components/Layout/RightPanel'
import { FileTree } from './components/Sidebar/FileTree'
import { RecentFiles } from './components/Sidebar/RecentFiles'
import { SidebarHeader } from './components/Sidebar/SidebarHeader'
import { SettingsModal } from './components/Settings/SettingsModal'
import { RepoPicker } from './components/GitHub/RepoPicker'
import { SegmentedToggle } from './components/ui/SegmentedToggle'
import { ElectronFileService } from '../../lib/platform/ElectronFileService'
import { GitHubFileService } from '../../lib/platform/GitHubFileService'
import { CapacitorStorageService } from '../../lib/platform/CapacitorStorageService'
import { FileServiceProvider } from '../../lib/platform/FileServiceContext'
import { useFileService } from '../../lib/platform/FileServiceContext'
import type { WorkspaceSettings } from '../../shared/types'

const modeOptions = [
  { value: 'review', label: 'Review' },
  { value: 'edit', label: 'Edit' }
]

const isIOS = import.meta.env.MODE === 'ios'

// Platform singletons — created once, never recreated
const iosStorageService = isIOS ? new CapacitorStorageService() : null
const iosFileService = isIOS ? new GitHubFileService(iosStorageService!) : null
const electronFileService = !isIOS ? new ElectronFileService() : null

// ── iOS wrapper that manages PAT state ────────────────────────────────────────

function IOSApp() {
  const [pat, setPat] = useState<string | null>(null)
  const [patLoaded, setPatLoaded] = useState(false)
  const [showRepoPicker, setShowRepoPicker] = useState(false)

  useEffect(() => {
    iosStorageService!.getPAT().then((t) => {
      setPat(t)
      setPatLoaded(true)
    })
  }, [])

  if (!patLoaded) return null

  return (
    <FileServiceProvider value={iosFileService!}>
      <AppInner
        pat={pat}
        onPATChange={async (token) => {
          await iosStorageService!.setPAT(token)
          setPat(token)
        }}
        showRepoPicker={showRepoPicker}
        onOpenRepoPicker={() => setShowRepoPicker(true)}
        onCloseRepoPicker={() => setShowRepoPicker(false)}
      />
    </FileServiceProvider>
  )
}

// ── Shared inner app (both platforms) ────────────────────────────────────────

interface AppInnerProps {
  // iOS-only
  pat?: string | null
  onPATChange?: (token: string) => void
  showRepoPicker?: boolean
  onOpenRepoPicker?: () => void
  onCloseRepoPicker?: () => void
}

function AppInner({
  pat, onPATChange, showRepoPicker, onOpenRepoPicker, onCloseRepoPicker
}: AppInnerProps) {
  const fileService = useFileService()
  const workspace = useWorkspace()
  const tabManager = useTabs(workspace.markViewed, workspace.allSettings.defaultMode)
  const doc = useActiveDocument(tabManager, workspace.autosave, workspace.allSettings.authorName)
  const [showSettings, setShowSettings] = useState(false)

  const toggleSettings = useCallback(() => setShowSettings((s) => !s), [])

  const eventsElectron = useAppEvents(
    { workspace, tabManager, doc, openSettings: toggleSettings }
  )
  const eventsIOS = useIOSAppEvents({ workspace, tabManager, doc })
  const events = isIOS ? eventsIOS : eventsElectron

  const handleSettingChange = useCallback(
    async <K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) => {
      const updated = { ...workspace.allSettings, [key]: value }
      await fileService.saveSettings(updated)
      workspace.reloadSettings(updated)

      // Apply icon change immediately — desktop only
      if (key === 'appIcon' && !isIOS) {
        await window.electronAPI.setAppIcon(value as 'light' | 'dark')
      }
    },
    [workspace, fileService]
  )

  const handleRemoveRepo = useCallback(
    (id: string) => workspace.removeFolder(id),
    [workspace]
  )

  if (!workspace.loaded) return null

  const hasWorkspaces = workspace.folders.length > 0 || tabManager.tabs.length > 0

  if (!hasWorkspaces) {
    return (
      <>
        <WelcomeScreen
          onOpenFile={events.handleOpen}
          onAddFolder={workspace.addFolder}
          onConnectRepo={onOpenRepoPicker}
        />
        <button className="titlebar-settings-btn" onClick={toggleSettings} title="Settings (Cmd+,)">
          <SettingsIcon size={15} />
        </button>
        {showSettings && (
          <SettingsModal
            settings={workspace.allSettings}
            onSettingChange={handleSettingChange}
            onClose={() => setShowSettings(false)}
            pat={pat}
            onPATChange={onPATChange}
            repos={isIOS ? workspace.allSettings.repos ?? [] : undefined}
            onAddRepo={onOpenRepoPicker}
            onRemoveRepo={isIOS ? handleRemoveRepo : undefined}
          />
        )}
        {showRepoPicker && (
          <RepoPicker
            githubService={iosFileService!}
            onAdd={async (repo) => {
              await workspace.addRepo(repo)
              onCloseRepoPicker?.()
            }}
            onClose={() => onCloseRepoPicker?.()}
          />
        )}
      </>
    )
  }

  // Build folder entries for FileTree — include displayName for GitHub repos
  const folderEntries = workspace.folders.map((f) => ({
    path: f,
    files: workspace.folderFiles.get(f) || [],
    displayName: workspace.folderGitInfo.get(f)?.name,
  }))

  return (
    <div className="app" style={{ '--editor-font-size': `${workspace.allSettings.fontSize}px` } as React.CSSProperties}>
      <div className="titlebar-drag">
        <div className="titlebar-actions">
          {tabManager.activeTab && (
            <button
              className={`titlebar-settings-btn ${workspace.allSettings.rightPanelOpen ? 'active' : ''}`}
              onClick={() => handleSettingChange('rightPanelOpen', !workspace.allSettings.rightPanelOpen)}
              title="Toggle right panel"
            >
              <PanelRight size={15} />
            </button>
          )}
          <button className="titlebar-settings-btn" onClick={toggleSettings} title="Settings (Cmd+,)">
            <SettingsIcon size={15} />
          </button>
        </div>
      </div>

      <div className="main-content">
        <aside className="sidebar">
          <SidebarHeader
            mode={workspace.sidebarMode}
            onModeChange={workspace.setSidebarMode}
            onAddFolder={workspace.addFolder}
            onAddRepo={onOpenRepoPicker}
          />
          <div className="sidebar-content">
            {workspace.sidebarMode === 'tree' ? (
              <FileTree
                folders={folderEntries}
                gitInfo={workspace.folderGitInfo}
                currentFile={tabManager.activeTab?.filePath || null}
                onSelectFile={events.handleSelectFile}
                onDoubleClickFile={events.handlePinFile}
                onRemoveFolder={workspace.removeFolder}
              />
            ) : (
              <RecentFiles
                files={workspace.recentFiles}
                currentFile={tabManager.activeTab?.filePath || null}
                viewedFiles={workspace.viewedFiles}
                onSelectFile={(path) => events.handleSelectFile('', path)}
                onDoubleClickFile={(path) => events.handlePinFile('', path)}
              />
            )}
          </div>
        </aside>

        <div className="editor-area">
          <TabBar tabManager={tabManager} doc={doc} autosave={workspace.autosave} />
          {doc.showExternalChangeBar && (
            <ExternalChangeBar
              hasUnsavedChanges={tabManager.activeTab?.hasUnsavedChanges ?? false}
              onReload={doc.reloadFile}
              onDismiss={doc.dismissExternalChange}
            />
          )}
          {doc.saveError && (
            <div className="save-error-bar">
              <span>Save failed: {doc.saveError}</span>
              <button onClick={doc.dismissSaveError}>Dismiss</button>
            </div>
          )}
          <EditorPane
            activeTab={tabManager.activeTab}
            doc={doc}
            onScrollChange={(scrollTop) => tabManager.updateActiveTab({ scrollTop })}
          />
          {tabManager.activeTab && (
            <div className="floating-mode-toggle">
              <SegmentedToggle
                options={modeOptions}
                value={tabManager.activeTab.mode}
                onChange={() => doc.modeToggle()}
              />
            </div>
          )}
        </div>

        {tabManager.activeTab && workspace.allSettings.rightPanelOpen && (
          <RightPanel activeTab={tabManager.activeTab} doc={doc} />
        )}
      </div>

      {showSettings && (
        <SettingsModal
          settings={workspace.allSettings}
          onSettingChange={handleSettingChange}
          onClose={() => setShowSettings(false)}
          pat={pat}
          onPATChange={onPATChange}
          repos={isIOS ? workspace.allSettings.repos ?? [] : undefined}
          onAddRepo={onOpenRepoPicker}
          onRemoveRepo={isIOS ? handleRemoveRepo : undefined}
        />
      )}

      {showRepoPicker && (
        <RepoPicker
          githubService={iosFileService!}
          onAdd={async (repo) => {
            await workspace.addRepo(repo)
            onCloseRepoPicker?.()
          }}
          onClose={() => onCloseRepoPicker?.()}
        />
      )}
    </div>
  )
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  if (isIOS) {
    return <IOSApp />
  }

  return (
    <FileServiceProvider value={electronFileService!}>
      <AppInner />
    </FileServiceProvider>
  )
}
