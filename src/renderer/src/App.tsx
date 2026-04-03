import { useState, useEffect, useCallback } from 'react'
import { Settings as SettingsIcon, PanelRight } from 'lucide-react'
import { useWorkspace } from './hooks/useWorkspace'
import { useTabs } from './hooks/useTabs'
import { useActiveDocument } from './hooks/useActiveDocument'
import { useAppEvents } from './hooks/useAppEvents'
import { WelcomeScreen } from './components/Layout/WelcomeScreen'
import { TabBar } from './components/Layout/TabBar'
import { ExternalChangeBar } from './components/Layout/ExternalChangeBar'
import { EditorPane } from './components/Layout/EditorPane'
import { RightPanel } from './components/Layout/RightPanel'
import { FileTree } from './components/Sidebar/FileTree'
import { RecentFiles } from './components/Sidebar/RecentFiles'
import { SidebarHeader } from './components/Sidebar/SidebarHeader'
import { SettingsModal } from './components/Settings/SettingsModal'
import { SegmentedToggle } from './components/ui/SegmentedToggle'
import type { WorkspaceSettings } from '../../shared/types'

const modeOptions = [
  { value: 'review', label: 'Review' },
  { value: 'edit', label: 'Edit' }
]

export default function App() {
  const workspace = useWorkspace()
  const tabManager = useTabs(workspace.markViewed, workspace.allSettings.defaultMode)
  const doc = useActiveDocument(tabManager, workspace.autosave, workspace.allSettings.authorName)
  const events = useAppEvents({ workspace, tabManager, doc })
  const [showSettings, setShowSettings] = useState(false)

  const toggleSettings = useCallback(() => setShowSettings((s) => !s), [])

  // Listen for menu:openSettings (Cmd+,)
  useEffect(() => {
    return window.electronAPI.onMenuOpenSettings(toggleSettings)
  }, [toggleSettings])

  const handleSettingChange = useCallback(
    async <K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) => {
      const updated = { ...workspace.allSettings, [key]: value }
      await window.electronAPI.saveSettings(updated)
      workspace.reloadSettings(updated)

      // Apply icon change immediately
      if (key === 'appIcon') {
        await window.electronAPI.setAppIcon(value as 'light' | 'dark')
      }
    },
    [workspace]
  )

  if (!workspace.loaded) return null

  if (tabManager.tabs.length === 0 && workspace.folders.length === 0) {
    return (
      <>
        <WelcomeScreen onOpenFile={events.handleOpen} onAddFolder={workspace.addFolder} />
        <button className="titlebar-settings-btn" onClick={toggleSettings} title="Settings (Cmd+,)">
          <SettingsIcon size={15} />
        </button>
        {showSettings && (
          <SettingsModal
            settings={workspace.allSettings}
            onSettingChange={handleSettingChange}
            onClose={() => setShowSettings(false)}
          />
        )}
      </>
    )
  }

  const folderEntries = workspace.folders.map((f) => ({
    path: f,
    files: workspace.folderFiles.get(f) || []
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
                onSelectFile={events.handleSelectFile}
                onDoubleClickFile={events.handlePinFile}
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
        />
      )}
    </div>
  )
}
