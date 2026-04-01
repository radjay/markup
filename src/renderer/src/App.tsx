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

export default function App() {
  const workspace = useWorkspace()
  const tabManager = useTabs(workspace.markViewed)
  const doc = useActiveDocument(tabManager, workspace.autosave)
  const events = useAppEvents({ workspace, tabManager, doc })

  if (!workspace.loaded) return null

  if (tabManager.tabs.length === 0 && workspace.folders.length === 0) {
    return <WelcomeScreen onOpenFile={events.handleOpen} onAddFolder={workspace.addFolder} />
  }

  const folderEntries = workspace.folders.map((f) => ({
    path: f,
    files: workspace.folderFiles.get(f) || []
  }))

  return (
    <div className="app">
      <div className="titlebar-drag" />

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
        </div>

        {tabManager.activeTab && <RightPanel activeTab={tabManager.activeTab} doc={doc} />}
      </div>
    </div>
  )
}
